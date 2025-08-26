import { IErrorGeneric } from 'InvestCommon/types/api/auth';
import { urlAuthenticator, urlProfile, urlSignin } from 'InvestCommon/global/links';
import { navigateWithQueryParams } from 'UiKit/helpers/general';
import { useToast } from 'UiKit/components/Base/VToast/use-toast';
import { useDialogs } from 'InvestCommon/domain/dialogs/store/useDialogs';
import { toasterErrorHandlingAnalytics } from './toasterErrorHandlingAnalytics';
import { toasterErrorHandling } from './toasterErrorHandling';

type FlowType = 'login' | 'registration' | 'settings' | 'recovery' | 'verification';

// https://www.ory.sh/docs/kratos/concepts/ui-user-interface#titles-labels--validation-messages

const TOAST_OPTIONS = {
  title: 'Something went wrong',
  description: 'Please try again',
  variant: 'error',
};

export const oryErrorHandling = async (
  error: IErrorGeneric,
  flowType: FlowType,
  resetFlow: () => void,
  comment: string,
  onSessionRefresh?: () => void,
) => {
  const { toast } = useToast();
  const responseJson = error?.data?.responseJson;
  const uiError = responseJson?.ui?.messages?.find((m: any) => m.type === 'error');
  const credentialsErrorId = 4000006;
  const isCredentialsError = uiError?.id === credentialsErrorId;

  // special case for 4000006 error id
  if (isCredentialsError) {
    error.message = 'Invalid email or password.';
    toasterErrorHandling(error, comment);
    return;
  }

  if (!responseJson?.error?.id) {
    toasterErrorHandlingAnalytics(error, comment);
    return;
  }

  // if (responseJson?.redirect_browser_to) {
  //   console.log('Ory error handling: redirect_browser_to', responseJson?.redirect_browser_to);

  //   if (responseJson.redirect_browser_to.includes('aal2')) navigateWithQueryParams(urlAuthenticator);
  //   else window.location.href = responseJson.redirect_browser_to;
  // }

  switch (responseJson?.error?.id) {
    case 'session_already_available': // User is already signed in, let's redirect them home!
      navigateWithQueryParams(urlProfile());
      break;
    case 'session_aal2_required': // 2FA is enabled and enforced, but user did not perform 2fa yet!
      // if (responseJson?.redirect_browser_to) {
      //   const redirectTo = new URL(responseJson.redirect_browser_to);
      //   if (flowType === 'settings') {
      //     redirectTo.searchParams.set('return_to', window.location.href);
      //   }
      //   // 2FA is enabled and enforced, but user did not perform 2fa yet!
      //   window.location.href = redirectTo.toString();
      //   return;
      // }
      navigateWithQueryParams(urlAuthenticator);
      return;
    case 'session_refresh_required': // We need to re-authenticate to perform this action
      // Show refresh session dialog and wait for completion
      try {
        const success = await useDialogs().showRefreshSession();
        if (success && onSessionRefresh) {
          // Execute callback after successful session refresh
          onSessionRefresh();
        }
      } catch (refreshError) {
        console.error('Session refresh failed:', refreshError);
      }
      break;
    case 'browser_location_change_required': // Ory Kratos asked us to point the user to this URL.
      if (responseJson.redirect_browser_to.includes('aal2')) navigateWithQueryParams(urlAuthenticator);
      else window.location.href = responseJson.redirect_browser_to;
      break;
    case 'self_service_flow_expired': // The flow expired, let's request a new one.
      toast({
        ...TOAST_OPTIONS,
        title: 'Your interaction expired, please fill out the form again.',
      });
      // authStore.fetchAuthHandler(url);
      resetFlow();
      // await router.push("/" + flowType)
      break;
    case 'self_service_flow_return_to_forbidden': // the return is invalid, we need a new flow
      toast({
        ...TOAST_OPTIONS,
        title: 'The return_to address is not allowed.',
      });
      resetFlow();
      // resetFlow(undefined)
      // await router.push("/" + flowType)
      break;
    case 'security_csrf_violation': // A CSRF violation occurred. Best to just refresh the flow!
      toast({
        ...TOAST_OPTIONS,
        title: 'A security violation was detected, please fill out the form again.',
      });
      resetFlow();

      // resetFlow(undefined)
      // await router.push("/" + flowType)
      break;
    case 'security_identity_mismatch':
      resetFlow();// The requested item was intended for someone else. Let's request a new flow...

      // resetFlow(undefined)
      // await router.push("/" + flowType)
      break;
    case 'session_inactive':
      navigateWithQueryParams(urlSignin);
      break;
    default:
      toasterErrorHandlingAnalytics(error, comment);
  }
};
