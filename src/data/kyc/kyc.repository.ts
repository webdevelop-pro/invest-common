import { ref, computed } from 'vue';
import { acceptHMRUpdate, defineStore } from 'pinia';
import { ApiClient } from 'InvestCommon/data/service/apiClient';
import env from 'InvestCommon/domain/config/env';
import { createRepositoryStates, withActionState } from 'InvestCommon/data/repository/repository';
import { IKycTokenResponse } from './kyc.types';
import { loadPlaidScriptOnce, PlaidHandler } from 'InvestCommon/data/plaid/loadPlaidScriptOnce';

// Plaid SDK types (narrow when reading; SDK does not ship types in this project)
interface IPlaidCreateConfig {
  token?: string;
  onSuccess?: (publicToken: string, metadata: unknown) => void;
  onLoad?: () => void;
  onExit?: (err: unknown, metadata: unknown) => void;
  onEvent?: (eventName: string, metadata: unknown) => void;
  receivedRedirectUri?: string | null;
}

declare global {
  interface Window {
    Plaid: {
      create: (config: IPlaidCreateConfig) => { open: () => void };
    };
  }
}

// Keep a single Plaid handler within this module
let plaidHandler: PlaidHandler | null = null;
let expectedLinkSessionId: string | null = null;

/** Delay (ms) before opening the Plaid Link UI after create. */
const PLAID_OPEN_DELAY_MS = 1000;

type KycStates = {
  tokenState: IKycTokenResponse;
};

export const useRepositoryKyc = defineStore('repository-kyc', () => {
  const { PLAID_URL } = env;
  const apiClient = new ApiClient(PLAID_URL);

  const { tokenState, resetAll: resetActionStates } = createRepositoryStates<KycStates>({
    tokenState: undefined,
  });
  const kycToken = ref<IKycTokenResponse | null>(null);
  const isPlaidLoading = ref(false);
  const isPlaidDone = ref(false);

  // Computed
  const hasValidToken = computed(() => {
    if (!kycToken.value?.link_token || !kycToken.value?.expiration) return false;
    return new Date(kycToken.value.expiration) > new Date();
  });

  // Generalized token creation
  const createToken = async (profileId: number) =>
    withActionState(tokenState, async () => {
      const response = await apiClient.post<IKycTokenResponse>(`/auth/kyc/${profileId}`, {});
      kycToken.value = response.data ?? null;
      return response.data;
    });

  // Generalized Plaid KYC handler — caller must pass profileId (no store fallback).
  const handlePlaidKyc = async (profileId: number) => {
    isPlaidLoading.value = true;
    isPlaidDone.value = false;
    try {
      await createToken(profileId);
      if (kycToken.value && kycToken.value.link_token) {
        await loadPlaidScriptOnce();
        expectedLinkSessionId = null;
        plaidHandler = window?.Plaid.create({
          token: kycToken.value?.link_token,
          onSuccess: (publicToken: string, metadata: unknown) => {
            const linkSessionId = metadata && typeof metadata === 'object' && 'link_session_id' in metadata
              ? (metadata as { link_session_id?: string }).link_session_id
              : undefined;
            if (expectedLinkSessionId && linkSessionId !== expectedLinkSessionId) return;
            isPlaidLoading.value = false;
            isPlaidDone.value = true;
          },
          onLoad: () => {
            if (import.meta.env.DEV) console.debug('[KYC Plaid] onLoad');
          },
          onExit: (err: unknown, metadata: unknown) => {
            if (import.meta.env.DEV) console.debug('[KYC Plaid] onExit', err, metadata);
            isPlaidLoading.value = false;
          },
          onEvent: (eventName: string, metadata: unknown) => {
            const linkSessionId = metadata && typeof metadata === 'object' && 'link_session_id' in metadata
              ? (metadata as { link_session_id: string }).link_session_id
              : undefined;
            if (!expectedLinkSessionId && linkSessionId) {
              expectedLinkSessionId = linkSessionId;
            }
            if (import.meta.env.DEV) console.debug('[KYC Plaid] onEvent', eventName, metadata);
          },
          receivedRedirectUri: null,
        });
        setTimeout(() => { if (plaidHandler) plaidHandler.open(); }, PLAID_OPEN_DELAY_MS);
      }
    } catch (err) {
      isPlaidLoading.value = false;
      throw err;
    }
  };

  // Reset all state
  const resetAll = () => {
    kycToken.value = null;
    resetActionStates();
  };

  return {
    kycToken,
    hasValidToken,
    tokenState,
    isPlaidLoading,
    isPlaidDone,
    createToken,
    handlePlaidKyc,
    resetAll,
  };
});

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useRepositoryKyc, import.meta.hot));
}
