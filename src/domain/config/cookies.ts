import env from 'InvestCommon/config/env';

type SameSiteOption = 'none' | 'lax' | 'strict';

const isProd = import.meta.env.MODE === 'production';

export const cookiesOptions = (expireDate?: Date) => {
  const sameSite: SameSiteOption = isProd ? 'none' : 'lax';
  const domain = env.COOKIE_DOMAIN || '.webdevelop.biz';

  return {
    domain,
    path: '/',
    ...(expireDate ? { expires: expireDate } : {}),
    sameSite,
    secure: isProd,
  };
};
