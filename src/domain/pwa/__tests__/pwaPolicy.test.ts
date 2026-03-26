import {
  describe,
  expect,
  it,
  vi,
} from 'vitest';
import {
  buildWorkboxRuntimeCaching,
  getCriticalPreconnectOrigins,
  matchOfflineDomainPolicy,
  matchesPathPattern,
  matchesPathPrefix,
  type RuntimeCacheRule,
  resolveOfflineDomainPolicies,
} from '../pwaPolicy';

const TEST_ENV = {
  FRONTEND_URL: 'https://frontend.test',
  OFFER_URL: 'https://offer.test',
  NOTIFICATION_URL: 'https://notifications.test',
  USER_URL: 'https://user.test',
  INVESTMENT_URL: 'https://investment.test',
  WALLET_URL: 'https://wallet.test',
  EVM_URL: 'https://evm.test',
  FILER_URL: 'https://filer.test',
  DISTRIBUTIONS_URL: 'https://distributions.test',
  ACCREDITATION_URL: 'https://accreditation.test',
  KRATOS_URL: 'https://kratos.test',
} as const;

type UrlPatternMatcher = Exclude<RuntimeCacheRule['urlPattern'], RegExp>;
type UrlPatternMatcherContext = Parameters<UrlPatternMatcher>[0];

const getUrlPatternMatcher = (matcher: unknown): UrlPatternMatcher => {
  expect(typeof matcher).toBe('function');
  return matcher as UrlPatternMatcher;
};

const evaluateSerializedMatcher = (matcher: unknown) => {
  const urlPatternMatcher = getUrlPatternMatcher(matcher);

  return Function(`return (${urlPatternMatcher.toString()})`)() as UrlPatternMatcher;
};

describe('matchOfflineDomainPolicy', () => {
  it('matches path prefixes and regex path patterns', () => {
    expect(matchesPathPrefix('/dashboard/portfolio', '/dashboard')).toBe(true);
    expect(matchesPathPrefix('/offers', '/dashboard')).toBe(false);
    expect(matchesPathPattern('/public/files/123', '/public/files')).toBe(true);
    expect(matchesPathPattern('/auth/report/123', /^\/auth\/report\/\d+$/)).toBe(true);
  });

  it('matches any GET under safe first-party business domains', () => {
    expect(matchOfflineDomainPolicy('https://offer.test/public/offer/featured', 'GET', TEST_ENV)?.key)
      .toBe('offer-api');
    expect(matchOfflineDomainPolicy('https://notifications.test/notification', 'GET', TEST_ENV)?.key)
      .toBe('notification-api');
    expect(matchOfflineDomainPolicy('https://user.test/auth/preferences', 'GET', TEST_ENV)?.key)
      .toBe('user-api');
    expect(matchOfflineDomainPolicy('https://investment.test/auth/invest/custom-report/42', 'GET', TEST_ENV)?.key)
      .toBe('investment-api');
    expect(matchOfflineDomainPolicy('https://wallet.test/auth/balance/history', 'GET', TEST_ENV)?.key)
      .toBe('wallet-api');
    expect(matchOfflineDomainPolicy('https://evm.test/auth/assets/positions', 'GET', TEST_ENV)?.key)
      .toBe('evm-api');
    expect(matchOfflineDomainPolicy('https://distributions.test/auth/123/export', 'GET', TEST_ENV)?.key)
      .toBe('distributions-api');
    expect(matchOfflineDomainPolicy('https://accreditation.test/auth/review/123', 'GET', TEST_ENV)?.key)
      .toBe('accreditation-api');
  });

  it('keeps filer caching limited to audited public and private file paths', () => {
    expect(matchOfflineDomainPolicy('https://offer.test/public/comment/76', 'GET', TEST_ENV)?.key)
      .toBe('offer-api');
    expect(matchOfflineDomainPolicy('https://offer.test/public/offer/city-of-springfield-2025-bond', 'GET', TEST_ENV)?.key)
      .toBe('offer-api');
    expect(matchOfflineDomainPolicy('https://investment.test/auth/investment/1015/unconfirmed', 'GET', TEST_ENV)?.key)
      .toBe('investment-api');
    expect(matchOfflineDomainPolicy('https://filer.test/public/objects/offer/12', 'GET', TEST_ENV)?.key)
      .toBe('filer-public-api');
    expect(matchOfflineDomainPolicy('https://filer.test/auth/objects/offer/76', 'GET', TEST_ENV)?.key)
      .toBe('filer-private-api');
    expect(matchOfflineDomainPolicy('https://filer.test/public/objects/offer/76', 'GET', TEST_ENV)?.key)
      .toBe('filer-public-api');
    expect(matchOfflineDomainPolicy('https://filer.test/public/files/12?size=big', 'GET', TEST_ENV)?.key)
      .toBe('filer-public-api');
    expect(matchOfflineDomainPolicy('https://filer.test/private/files/12', 'GET', TEST_ENV))
      .toBeNull();
  });

  it('does not cache excluded or non-GET requests', () => {
    expect(matchOfflineDomainPolicy('https://kratos.test/sessions/whoami', 'GET', TEST_ENV))
      .toBeNull();
    expect(matchOfflineDomainPolicy('https://notifications.test/notification', 'POST', TEST_ENV))
      .toBeNull();
    expect(matchOfflineDomainPolicy('https://offer.test/public/offer', 'POST', TEST_ENV))
      .toBeNull();
  });

  it('returns null for invalid request urls or unresolved service origins', () => {
    expect(matchOfflineDomainPolicy('not-a-url', 'GET', TEST_ENV)).toBeNull();
    expect(matchOfflineDomainPolicy('https://offer.test/public/offer', 'GET', {
      ...TEST_ENV,
      OFFER_URL: 'not-a-valid-origin',
    })).toBeNull();
  });

  it('does not match requests that fall outside the configured service pathname', () => {
    expect(matchOfflineDomainPolicy('https://offer.test/other/path', 'GET', {
      ...TEST_ENV,
      OFFER_URL: 'https://offer.test/public',
    })).toBeNull();
  });
});

