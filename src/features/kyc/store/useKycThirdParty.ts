import { ref, computed } from 'vue';
import { acceptHMRUpdate, defineStore } from 'pinia';
import { toasterErrorHandling } from 'InvestCommon/data/repository/error/toasterErrorHandling';
import { useToast } from 'UiKit/components/Base/VToast/use-toast';

export const useKycThirdParty = defineStore('useKycThirdParty', () => {
  const isPlaidLoading = ref(false);
  const query = computed(() => new URLSearchParams(window.location.search));
  const token = computed(() => query.value.get('token'));
  // const expiration = computed(() => query.value.get('expiration'));
  // const requestId = computed(() => query.value.get('request_id'));

  const { toast } = useToast();

  const handlePlaidKycThirdParty = async () => {
    isPlaidLoading.value = true;
    try {
      if (token.value) {
        const plaidScript = document.createElement('script');
        plaidScript.setAttribute('src', 'https://cdn.plaid.com/link/v2/stable/link-initialize.js');
        document.head.appendChild(plaidScript);
        plaidScript.onload = () => {
          const handler = window?.Plaid.create({
            token: token.value,
            onSuccess: () => {
              isPlaidLoading.value = false;
              toast({
                title: 'Thank you for completing KYC',
                description: 'Your KYC process is now complete.',
                variant: 'info',
              });
            },
            onLoad: () => {
              console.log('plaid own onload event');
            },
            onExit: (err: unknown, metadata: unknown) => {
              console.log('plaid on exit event', err, metadata);
              console.log('update account with failed kyc status');
              isPlaidLoading.value = false;
            },
            onEvent: (eventName: string, metadata: any) => {
              console.log('plaid on event', eventName, metadata);
            },
            receivedRedirectUri: null,
          });
          setTimeout(handler.open, 1000);
        };
      }
    } catch (err) {
      isPlaidLoading.value = false;
      toasterErrorHandling(err, 'Failed to handle Plaid KYC');
    }
  };

  return {
    handlePlaidKycThirdParty,
  };
});

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useKycThirdParty, import.meta.hot));
}
