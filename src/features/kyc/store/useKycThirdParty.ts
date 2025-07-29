import { ref, computed } from 'vue';
import { globalErrorHandling } from 'InvestCommon/data/repository/error/globalErrorHandling';
import { useToast } from 'UiKit/components/Base/VToast/use-toast';

export function useKycThirdParty() {
  const isPlaidLoading = ref(false);
  const plaidSuccess = ref(false);
  const { toast } = useToast();

  const query = computed(() => new URLSearchParams(window.location.search));
  const token = computed(() => query.value.get('token'));

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
              plaidSuccess.value = true;
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
      globalErrorHandling(err, 'Failed to handle Plaid KYC');
    }
  };

  return {
    handlePlaidKycThirdParty,
    isPlaidLoading,
    plaidSuccess,
    token,
    query,
  };
}
