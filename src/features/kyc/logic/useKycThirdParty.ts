import {
  computed,
  readonly,
  shallowRef,
} from 'vue';
import { formatKycThirdPartyScreen } from 'InvestCommon/data/kyc/formatter/kycThirdPartyScreen.formatter';
import { useRepositoryKyc } from 'InvestCommon/data/kyc/kyc.repository';
import type { KycThirdPartyStatus } from 'InvestCommon/data/kyc/kyc.types';
import { reportError } from 'InvestCommon/domain/error/errorReporting';

export type { KycThirdPartyStatus } from 'InvestCommon/data/kyc/kyc.types';

const getLinkToken = () => {
  if (typeof window === 'undefined') {
    return null;
  }

  return new URLSearchParams(window.location.search).get('token');
};

export function useKycThirdParty() {
  const repositoryKyc = useRepositoryKyc();
  const status = shallowRef<KycThirdPartyStatus>('idle');
  const linkToken = getLinkToken();
  const screen = computed(() => formatKycThirdPartyScreen(status.value));

  const launch = async () => {
    if (!linkToken) {
      status.value = 'invalidToken';
      return;
    }

    status.value = 'launching';

    try {
      const result = await repositoryKyc.handlePlaidKycToken(linkToken);
      status.value = result?.status === 'success' ? 'success' : 'incomplete';
    } catch (error) {
      reportError(error, 'Failed to handle Plaid KYC');
      status.value = 'error';
    }
  };

  return {
    launch,
    screen,
    status: readonly(status),
  };
}
