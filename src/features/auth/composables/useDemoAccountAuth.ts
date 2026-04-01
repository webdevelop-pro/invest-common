import { computed, ref, type ComputedRef, type Ref } from 'vue';
import env from 'InvestCommon/config/env';
import { useRepositoryAuth } from 'InvestCommon/data/auth/auth.repository';
import { SELFSERVICE } from 'InvestCommon/data/auth/auth.constants';
import { urlProfile } from 'InvestCommon/domain/config/links';
import { oryErrorHandling } from 'InvestCommon/domain/error/oryErrorHandling';
import { oryResponseHandling } from 'InvestCommon/domain/error/oryResponseHandling';
import { useSessionStore } from 'InvestCommon/domain/session/store/useSession';
import { navigateWithQueryParams } from 'UiKit/helpers/general';

type DemoAccountCredentialsConfig = {
  email: string;
  password: string;
};

export type DemoAccountAuthProvider = {
  authenticate: () => Promise<boolean>;
  isAvailable: ComputedRef<boolean>;
  isLoading: Ref<boolean>;
};

export const resolveDemoAccountCredentialsConfig = (
  source = env,
): DemoAccountCredentialsConfig | null => {
  const email = source.DEMO_ACCOUNT_EMAIL?.trim();
  const password = source.DEMO_ACCOUNT_PASSWORD?.trim();

  if (!email || !password) {
    return null;
  }

  return {
    email,
    password,
  };
};

export const resolveDemoAccountRedirect = (search: string) => {
  const params = new URLSearchParams(search);
  return params.get('redirect') || urlProfile();
};

export const createPasswordDemoAccountProvider = (): DemoAccountAuthProvider => {
  const authRepository = useRepositoryAuth();
  const sessionStore = useSessionStore();
  const isLoading = ref(false);

  const resetDemoLoginFlow = () => {
    void authRepository
      .getAuthFlow(SELFSERVICE.login)
      .then((flow) => oryResponseHandling(flow as any));
  };

  const isAvailable = computed(() => Boolean(resolveDemoAccountCredentialsConfig()));

  const authenticate = async () => {
    const credentials = resolveDemoAccountCredentialsConfig();

    if (!credentials || isLoading.value || typeof window === 'undefined') {
      return false;
    }

    isLoading.value = true;

    try {
      const flow = await authRepository.getAuthFlow(SELFSERVICE.login);
      oryResponseHandling(flow as any);

      if (authRepository.getAuthFlowState.value.error) {
        return false;
      }

      await authRepository.setLogin(authRepository.flowId.value, {
        identifier: credentials.email,
        password: credentials.password,
        method: 'password',
        csrf_token: authRepository.csrfToken.value,
      });

      const session = authRepository.setLoginState.value.data?.session;

      if (authRepository.setLoginState.value.error || !session) {
        return false;
      }

      sessionStore.updateSession(session);
      navigateWithQueryParams(resolveDemoAccountRedirect(window.location.search));

      return true;
    } catch (error) {
      await oryErrorHandling(
        error as any,
        'login',
        resetDemoLoginFlow,
        'Failed to login demo account',
      );

      return false;
    } finally {
      isLoading.value = false;
    }
  };

  return {
    authenticate,
    isAvailable,
    isLoading,
  };
};

export const useDemoAccountAuth = () => createPasswordDemoAccountProvider();
