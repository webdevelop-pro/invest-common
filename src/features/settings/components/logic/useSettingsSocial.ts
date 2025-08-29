import { computed, ref } from 'vue';
import { storeToRefs } from 'pinia';
import { useSessionStore } from 'InvestCommon/domain/session/store/useSession';
import { useRepositorySettings } from 'InvestCommon/data/settings/settings.repository';
import { useToast } from 'UiKit/components/Base/VToast/use-toast';
import { SELFSERVICE } from 'InvestCommon/features/settings/utils';

import GoogleIcon from 'InvestCommon/shared/assets/images/social-login/google1.svg?component';
import FacebookIcon from 'InvestCommon/shared/assets/images/social-login/facebook1.svg?component';
import GithubIcon from 'InvestCommon/shared/assets/images/social-login/github1.svg?component';
import LinkedinIcon from 'InvestCommon/shared/assets/images/social-login/linkedin1.svg?component';
import GoogleHoverIcon from 'InvestCommon/shared/assets/images/social-login/google1-hover.svg?component';
import FacebookHoverIcon from 'InvestCommon/shared/assets/images/social-login/facebook-hover.svg?component';
import GithubHoverIcon from 'InvestCommon/shared/assets/images/social-login/github1-hover.svg?component';
import LinkedinHoverIcon from 'InvestCommon/shared/assets/images/social-login/linkedin-hover.svg?component';

export const useSettingsSocial = () => {
  const socialSignin = [
    {
      icon: GoogleIcon,
      iconHover: GoogleHoverIcon,
      provider: 'google',
      classes: 'login-social-google',
    },
    {
      icon: FacebookIcon,
      iconHover: FacebookHoverIcon,
      provider: 'facebook',
      classes: 'login-social-facebook',
    },
    {
      icon: GithubIcon,
      iconHover: GithubHoverIcon,
      provider: 'github',
      classes: 'login-social-github',
    },
    {
      icon: LinkedinIcon,
      iconHover: LinkedinHoverIcon,
      provider: 'linkedin',
      classes: 'login-social-linkedin',
    },
  ];

  const userSessionStore = useSessionStore();
  const { userSession } = storeToRefs(userSessionStore);
  const settingsRepository = useRepositorySettings();
  const { flowId, csrfToken, setSettingsState, getAuthFlowState } = storeToRefs(settingsRepository);

  const loadingProvider = ref();
  const isLoading = ref(false);
  const { toast } = useToast();

  const oidcSocials = computed(() => 
    getAuthFlowState.value.data?.ui?.nodes?.filter((item) => item.group === 'oidc')
  );
  
  const loggedInSocial = computed(() => 
    userSession.value?.authentication_methods?.filter((item) => item?.method === 'oidc')
  );

  const data = computed(() => {
    const res: any[] = [];
    oidcSocials.value?.forEach((item) => {
      res.push({
        ...socialSignin.find((social) => social?.provider === item?.attributes?.value),
        linked: item?.attributes?.name !== 'link',
      });
    });
    loggedInSocial.value?.forEach((item) => {
      res.push({
        ...socialSignin.find((social) => social?.provider === item?.provider),
        linked: true,
        disabled: true,
      });
    });
    return res;
  });

  const onSocialLoginHandler = async (provider: string, toLink: boolean) => {
    loadingProvider.value = provider;
    const dataToSend = toLink ? { link: provider } : { unlink: provider };
    isLoading.value = true;
    
    try {
      await settingsRepository.getAuthFlow(SELFSERVICE.settings);
      
      if (getAuthFlowState.value.error) {
        isLoading.value = false;
        loadingProvider.value = null;
        return;
      }

      await settingsRepository.setSettings(flowId.value, {
        csrf_token: csrfToken.value,
        ...dataToSend,
      }, () => onSocialLoginHandler(provider, toLink)); // Pass resetHandler as callback for retry after session refresh

      if (!setSettingsState.value.error) {
        settingsRepository.getAuthFlow(SELFSERVICE.settings);
        toast({
          title: 'Submitted',
          description: 'Setup confirmed',
          variant: 'success',
        });
        return true; // Indicate success
      }
    } catch (error) {
      console.error('Recovery failed:', error);
    } finally {
      isLoading.value = false;
      loadingProvider.value = null;
    }
  };

  return {
    socialSignin,
    data,
    loadingProvider,
    isLoading,
    onSocialLoginHandler,
  };
};
