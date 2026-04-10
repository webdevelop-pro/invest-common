import { ref, computed } from 'vue';
import { acceptHMRUpdate, defineStore } from 'pinia';
import { ApiClient } from 'InvestCommon/data/service/apiClient';
import env from 'InvestCommon/config/env';
import { createRepositoryStates, withActionState } from 'InvestCommon/data/repository/repository';
import {
  IKycTokenResponse,
  KycPlaidLaunchResult,
} from './kyc.types';
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

const getPlaidLinkSessionId = (metadata: unknown): string | undefined => (
  metadata && typeof metadata === 'object' && 'link_session_id' in metadata
    ? (metadata as { link_session_id?: string }).link_session_id
    : undefined
);

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
  const createToken = async (profileId: number | string) =>
    withActionState(tokenState, async () => {
      const response = await apiClient.post<IKycTokenResponse>(`/auth/kyc/${profileId}`, {});
      kycToken.value = response.data ?? null;
      return response.data;
    });

  const launchPlaidLink = async (
    linkToken: string,
  ): Promise<KycPlaidLaunchResult> => {
    await loadPlaidScriptOnce();
    expectedLinkSessionId = null;

    return new Promise<KycPlaidLaunchResult>((resolve) => {
      let settled = false;

      const settle = (result: KycPlaidLaunchResult) => {
        if (settled) {
          return;
        }

        settled = true;
        isPlaidLoading.value = false;
        isPlaidDone.value = result.status === 'success';
        resolve(result);
      };

      plaidHandler = window?.Plaid.create({
        token: linkToken,
        onSuccess: (_publicToken: string, metadata: unknown) => {
          const linkSessionId = getPlaidLinkSessionId(metadata);

          if (expectedLinkSessionId && linkSessionId !== expectedLinkSessionId) {
            return;
          }

          settle({ status: 'success' });
        },
        onLoad: () => {
          if (import.meta.env.DEV) console.debug('[KYC Plaid] onLoad');
        },
        onExit: (err: unknown, metadata: unknown) => {
          if (import.meta.env.DEV) console.debug('[KYC Plaid] onExit', err, metadata);
          settle({ status: 'exit' });
        },
        onEvent: (eventName: string, metadata: unknown) => {
          const linkSessionId = getPlaidLinkSessionId(metadata);

          if (!expectedLinkSessionId && linkSessionId) {
            expectedLinkSessionId = linkSessionId;
          }

          if (import.meta.env.DEV) console.debug('[KYC Plaid] onEvent', eventName, metadata);
        },
        receivedRedirectUri: null,
      });

      setTimeout(() => { plaidHandler?.open(); }, PLAID_OPEN_DELAY_MS);
    });
  };

  const runPlaidFlow = async (
    resolveLinkToken: () => Promise<string | null | undefined> | string | null | undefined,
  ): Promise<KycPlaidLaunchResult | null> => {
    isPlaidLoading.value = true;
    isPlaidDone.value = false;

    try {
      const linkToken = await resolveLinkToken();

      if (!linkToken) {
        isPlaidLoading.value = false;
        return null;
      }

      return await launchPlaidLink(linkToken);
    } catch (err) {
      isPlaidLoading.value = false;
      throw err;
    }
  };

  const handlePlaidKycToken = async (
    linkToken: string,
  ): Promise<KycPlaidLaunchResult | null> => runPlaidFlow(() => linkToken);

  /**
   * Generalized Plaid KYC handler — caller must pass profileId (no store fallback).
   * Returns a promise that resolves when the Plaid Link flow is closed.
   * Result `status` is `success` when Plaid completes and `exit` when the flow is closed.
   */
  const handlePlaidKyc = async (
    profileId: number | string,
  ): Promise<KycPlaidLaunchResult | null> => runPlaidFlow(async () => (
    (await createToken(profileId))?.link_token
  ));

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
    handlePlaidKycToken,
    handlePlaidKyc,
    resetAll,
  };
});

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useRepositoryKyc, import.meta.hot));
}
