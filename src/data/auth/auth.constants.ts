/**
 * Ory Kratos self-service flow paths (data layer — no feature dependency).
 *
 * Used by:
 * - login: useLogin, useLoginRefresh, useAuthenticator
 * - logout: useLogout
 * - registration: useSignup
 * - settings: useSettingsMfa, useSettingsTOTP, useResetPassword, useSettingsSocial, useVFormSettingsTOTP
 * - recovery: useForgot, useVerification
 */
export enum SELFSERVICE {
  login = '/self-service/login/browser',
  logout = '/self-service/logout/browser',
  registration = '/self-service/registration/browser',
  settings = '/self-service/settings/browser',
  recovery = '/self-service/recovery/browser',
}

/** Query params for login flow with AAL2 (e.g. 2FA step). Use with getAuthFlow(SELFSERVICE.login, AAL2_QUERY). */
export const AAL2_QUERY = { aal: 'aal2' } as const;
