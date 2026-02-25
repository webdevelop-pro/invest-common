import { computed, getCurrentInstance } from 'vue';

type MaybeLink = string | null | undefined;

const appBase = ((import.meta as ImportMeta & { env?: { BASE_URL?: string } }).env?.BASE_URL ?? '/').replace(/\/+$/, '');

const stripBasePrefix = (path: string): string => {
  if (!appBase || appBase === '/') return path || '/';
  if (path === appBase) return '/';
  if (path.startsWith(`${appBase}/`)) {
    return path.slice(appBase.length) || '/';
  }
  return path;
};

export const useSmartLink = () => {
  const instance = getCurrentInstance();

  const hasRouterLink = computed(() => {
    const appComponents = instance?.appContext.components ?? {};
    return Boolean(
      appComponents.RouterLink
      || appComponents['router-link']
      || instance?.appContext.config.globalProperties.$router,
    );
  });

  const toRouterPathIfLocal = (to?: MaybeLink): string | null => {
    if (!to) return null;

    if (/^(https?:)?\/\//i.test(to)) {
      if (typeof window === 'undefined') return null;
      try {
        const url = new URL(to, window.location.origin);
        if (url.origin !== window.location.origin) return null;
        const localPath = stripBasePrefix(url.pathname);
        return `${localPath}${url.search}${url.hash}`;
      } catch {
        return null;
      }
    }

    if (to.startsWith('/') && !to.startsWith('//')) {
      const [pathname, suffix = ''] = to.split(/(?=[?#])/);
      const localPath = stripBasePrefix(pathname);
      return `${localPath}${suffix}`;
    }

    return null;
  };

  const canUseRouterLink = (to?: MaybeLink): boolean => (
    Boolean(hasRouterLink.value && toRouterPathIfLocal(to))
  );

  return {
    toRouterPathIfLocal,
    canUseRouterLink,
  };
};
