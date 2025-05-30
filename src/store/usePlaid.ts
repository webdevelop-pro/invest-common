import { ref } from 'vue';
import { fetchCreateToken } from 'InvestCommon/services/api/plaid';
import { generalErrorHandling } from 'UiKit/helpers/generalErrorHandling';
import { IPlaidTokenResponse } from 'InvestCommon/types/api/plaid';
import { acceptHMRUpdate, defineStore, storeToRefs } from 'pinia';
import { ROUTE_DASHBOARD_PORTFOLIO } from 'InvestCommon/helpers/enums/routes';
import { useRedirect } from 'InvestCommon/composable/useRedirect';
import { useRouter } from 'vue-router';
// import { useKYCIdentityStore } from './useKYCIdentity';
import { navigateWithQueryParams } from 'UiKit/helpers/general';
import env from 'InvestCommon/global';
import { urlProfilePortfolio } from 'InvestCommon/global/links';
import { useUsersStore } from './useUsers';

const { IS_STATIC_SITE } = env;

const isCreateTokenLoading = ref(false);
const isCreateTokenError = ref(false);
const createTokenData = ref<IPlaidTokenResponse>();

export interface IPlaidHandler {
  open: () => void;
}

export interface IEventMetadata {
  link_session_id: string;
  request_id: string;
  timestamp: string;
}
// store with plaid function to create token

export const usePlaidStore = defineStore('plaid', () => {
  const usersStore = useUsersStore();
  const { selectedUserProfileData, selectedUserProfileId } = storeToRefs(usersStore);
  // const kycIdentitiesStore = useKYCIdentityStore();

  const createToken = async (profileId: number) => {
    isCreateTokenLoading.value = true;
    isCreateTokenError.value = false;
    const response = await fetchCreateToken(profileId).catch((error: Response) => {
      isCreateTokenError.value = true;
      generalErrorHandling(error);
    });
    if (response) createTokenData.value = response;
    isCreateTokenLoading.value = false;
  };

  const handlePlaidKyc = async () => {
    if (!selectedUserProfileData.value?.id) {
      return;
    }
    await createToken(selectedUserProfileData.value?.id);

    console.log('plaid link data ', createTokenData.value);
    if (createTokenData.value && createTokenData.value.link_token) {
      const plaidScript = document.createElement('script');
      plaidScript.setAttribute('src', 'https://cdn.plaid.com/link/v2/stable/link-initialize.js');
      document.head.appendChild(plaidScript);
      plaidScript.onload = () => {
        const handler = window?.Plaid.create({
          token: createTokenData.value?.link_token,
          onSuccess: (publicToken: string, metadata: unknown) => {
            console.log('plaid success event', publicToken, metadata);
            console.log('update account with new kyc status');
            // await kycIdentitiesStore.updateUserPlaidIdentities();
            usersStore.updateUserSelectedAccount();
            if (IS_STATIC_SITE) {
              navigateWithQueryParams(urlProfilePortfolio(selectedUserProfileId.value));
            } else {
              const { pushTo } = useRedirect();
              const router = useRouter();
              router.push(pushTo({
                name: ROUTE_DASHBOARD_PORTFOLIO,
                params: { profileId: selectedUserProfileId.value },
              }));
            }
          },
          onLoad: () => {
            console.log('plaid own onload even');
          },
          onExit: (err: unknown, metadata: unknown) => {
            console.log('plaid on exit event', err, metadata);
            console.log('update account with failed kyc status');
            isCreateTokenLoading.value = false;
          },
          onEvent: (eventName: string, metadata: IEventMetadata) => {
            console.log('plaid on event', eventName, metadata);
          },
          // required for OAuth; if not using OAuth, set to null or omit:
          receivedRedirectUri: null, // window.location.href,
        }) as IPlaidHandler;
        setTimeout(handler.open, 1000);
      };
    } else {
      isCreateTokenLoading.value = false;
    }
  };

  const resetAll = () => {
    createTokenData.value = undefined;
  };

  return {
    isCreateTokenLoading,
    isCreateTokenError,
    createTokenData,
    createToken,
    resetAll,
    handlePlaidKyc,
  };
});

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(usePlaidStore, import.meta.hot));
}
