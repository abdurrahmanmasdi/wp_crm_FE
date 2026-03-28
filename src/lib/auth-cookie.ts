export const accessTokenCookieAttributes = {
  path: '/',
  sameSite: 'strict',
  secure: process.env.NODE_ENV === 'production',
} as const;
