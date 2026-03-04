import { IErrorGeneric } from 'InvestCommon/data/auth/auth.type';
import { urlAuthenticator, urlProfile, urlSignin } from 'InvestCommon/domain/config/links';
import { navigateWithQueryParams } from 'UiKit/helpers/general';
import { useToast } from 'UiKit/components/Base/VToast/use-toast';
import { useDialogs } from 'InvestCommon/domain/dialogs/store/useDialogs';
import { reportError } from './errorReporting';
import { h } from 'vue';

type FlowType = 'login' | 'registration' | 'settings' | 'recovery' | 'verification' | 'logout' | 'signup' | 'browser';

/** Minimal shape of Ory flow response JSON (error or flow data). */
interface OryResponseJson {
  ui?: { messages?: Array<{ type?: string; text?: string; id?: number; context?: Record<string, unknown> }> };
  error?: { id?: string };
  redirect_browser_to?: string;
}

const TOAST_OPTIONS = {
  title: 'Something went wrong',
  description: 'Please try again',
  variant: 'error',
} as const;

const CREDENTIALS_ERROR_ID = 4000006;

/**
 * Ory Kratos error handling (toast, navigation, dialogs).
 * Call from ViewModel/guard in catch blocks — not from repository.
 * @param _flowType - Unused; kept for API compatibility. May be used for logging later.
 */
export const oryErrorHandling = async (
  error: IErrorGeneric,
  _flowType: FlowType,
  resetFlow: () => void,
  comment: string,
  onSessionRefresh?: () => void,
) => {
  const { toast } = useToast();
  const responseJson = (error as { data?: { responseJson?: OryResponseJson } })?.data?.responseJson;
  const uiError = responseJson?.ui?.messages?.find((m: { type?: string }) => m.type === 'error');
  const isCredentialsError = uiError?.id === CREDENTIALS_ERROR_ID;

  if (isCredentialsError) {
    toast({
      ...TOAST_OPTIONS,
      title: comment || TOAST_OPTIONS.title,
      description: 'Invalid email or password.',
    });
    return;
  }

  if (uiError?.text?.toLowerCase().includes('account with the same identifier')) {
    toast({
      title: 'Account Already Exists',
      description: h('div', {
        innerHTML: `Sorry, your email already used, do you want to <a href="/signin">log in</a>?`,
      }),
      variant: 'error',
      duration: 8000,
    });
    return;
  }

  if (!responseJson?.error?.id) {
    reportError(error, comment);
    return;
  }

  switch (responseJson?.error?.id) {
    case 'session_already_available':
      navigateWithQueryParams(urlProfile());
      break;
    case 'session_aal2_required':
      navigateWithQueryParams(urlAuthenticator);
      return;
    case 'session_refresh_required':
      try {
        const success = await useDialogs().showRefreshSession();
        if (success && onSessionRefresh) onSessionRefresh();
      } catch (refreshError) {
        if (typeof console?.error === 'function') console.error('Session refresh failed:', refreshError);
      }
      break;
    case 'browser_location_change_required':
      if (responseJson.redirect_browser_to?.includes('aal2')) navigateWithQueryParams(urlAuthenticator);
      else if (responseJson.redirect_browser_to) window.location.href = responseJson.redirect_browser_to;
      break;
    case 'self_service_flow_expired':
      toast({ ...TOAST_OPTIONS, title: 'Your interaction expired, please fill out the form again.' });
      resetFlow();
      break;
    case 'self_service_flow_return_to_forbidden':
      toast({ ...TOAST_OPTIONS, title: 'The return_to address is not allowed.' });
      resetFlow();
      break;
    case 'security_csrf_violation':
      toast({ ...TOAST_OPTIONS, title: 'A security violation was detected, please fill out the form again.' });
      resetFlow();
      break;
    case 'security_identity_mismatch':
      resetFlow();
      break;
    case 'session_inactive':
      navigateWithQueryParams(urlSignin);
      break;
    default:
      reportError(error, comment);
  }
};
