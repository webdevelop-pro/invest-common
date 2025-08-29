export const cookiesOptions = (expireDate: Date) => ({
  domain: '.webdevelop.biz',
  path: '/',
  expires: expireDate,
  sameSite: process.env.NODE_ENV === 'production' ? 'None' : 'Lax',
  secure: process.env.NODE_ENV === 'production',
});