describe('policy helpers', () => {
  it('returns deduplicated preconnect origins and skips invalid values', () => {
    expect(getCriticalPreconnectOrigins({
      OFFER_URL: 'https://offer.test/path',
      KRATOS_URL: 'https://offer.test/kratos',
    })).toEqual(['https://offer.test']);

    expect(getCriticalPreconnectOrigins({
      OFFER_URL: 'not-a-url',
      KRATOS_URL: undefined,
    })).toEqual([]);
  });

  it('resolves offline domain policies only for valid configured urls', () => {
    const policies = resolveOfflineDomainPolicies({
      FRONTEND_URL: 'https://frontend.test/app',
      OFFER_URL: 'https://offer.test/api',
      USER_URL: undefined,
      NOTIFICATION_URL: undefined,
      INVESTMENT_URL: 'not-a-url',
    });

    expect(policies.map((policy) => policy.key)).toEqual([
      'frontend-navigation',
      'offer-api',
    ]);
    expect(policies[0]?.normalizedPathname).toBe('/app/');
  });
});

describe('buildWorkboxRuntimeCaching', () => {
  const getNavigationFallbackPlugin = () => {
    const runtimeRules = buildWorkboxRuntimeCaching(TEST_ENV);
    const navigationRule = runtimeRules.find((rule) => rule.handler === 'NetworkFirst' && Array.isArray(rule.options.plugins));

    return navigationRule?.options.plugins?.[0] as {
      handlerDidError?: (context: { request?: Request }) => Promise<Response>;
    } | undefined;
  };

  it('falls back to the cached dashboard shell for offline dashboard navigations', async () => {
    const navigationFallbackPlugin = getNavigationFallbackPlugin();
    const cachesMatchMock = vi.fn()
      .mockResolvedValueOnce(new Response('<html>dashboard shell</html>'));

    vi.stubGlobal('caches', {
      match: cachesMatchMock,
    });

    const response = await navigationFallbackPlugin?.handlerDidError?.({
      request: new Request('https://frontend.test/dashboard/portfolio'),
    });

    expect(await response?.text()).toContain('dashboard shell');
    expect(cachesMatchMock).toHaveBeenCalledWith('/dashboard/index.html', { ignoreSearch: true });

    vi.unstubAllGlobals();
  });

  it('falls back directly to offline.html for non-dashboard navigations', async () => {
    const navigationFallbackPlugin = getNavigationFallbackPlugin();
    const cachesMatchMock = vi.fn()
      .mockResolvedValueOnce(new Response('<html>offline fallback</html>'));

    vi.stubGlobal('caches', {
      match: cachesMatchMock,
    });

    const response = await navigationFallbackPlugin?.handlerDidError?.({
      request: new Request('https://frontend.test/city-of-springfield-2025-bond'),
    });

    expect(await response?.text()).toContain('offline fallback');
    expect(cachesMatchMock).toHaveBeenCalledTimes(1);
    expect(cachesMatchMock).toHaveBeenCalledWith('/offline.html', { ignoreSearch: true });

    vi.unstubAllGlobals();
  });

  it('checks only offline.html for non-dashboard section routes', async () => {
    const navigationFallbackPlugin = getNavigationFallbackPlugin();
    const cachesMatchMock = vi.fn()
      .mockResolvedValueOnce(new Response('<html>offline</html>'));

    vi.stubGlobal('caches', {
      match: cachesMatchMock,
    });

    const response = await navigationFallbackPlugin?.handlerDidError?.({
      request: new Request('https://frontend.test/offers'),
    });

    expect(await response?.text()).toContain('offline');
    expect(cachesMatchMock).toHaveBeenCalledTimes(1);
    expect(cachesMatchMock).toHaveBeenNthCalledWith(1, '/offline.html', { ignoreSearch: true });

    vi.unstubAllGlobals();
  });

  it('falls back to dashboard.html before offline.html when dashboard index is missing', async () => {
    const navigationFallbackPlugin = getNavigationFallbackPlugin();
    const cachesMatchMock = vi.fn()
      .mockResolvedValueOnce(undefined)
      .mockResolvedValueOnce(new Response('<html>dashboard fallback</html>'));

    vi.stubGlobal('caches', {
      match: cachesMatchMock,
    });

    const response = await navigationFallbackPlugin?.handlerDidError?.({
      request: new Request('https://frontend.test/dashboard'),
    });

    expect(await response?.text()).toContain('dashboard fallback');
    expect(cachesMatchMock).toHaveBeenNthCalledWith(1, '/dashboard/index.html', { ignoreSearch: true });
    expect(cachesMatchMock).toHaveBeenNthCalledWith(2, '/dashboard.html', { ignoreSearch: true });

    vi.unstubAllGlobals();
  });

  it('returns a response error when no offline fallback is cached', async () => {
    const navigationFallbackPlugin = getNavigationFallbackPlugin();
    const cachesMatchMock = vi.fn().mockResolvedValue(undefined);

    vi.stubGlobal('caches', {
      match: cachesMatchMock,
    });

    const response = await navigationFallbackPlugin?.handlerDidError?.({});

    expect(response).toBeInstanceOf(Response);
    expect(response?.type).toBe('error');

    vi.unstubAllGlobals();
  });

  it('creates network matchers that still work after service worker serialization', () => {
    const runtimeRules = buildWorkboxRuntimeCaching(TEST_ENV);
    const filerPublicRule = runtimeRules.find((rule) => rule.options.cacheName === 'filer-public-api-cache');
    const matcher = evaluateSerializedMatcher(filerPublicRule?.urlPattern);

    expect(matcher({
      request: new Request('https://filer.test/public/objects/offer/12'),
      url: new URL('https://filer.test/public/objects/offer/12'),
    })).toBe(true);
    expect(matcher({
      request: new Request('https://filer.test/private/files/12'),
      url: new URL('https://filer.test/private/files/12'),
    })).toBe(false);
    expect(matcher({
      request: new Request('https://filer.test/public/objects/offer/12', { method: 'POST' }),
      url: new URL('https://filer.test/public/objects/offer/12'),
    })).toBe(false);
  });

  it('builds a navigation rule that only matches same-origin navigation requests', () => {
    vi.stubGlobal('self', {
      location: {
        origin: 'https://frontend.test',
      },
    });

    const runtimeRules = buildWorkboxRuntimeCaching(TEST_ENV);
    const navigationRule = runtimeRules.find((rule) => rule.options.cacheName === 'frontend-shell-cache');
    const navigationMatcher = getUrlPatternMatcher(navigationRule?.urlPattern);
    const createMatcherContext = (
      mode: RequestMode,
      url: string,
    ): UrlPatternMatcherContext => ({
      request: {
        mode,
        method: 'GET',
      } as Request,
      url: new URL(url),
    });
    const matchesNavigation = navigationMatcher(createMatcherContext('navigate', 'https://frontend.test/offers'));
    const rejectsCrossOrigin = navigationMatcher(createMatcherContext('navigate', 'https://offer.test/public/offer'));
    const rejectsNonNavigation = navigationMatcher(createMatcherContext('cors', 'https://frontend.test/offers'));

    expect(matchesNavigation).toBe(true);
    expect(rejectsCrossOrigin).toBe(false);
    expect(rejectsNonNavigation).toBe(false);

    vi.unstubAllGlobals();
  });
});
