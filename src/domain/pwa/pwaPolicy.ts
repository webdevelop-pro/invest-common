export type OfflineCacheScope = 'public' | 'private';

export type OfflineDomainKey =
  | 'frontend-navigation'
  | 'offer-api'
  | 'user-api'
  | 'investment-api'
  | 'wallet-api'
  | 'evm-api'
  | 'filer-public-api'
  | 'filer-private-api'
  | 'distributions-api'
  | 'accreditation-api';

export type RuntimeCacheRule = {
  urlPattern: RegExp | ((context: { request: Request; url: URL }) => boolean);
  handler: 'CacheFirst' | 'NetworkFirst' | 'StaleWhileRevalidate';
  options: Record<string, unknown>;
};

export interface PwaPolicyEnv {
  FRONTEND_URL?: string;
  OFFER_URL?: string;
  USER_URL?: string;
  INVESTMENT_URL?: string;
  WALLET_URL?: string;
  EVM_URL?: string;
  FILER_URL?: string;
  DISTRIBUTIONS_URL?: string;
  ACCREDITATION_URL?: string;
  KRATOS_URL?: string;
}

type PathPattern = string | RegExp;

type SerializedPathPattern = {
  source: string;
  flags: string;
  type: 'prefix' | 'regex';
};

type OfflineDomainDefinition = {
  key: OfflineDomainKey;
  envKey: keyof PwaPolicyEnv;
  scope: OfflineCacheScope;
  cacheName: string;
  strategy: 'navigation' | 'network-first';
  includePathPatterns?: PathPattern[];
  excludePathPatterns?: PathPattern[];
  maxEntries?: number;
  maxAgeSeconds?: number;
  networkTimeoutSeconds?: number;
  persistToIndexedDb?: boolean;
};

export type ResolvedOfflineDomainPolicy = OfflineDomainDefinition & {
  origin: string;
  pathname: string;
  normalizedPathname: string;
};

export const PWA_CACHE_NAMES = {
  frontendShell: 'frontend-shell-cache',
  offerApi: 'offer-api-cache',
  userApi: 'user-api-cache',
  investmentApi: 'investment-api-cache',
  walletApi: 'wallet-api-cache',
  evmApi: 'evm-api-cache',
  filerPublicApi: 'filer-public-api-cache',
  filerPrivateApi: 'filer-private-api-cache',
  distributionsApi: 'distributions-api-cache',
  accreditationApi: 'accreditation-api-cache',
} as const;

export const PWA_PUBLIC_CACHE_NAMES = [
  PWA_CACHE_NAMES.frontendShell,
  PWA_CACHE_NAMES.offerApi,
  PWA_CACHE_NAMES.filerPublicApi,
] as const;

export const PWA_PRIVATE_CACHE_NAMES = [
  PWA_CACHE_NAMES.userApi,
  PWA_CACHE_NAMES.investmentApi,
  PWA_CACHE_NAMES.walletApi,
  PWA_CACHE_NAMES.evmApi,
  PWA_CACHE_NAMES.filerPrivateApi,
  PWA_CACHE_NAMES.distributionsApi,
  PWA_CACHE_NAMES.accreditationApi,
] as const;

