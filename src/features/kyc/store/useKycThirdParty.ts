import { ref, computed } from 'vue';
import { toasterErrorHandlingAnalytics } from 'InvestCommon/data/repository/error/toasterErrorHandlingAnalytics';
import { loadPlaidScriptOnce, PlaidHandler } from 'InvestCommon/data/plaid/loadPlaidScriptOnce';

// Keep a single Plaid handler within this module
let plaidHandler: PlaidHandler | null = null;
let expectedLinkSessionId: string | null = null;

export function useKycThirdParty() {
  const isPlaidLoading = ref(false);
  const plaidSuccess = ref(false);

  const query = computed(() => new URLSearchParams(window.location.search));
  const token = computed(() => query.value.get('token'));

  const handlePlaidKycThirdParty = async () => {
    isPlaidLoading.value = true;
    try {
      if (token.value) {
        await loadPlaidScriptOnce();
        expectedLinkSessionId = null;
        plaidHandler = window?.Plaid.create({
          token: token.value,
          onSuccess: (_publicToken: string, metadata: any) => {
            if (expectedLinkSessionId && metadata?.link_session_id !== expectedLinkSessionId) return;
            isPlaidLoading.value = false;
            plaidSuccess.value = true;
          },
          onLoad: () => {
            console.log('plaid own onload event');
          },
          onExit: (err: unknown, metadata: any) => {
            console.log('plaid on exit event', err, metadata);
            console.log('update account with failed kyc status');
            isPlaidLoading.value = false;
          },
          onEvent: (eventName: string, metadata: any) => {
            if (!expectedLinkSessionId && metadata?.link_session_id) {
              expectedLinkSessionId = metadata.link_session_id;
            }
            console.log('plaid on event', eventName, metadata);
          },
          receivedRedirectUri: null,
        });
        setTimeout(() => { if (plaidHandler) plaidHandler.open(); }, 1000);
      }
    } catch (err) {
      isPlaidLoading.value = false;
      toasterErrorHandlingAnalytics(err, 'Failed to handle Plaid KYC');
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
