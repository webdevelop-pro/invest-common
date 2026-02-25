const prefetchedUrls = new Set<string>();

const toAbsoluteUrl = (url: string): string | null => {
  if (typeof window === 'undefined' || !url) return null;
  try {
    return new URL(url, window.location.origin).toString();
  } catch {
    return null;
  }
};

const appendPrefetchTag = (href: string) => {
  if (typeof document === 'undefined') return;
  const existing = document.head.querySelector(`link[rel="prefetch"][href="${href}"]`);
  if (existing) return;

  const link = document.createElement('link');
  link.rel = 'prefetch';
  link.as = 'document';
  link.href = href;
  document.head.appendChild(link);
};

const schedule = (callback: () => void) => {
  if (typeof window === 'undefined') return;
  if ('requestIdleCallback' in window) {
    (window as Window & { requestIdleCallback: (cb: () => void) => void }).requestIdleCallback(callback);
    return;
  }
  window.setTimeout(callback, 60);
};

type PrefetchOptions = {
  immediate?: boolean;
  includeExternal?: boolean;
};

type ViewportPrefetchOptions = {
  root?: Element | null;
  rootMargin?: string;
  selector?: string;
  includeExternal?: boolean;
};

export const useLinkPrefetch = () => {
  const shouldSkipExternal = (absolute: string, includeExternal?: boolean) => {
    if (includeExternal) return false;
    if (typeof window === 'undefined') return true;
    return new URL(absolute).origin !== window.location.origin;
  };

  const prefetchLink = (url?: string | null, options: PrefetchOptions = {}) => {
    if (!url) return;
    const absolute = toAbsoluteUrl(url);
    if (!absolute || prefetchedUrls.has(absolute)) return;
    if (shouldSkipExternal(absolute, options.includeExternal)) return;

    prefetchedUrls.add(absolute);
    const run = () => appendPrefetchTag(absolute);
    if (options.immediate) {
      run();
      return;
    }
    schedule(run);
  };

  const prefetchMany = (urls: Array<string | undefined | null>, options: PrefetchOptions = {}) => {
    urls.forEach((url) => prefetchLink(url, options));
  };

  const observeViewportLinks = (options: ViewportPrefetchOptions = {}) => {
    if (typeof window === 'undefined' || typeof document === 'undefined') return () => {};
    if (!('IntersectionObserver' in window)) return () => {};

    const selector = options.selector ?? 'a[href]';
    const links = Array.from(document.querySelectorAll<HTMLAnchorElement>(selector));
    if (links.length === 0) return () => {};

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        const link = entry.target as HTMLAnchorElement;
        prefetchLink(link.getAttribute('href'), { includeExternal: options.includeExternal });
        observer.unobserve(link);
      });
    }, {
      root: options.root ?? null,
      rootMargin: options.rootMargin ?? '220px',
    });

    links.forEach((link) => observer.observe(link));
    return () => observer.disconnect();
  };

  return {
    prefetchLink,
    prefetchMany,
    observeViewportLinks,
  };
};