export const OFFLINE_DOMAINS: readonly OfflineDomainDefinition[] = [
  {
    key: 'frontend-navigation',
    envKey: 'FRONTEND_URL',
    scope: 'public',
    cacheName: PWA_CACHE_NAMES.frontendShell,
    strategy: 'navigation',
    maxEntries: 200,
    maxAgeSeconds: 30 * 24 * 60 * 60,
    networkTimeoutSeconds: 3,
    persistToIndexedDb: false,
  },
  {
    key: 'offer-api',
    envKey: 'OFFER_URL',
    scope: 'public',
    cacheName: PWA_CACHE_NAMES.offerApi,
    strategy: 'network-first',
    maxEntries: 150,
    maxAgeSeconds: 24 * 60 * 60,
    networkTimeoutSeconds: 3,
    persistToIndexedDb: true,
  },
  {
    key: 'user-api',
    envKey: 'USER_URL',
    scope: 'private',
    cacheName: PWA_CACHE_NAMES.userApi,
    strategy: 'network-first',
    maxEntries: 40,
    maxAgeSeconds: 12 * 60 * 60,
    networkTimeoutSeconds: 3,
    persistToIndexedDb: true,
  },
  {
    key: 'investment-api',
    envKey: 'INVESTMENT_URL',
    scope: 'private',
    cacheName: PWA_CACHE_NAMES.investmentApi,
    strategy: 'network-first',
    maxEntries: 80,
    maxAgeSeconds: 12 * 60 * 60,
    networkTimeoutSeconds: 3,
    persistToIndexedDb: true,
  },
  {
    key: 'wallet-api',
    envKey: 'WALLET_URL',
    scope: 'private',
    cacheName: PWA_CACHE_NAMES.walletApi,
    strategy: 'network-first',
    maxEntries: 60,
    maxAgeSeconds: 12 * 60 * 60,
    networkTimeoutSeconds: 3,
    persistToIndexedDb: true,
  },
  {
    key: 'evm-api',
    envKey: 'EVM_URL',
    scope: 'private',
    cacheName: PWA_CACHE_NAMES.evmApi,
    strategy: 'network-first',
    maxEntries: 40,
    maxAgeSeconds: 12 * 60 * 60,
    networkTimeoutSeconds: 3,
    persistToIndexedDb: true,
  },
  {
    key: 'filer-public-api',
    envKey: 'FILER_URL',
    scope: 'public',
    cacheName: PWA_CACHE_NAMES.filerPublicApi,
    strategy: 'network-first',
    maxEntries: 60,
    maxAgeSeconds: 24 * 60 * 60,
    networkTimeoutSeconds: 3,
    includePathPatterns: ['/public/objects', '/public/files'],
    persistToIndexedDb: true,
  },
  {
    key: 'filer-private-api',
    envKey: 'FILER_URL',
    scope: 'private',
    cacheName: PWA_CACHE_NAMES.filerPrivateApi,
    strategy: 'network-first',
    maxEntries: 80,
    maxAgeSeconds: 12 * 60 * 60,
    networkTimeoutSeconds: 3,
    includePathPatterns: ['/auth/objects', '/auth/files'],
    persistToIndexedDb: true,
  },
  {
    key: 'distributions-api',
    envKey: 'DISTRIBUTIONS_URL',
    scope: 'private',
    cacheName: PWA_CACHE_NAMES.distributionsApi,
    strategy: 'network-first',
    maxEntries: 20,
    maxAgeSeconds: 12 * 60 * 60,
    networkTimeoutSeconds: 3,
    persistToIndexedDb: true,
  },
  {
    key: 'accreditation-api',
    envKey: 'ACCREDITATION_URL',
    scope: 'private',
    cacheName: PWA_CACHE_NAMES.accreditationApi,
    strategy: 'network-first',
    maxEntries: 20,
    maxAgeSeconds: 12 * 60 * 60,
    networkTimeoutSeconds: 3,
    persistToIndexedDb: true,
  },
] as const;

const normalizePathPrefix = (value: string) => (value.endsWith('/') ? value : `${value}/`);

export const matchesPathPrefix = (pathname: string, prefix: string) => (
  pathname === prefix
  || pathname.startsWith(normalizePathPrefix(prefix))
);

export const matchesPathPattern = (pathname: string, pattern: PathPattern) => (
  typeof pattern === 'string'
    ? matchesPathPrefix(pathname, pattern)
    : pattern.test(pathname)
);

const resolveOrigin = (value?: string) => {
  if (!value) {
    return undefined;
  }

  try {
    return new URL(value).origin;
  } catch {
    return undefined;
  }
};

export const getCriticalPreconnectOrigins = (env: PwaPolicyEnv) => (
  [
    resolveOrigin(env.OFFER_URL),
    resolveOrigin(env.KRATOS_URL),
  ].filter((value, index, array): value is string => Boolean(value) && array.indexOf(value) === index)
);

export const resolveOfflineDomainPolicies = (env: PwaPolicyEnv): ResolvedOfflineDomainPolicy[] => (
  OFFLINE_DOMAINS.flatMap((definition) => {
    const serviceUrl = env[definition.envKey];
    if (!serviceUrl) {
      return [];
    }

    try {
      const { origin, pathname } = new URL(serviceUrl);
      return [{
        ...definition,
        origin,
        pathname,
        normalizedPathname: normalizePathPrefix(pathname),
      }];
    } catch {
      return [];
    }
  })
);

const matchesResolvedPolicy = (
  policy: ResolvedOfflineDomainPolicy,
  url: URL,
  method: string,
) => {
  if (method !== 'GET') {
    return false;
  }

  if (url.origin !== policy.origin) {
    return false;
  }

  if (!(url.pathname === policy.pathname || url.pathname.startsWith(policy.normalizedPathname))) {
    return false;
  }

  if (policy.includePathPatterns?.length) {
    return policy.includePathPatterns.some((pattern) => matchesPathPattern(url.pathname, pattern));
  }

  return !(policy.excludePathPatterns?.some((pattern) => matchesPathPattern(url.pathname, pattern)));
};

const serializePathPattern = (pattern: PathPattern): SerializedPathPattern => (
  typeof pattern === 'string'
    ? {
      type: 'prefix',
      source: pattern,
      flags: '',
    }
    : {
      type: 'regex',
      source: pattern.source,
      flags: pattern.flags,
    }
);

export const matchOfflineDomainPolicy = (
  requestUrl: string,
  method: string,
  env: PwaPolicyEnv,
) => {
  try {
    const url = new URL(requestUrl);
    return resolveOfflineDomainPolicies(env).find((policy) => matchesResolvedPolicy(policy, url, method)) ?? null;
  } catch {
    return null;
  }
};

