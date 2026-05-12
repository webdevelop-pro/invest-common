import env from 'InvestCommon/config/env';

type SameSiteOption = 'none' | 'lax' | 'strict';

const isProd = import.meta.env.MODE === 'production' || import.meta.env.MODE === 'prod';

export const cookiesOptions = (expireDate?: Date) => {
  const sameSite: SameSiteOption = isProd ? 'none' : 'lax';
  const domain = env.COOKIE_DOMAIN || undefined;

  return {
    ...(domain ? { domain } : {}),
    path: '/',
    ...(expireDate ? { expires: expireDate } : {}),
    sameSite,
    // Always Secure: dev/stage/prod all run HTTPS (mkcert locally).
    // `HttpOnly` cannot be set from JS by spec — only a server's Set-Cookie
    // header can mark a cookie HttpOnly. Cookies set client-side here will
    // remain JS-readable; if HttpOnly is required, the backend must issue
    // these cookies in its responses.
    secure: true,
  };
};
