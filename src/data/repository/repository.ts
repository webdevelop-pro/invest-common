import { ref, type Ref } from 'vue';
import {
  PWA_OFFLINE_LAST_SYNC_HEADER,
  PWA_OFFLINE_RESPONSE_SOURCE_HEADER,
} from 'InvestCommon/domain/pwa/pwaOfflineStore';

export type OfflineHydrationSource = 'network' | 'offline-cache';

export type ActionState<T> = {
  data: T | undefined;
  loading: boolean;
  error: Error | null;
  lastSyncedAt?: string | null;
  dataSource?: OfflineHydrationSource | null;
};

/**
 * Use for OPTIONS or other unknown response shapes in repository state types.
 * Narrow at use site when reading (e.g. schema, fields). Keeps adding new endpoints consistent.
 */
export type OptionsStateData = unknown;

/** Initial state shape for an action; use when creating or resetting state. */
const createInitialState = <T>(data?: T): ActionState<T> => ({
  data,
  loading: false,
  error: null,
});

export function applyOfflineHydrationMeta<T>(
  stateRef: Ref<ActionState<T | undefined>>,
  headers: Headers,
): void {
  const lastSyncedAt = headers.get(PWA_OFFLINE_LAST_SYNC_HEADER);
  const dataSource = headers.get(PWA_OFFLINE_RESPONSE_SOURCE_HEADER);

  if (!lastSyncedAt && !dataSource) {
    return;
  }

  stateRef.value = {
    ...stateRef.value,
    lastSyncedAt: lastSyncedAt ?? null,
    dataSource: dataSource === 'network' || dataSource === 'offline-cache'
      ? dataSource
      : null,
  };
}

/**
 * Creates a single action state ref.
 * @param defaultData - Optional initial data (defaults to undefined).
 */
export function createActionState<T>(defaultData?: T): Ref<ActionState<T>> {
  return ref(createInitialState(defaultData)) as Ref<ActionState<T>>;
}

/**
 * Creates multiple action states and a shared resetAll from a config.
 * Each key gets its own ref; resetAll() sets every state to initial (loading: false, error: null, data: undefined).
 * Resets use a new object per ref to avoid shared reference issues.
 *
 * @param config - Map of state key to optional default data (undefined = no default).
 * @returns Object with each state ref and resetAll().
 *
 * @example
 * const { getOffersState, getOfferOneState, resetAll } = createRepositoryStates<{
 *   getOffersState: IOfferData;
 *   getOfferOneState: IOfferFormatted;
 * }>({ getOfferOneState: new OfferFormatter().format() });
 */
export function createRepositoryStates<T extends Record<string, unknown>>(
  config: { [K in keyof T]?: T[K] },
): { [K in keyof T]: Ref<ActionState<T[K]>> } & { resetAll: () => void } {
  const keys = Object.keys(config) as (keyof T)[];
  const stateRefs = keys.reduce(
    (acc, key) => {
      acc[key] = createActionState(config[key]) as Ref<ActionState<T[keyof T]>>;
      return acc;
    },
    {} as { [K in keyof T]: Ref<ActionState<T[K]>> },
  );

  const resetAll = (): void => {
    for (const key of keys) {
      stateRefs[key].value = createInitialState(undefined) as ActionState<T[keyof T]>;
    }
  };

  return { ...stateRefs, resetAll };
}

/**
 * Runs an async action while updating a shared ActionState (loading, data, error).
 * Replaces state with a new object on each update for predictable reactivity.
 * Always rethrows after setting state.error so callers can handle (e.g. reportError).
 *
 * Contract: the return value is the same as the value stored in state.data.
 *
 * @param stateRef - Ref holding the action state.
 * @param action - Async function that returns the data to store.
 * @returns The result of action() on success.
 * @throws Rethrows whatever action() throws after updating state.error.
 */
export async function withActionState<T>(
  stateRef: Ref<ActionState<T | undefined>>,
  action: () => Promise<T>,
): Promise<T> {
  stateRef.value = { loading: true, error: null, data: undefined };

  try {
    const result = await action();
    stateRef.value = { loading: false, error: null, data: result };
    return result;
  } catch (err) {
    stateRef.value = { loading: false, error: err as Error, data: undefined };
    throw err;
  }
}