const createUrlMatcher = (policy: ResolvedOfflineDomainPolicy) => {
  const serializedPolicy = JSON.stringify({
    excludePathPatterns: policy.excludePathPatterns?.map(serializePathPattern) ?? [],
    includePathPatterns: policy.includePathPatterns?.map(serializePathPattern) ?? [],
    normalizedPathname: policy.normalizedPathname,
    origin: policy.origin,
    pathname: policy.pathname,
  });

  return new Function(`
    return ({ request, url }) => {
      const policy = ${serializedPolicy};
      const matchesPathPrefix = (pathname, prefix) => (
        pathname === prefix
        || pathname.startsWith(prefix.endsWith('/') ? prefix : \`\${prefix}/\`)
      );
      const matchesPathPattern = (pathname, pattern) => (
        pattern.type === 'prefix'
          ? matchesPathPrefix(pathname, pattern.source)
          : new RegExp(pattern.source, pattern.flags).test(pathname)
      );

      if (request.method !== 'GET') {
        return false;
      }

      if (url.origin !== policy.origin) {
        return false;
      }

      if (!(url.pathname === policy.pathname || url.pathname.startsWith(policy.normalizedPathname))) {
        return false;
      }

      if (policy.includePathPatterns.length) {
        return policy.includePathPatterns.some((pattern) => matchesPathPattern(url.pathname, pattern));
      }

      return !policy.excludePathPatterns.some((pattern) => matchesPathPattern(url.pathname, pattern));
    };
  `)() as (context: { request: Request; url: URL }) => boolean;
};

const createNetworkFirstRule = (policy: ResolvedOfflineDomainPolicy): RuntimeCacheRule => ({
  urlPattern: createUrlMatcher(policy),
  handler: 'NetworkFirst',
  options: {
    cacheName: policy.cacheName,
    expiration: {
      maxEntries: policy.maxEntries ?? 100,
      maxAgeSeconds: policy.maxAgeSeconds ?? 7 * 24 * 60 * 60,
    },
    cacheableResponse: {
      statuses: [200],
    },
    networkTimeoutSeconds: policy.networkTimeoutSeconds ?? 5,
  },
});

const RESERVED_TOP_LEVEL_STATIC_SEGMENTS = new Set([
  'offers',
  'how-it-works',
  'resource-center',
  'faq',
  'signin',
  'signup',
  'contact-us',
  'legal',
  'dashboard',
  'error',
  'offline.html',
]);

const isLikelyOfferDetailPath = (pathname: string) => {
  if (!pathname || pathname === '/') {
    return false;
  }

  const segments = pathname.split('/').filter(Boolean);
  if (segments.length !== 1) {
    return false;
  }

  const [segment] = segments;
  if (!segment || segment.includes('.')) {
    return false;
  }

  return !RESERVED_TOP_LEVEL_STATIC_SEGMENTS.has(segment);
};

const createStaticRouteCandidates = (pathname: string) => {
  const candidates = new Set<string>();
  const normalizedPath = pathname === '/' ? '/index.html' : pathname.replace(/\/+$/, '') || '/';

  candidates.add(pathname);
  candidates.add(normalizedPath);

  if (normalizedPath !== '/' && !normalizedPath.endsWith('.html')) {
    candidates.add(`${normalizedPath}.html`);
    candidates.add(`${normalizedPath}/index.html`);
  }

  return [...candidates];
};

const createNavigationRule = (policy: ResolvedOfflineDomainPolicy): RuntimeCacheRule => ({
  urlPattern: ({ request, url }) => (
    request.mode === 'navigate'
    && request.method === 'GET'
    && url.origin === self.location.origin
  ),
  handler: 'NetworkFirst',
  options: {
    cacheName: policy.cacheName,
    expiration: {
      maxEntries: policy.maxEntries ?? 200,
      maxAgeSeconds: policy.maxAgeSeconds ?? 30 * 24 * 60 * 60,
    },
    cacheableResponse: {
      statuses: [200],
    },
    networkTimeoutSeconds: policy.networkTimeoutSeconds ?? 3,
    plugins: [
      {
        handlerDidError: async ({ request }: { request?: Request }) => {
          const requestPathname = request?.url ? new URL(request.url).pathname : '';
          const fallbackCandidates = (
            requestPathname === '/dashboard'
            || requestPathname.startsWith('/dashboard/')
          )
            ? ['/dashboard/index.html', '/dashboard.html', '/index.html', '/offline.html']
            : isLikelyOfferDetailPath(requestPathname)
              ? [...createStaticRouteCandidates(requestPathname), '/index.html', '/offline.html']
              : ['/offline.html'];

          for (const fallbackPath of fallbackCandidates) {
            const cachedResponse = await caches.match(fallbackPath, { ignoreSearch: true });
            if (cachedResponse) {
              return cachedResponse;
            }
          }

          return Response.error();
        },
      },
    ],
  },
});

export const buildWorkboxRuntimeCaching = (env: PwaPolicyEnv): RuntimeCacheRule[] => (
  resolveOfflineDomainPolicies(env).map((policy) => (
    policy.strategy === 'navigation'
      ? createNavigationRule(policy)
      : createNetworkFirstRule(policy)
  ))
);
