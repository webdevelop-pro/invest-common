type SameSiteOption = 'none' | 'lax' | 'strict';

export const cookiesOptions = (expireDate: Date) => {
  const sameSite: SameSiteOption = process.env.NODE_ENV === 'production' ? 'none' : 'lax';
  return {
    domain: '.webdevelop.biz',
    path: '/',
    expires: expireDate,
    sameSite,
    secure: process.env.NODE_ENV === 'production',
  };
};
