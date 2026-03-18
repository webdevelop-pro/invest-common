import {
  PWA_PRIVATE_CACHE_NAMES,
  type OfflineCacheScope,
  type ResolvedOfflineDomainPolicy,
} from './pwaPolicy';

const DB_NAME = 'invest-pwa-offline';
const DB_VERSION = 1;
const STORE_NAME = 'responses';

export const PWA_OFFLINE_DATA_UPDATED_EVENT = 'invest:pwa-offline-data-updated';
export const PWA_OFFLINE_RESPONSE_SOURCE_HEADER = 'x-invest-offline-source';
export const PWA_OFFLINE_LAST_SYNC_HEADER = 'x-invest-offline-last-synced-at';

type PersistedPayloadType = 'json' | 'text' | 'blob' | 'arrayBuffer';

type OfflineStoreRecord = {
  key: string;
  url: string;
  domainKey: string;
  scope: OfflineCacheScope;
  status: number;
  updatedAt: string;
  headers: [string, string][];
  payloadType: PersistedPayloadType;
  payload: ArrayBuffer | Blob | string | unknown;
};

export type OfflineStoredResponse<T> = {
  data: T;
  status: number;
  headers: Headers;
  lastSyncedAt: string;
};

const isIndexedDbAvailable = () => (
  typeof window !== 'undefined' && typeof window.indexedDB !== 'undefined'
);

const emitOfflineStoreUpdated = () => {
  if (typeof window === 'undefined') {
    return;
  }

  window.dispatchEvent(new Event(PWA_OFFLINE_DATA_UPDATED_EVENT));
};

const requestToPromise = <T>(request: IDBRequest<T>) => (
  new Promise<T>((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error('IndexedDB request failed'));
  })
);

const transactionDoneToPromise = (transaction: IDBTransaction) => (
  new Promise<void>((resolve, reject) => {
    transaction.oncomplete = () => resolve();
    transaction.onabort = () => reject(transaction.error ?? new Error('IndexedDB transaction aborted'));
    transaction.onerror = () => reject(transaction.error ?? new Error('IndexedDB transaction failed'));
  })
);

const openDatabase = async () => {
  if (!isIndexedDbAvailable()) {
    return null;
  }

  try {
    const request = window.indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = () => {
      const database = request.result;
      if (!database.objectStoreNames.contains(STORE_NAME)) {
        const store = database.createObjectStore(STORE_NAME, { keyPath: 'key' });
        store.createIndex('scope', 'scope', { unique: false });
        store.createIndex('updatedAt', 'updatedAt', { unique: false });
      }
    };

    return await requestToPromise(request);
  } catch {
    return null;
  }
};

const withStore = async <T>(
  mode: IDBTransactionMode,
  handler: (store: IDBObjectStore, transaction: IDBTransaction) => Promise<T>,
) => {
  const database = await openDatabase();
  if (!database) {
    return null;
  }

  try {
    const transaction = database.transaction(STORE_NAME, mode);
    const store = transaction.objectStore(STORE_NAME);
    const result = await handler(store, transaction);
    await transactionDoneToPromise(transaction);
    return result;
  } finally {
    database.close();
  }
};

const createStoreKey = (policy: ResolvedOfflineDomainPolicy, requestUrl: string) => (
  `${policy.key}:${requestUrl}`
);

const createOfflineHeaders = (headers: [string, string][], lastSyncedAt: string) => {
  const nextHeaders = new Headers(headers);
  nextHeaders.set(PWA_OFFLINE_RESPONSE_SOURCE_HEADER, 'offline-cache');
  nextHeaders.set(PWA_OFFLINE_LAST_SYNC_HEADER, lastSyncedAt);
  return nextHeaders;
};

export const readOfflineResponseMetadata = async (
  policy: ResolvedOfflineDomainPolicy,
  requestUrl: string,
) => {
  const key = createStoreKey(policy, requestUrl);
  return withStore('readonly', async (store) => {
    const record = await requestToPromise(store.get(key) as IDBRequest<OfflineStoreRecord | undefined>);
    if (!record) {
      return null;
    }

    return {
      lastSyncedAt: record.updatedAt,
      scope: record.scope,
      domainKey: record.domainKey,
    };
  });
};

export const readOfflineResponse = async <T>(
  policy: ResolvedOfflineDomainPolicy,
  requestUrl: string,
) => {
  const key = createStoreKey(policy, requestUrl);
  return withStore('readonly', async (store) => {
    const record = await requestToPromise(store.get(key) as IDBRequest<OfflineStoreRecord | undefined>);
    if (!record) {
      return null;
    }

    return {
      data: record.payload as T,
      status: record.status,
      headers: createOfflineHeaders(record.headers, record.updatedAt),
      lastSyncedAt: record.updatedAt,
    } satisfies OfflineStoredResponse<T>;
  });
};

export const persistOfflineResponse = async (
  policy: ResolvedOfflineDomainPolicy,
  requestUrl: string,
  response: {
    data: unknown;
    status: number;
    headers: Headers;
    payloadType: PersistedPayloadType;
    updatedAt: string;
  },
) => {
  const key = createStoreKey(policy, requestUrl);
  const record: OfflineStoreRecord = {
    key,
    url: requestUrl,
    domainKey: policy.key,
    scope: policy.scope,
    status: response.status,
    updatedAt: response.updatedAt,
    headers: Array.from(response.headers.entries()),
    payloadType: response.payloadType,
    payload: response.data,
  };

  await withStore('readwrite', async (store) => {
    store.put(record);
  });
  emitOfflineStoreUpdated();
};

export const readLatestOfflineSyncAt = async (scope: OfflineCacheScope | 'any' = 'any') => {
  const result = await withStore('readonly', async (store) => {
    const request = scope === 'any'
      ? store.getAll()
      : store.index('scope').getAll(scope);
    const records = await requestToPromise(request as IDBRequest<OfflineStoreRecord[]>);
    if (!records.length) {
      return null;
    }

    return records.reduce<string | null>((latest, record) => {
      if (!latest || new Date(record.updatedAt).getTime() > new Date(latest).getTime()) {
        return record.updatedAt;
      }
      return latest;
    }, null);
  });

  return result ?? null;
};

export const clearOfflineResponsesByScope = async (scope: OfflineCacheScope) => {
  await withStore('readwrite', async (store) => {
    const records = await requestToPromise(
      store.index('scope').getAll(scope) as IDBRequest<OfflineStoreRecord[]>,
    );

    for (const record of records) {
      store.delete(record.key);
    }
  });
  emitOfflineStoreUpdated();
};

const clearPrivateCaches = async () => {
  if (typeof caches === 'undefined') {
    return;
  }

  const existing = await caches.keys();
  await Promise.all(
    existing
      .filter((cacheName) => PWA_PRIVATE_CACHE_NAMES.includes(cacheName as typeof PWA_PRIVATE_CACHE_NAMES[number]))
      .map((cacheName) => caches.delete(cacheName)),
  );
};

export const clearPrivatePwaData = async () => {
  await Promise.all([
    clearPrivateCaches(),
    clearOfflineResponsesByScope('private'),
  ]);
  emitOfflineStoreUpdated();
};
