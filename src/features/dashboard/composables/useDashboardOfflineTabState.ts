import { computed, shallowRef, watch } from 'vue';
import { storeToRefs } from 'pinia';
import { DashboardTabTypes } from '../utils';
import { useOfflineStatus } from 'InvestCommon/domain/pwa/useOfflineStatus';
import { useProfilesStore } from 'InvestCommon/domain/profiles/store/useProfiles';
import { useRepositoryProfiles } from 'InvestCommon/data/profiles/profiles.repository';
import { useRepositoryInvestment } from 'InvestCommon/data/investment/investment.repository';
import { useRepositoryWallet } from 'InvestCommon/data/wallet/wallet.repository';
import { useRepositoryEvm } from 'InvestCommon/data/evm/evm.repository';
import { useRepositoryDistributions } from 'InvestCommon/data/distributions/distributions.repository';
import { useRepositoryOffer } from 'InvestCommon/data/offer/offer.repository';

type OfflineTabStatus = 'idle' | 'checking' | 'available' | 'unavailable';

type OfflineUnavailableCopy = {
  title: string;
  message: string;
  detail: string;
};

const OFFLINE_UNAVAILABLE_COPY: Record<DashboardTabTypes, OfflineUnavailableCopy> = {
  [DashboardTabTypes.summary]: {
    title: 'Summary is not available offline yet',
    message: 'This section was not saved on this device.',
    detail: 'Reconnect to refresh your account summary and recent activity.',
  },
  [DashboardTabTypes.portfolio]: {
    title: 'Portfolio is not available offline yet',
    message: 'This section was not saved on this device.',
    detail: 'Reconnect to load your investments and performance details.',
  },
  [DashboardTabTypes.acount]: {
    title: 'Profile details are not available offline yet',
    message: 'This section was not saved on this device.',
    detail: 'Reconnect to view or update your account details.',
  },
  [DashboardTabTypes.wallet]: {
    title: 'Wallet is not available offline yet',
    message: 'This section was not saved on this device.',
    detail: 'Reconnect to review balances and transaction history.',
  },
  [DashboardTabTypes.evmwallet]: {
    title: 'Wallet is not available offline yet',
    message: 'This section was not saved on this device.',
    detail: 'Reconnect to review balances and transaction history.',
  },
  [DashboardTabTypes.distributions]: {
    title: 'Distributions are not available offline yet',
    message: 'This section was not saved on this device.',
    detail: 'Reconnect to load payout history and chart data.',
  },
  [DashboardTabTypes.earn]: {
    title: 'Earn is not available offline yet',
    message: 'This section was not saved on this device.',
    detail: 'Reconnect to load the latest earning opportunities.',
  },
};

export function useDashboardOfflineTabState(activeTab: Readonly<{ value: DashboardTabTypes }>) {
  const { isOffline } = useOfflineStatus();
  const profilesStore = useProfilesStore();
  const { selectedUserProfileData, selectedUserProfileId, selectedUserProfileType } = storeToRefs(profilesStore);

  const profilesRepository = useRepositoryProfiles();
  const { getProfileByIdState } = storeToRefs(profilesRepository);
  const investmentRepository = useRepositoryInvestment();
  const { getInvestmentsState } = storeToRefs(investmentRepository);
  const walletRepository = useRepositoryWallet();
  const { getWalletState } = storeToRefs(walletRepository);
  const evmRepository = useRepositoryEvm();
  const { getEvmWalletState } = storeToRefs(evmRepository);
  const distributionsRepository = useRepositoryDistributions();
  const { getDistributionsState } = storeToRefs(distributionsRepository);
  const offerRepository = useRepositoryOffer();
  const { getOffersState } = storeToRefs(offerRepository);

  const tabStatuses = shallowRef<Record<DashboardTabTypes, OfflineTabStatus>>({
    [DashboardTabTypes.summary]: 'idle',
    [DashboardTabTypes.portfolio]: 'idle',
    [DashboardTabTypes.acount]: 'idle',
    [DashboardTabTypes.wallet]: 'idle',
    [DashboardTabTypes.evmwallet]: 'idle',
    [DashboardTabTypes.distributions]: 'idle',
    [DashboardTabTypes.earn]: 'idle',
  });

  const profileId = computed(() => Number(selectedUserProfileId.value || 0));

  const hasTabData = (tab: DashboardTabTypes) => {
    switch (tab) {
      case DashboardTabTypes.summary:
        return Boolean(
          getInvestmentsState.value.data?.data?.length
          || getOffersState.value.data?.data?.length
          || getWalletState.value.data
          || getEvmWalletState.value.data,
        );
      case DashboardTabTypes.portfolio:
        return Boolean(getInvestmentsState.value.data?.data);
      case DashboardTabTypes.acount:
        return Boolean(selectedUserProfileData.value?.data || getProfileByIdState.value.data);
      case DashboardTabTypes.wallet:
      case DashboardTabTypes.evmwallet:
        return Boolean(getWalletState.value.data || getEvmWalletState.value.data);
      case DashboardTabTypes.distributions:
        return Boolean(getDistributionsState.value.data);
      case DashboardTabTypes.earn:
        return Boolean(getOffersState.value.data?.data?.length);
      default:
        return false;
    }
  };

  const ensureTabData = async (tab: DashboardTabTypes) => {
    switch (tab) {
      case DashboardTabTypes.summary:
        if (!getInvestmentsState.value.data?.data && profileId.value > 0) {
          await investmentRepository.getInvestments(String(profileId.value)).catch(() => undefined);
        }
        if (!getOffersState.value.data?.data) {
          await offerRepository.getOffers().catch(() => undefined);
        }
        return;
      case DashboardTabTypes.portfolio:
        if (!getInvestmentsState.value.data?.data && profileId.value > 0) {
          await investmentRepository.getInvestments(String(profileId.value)).catch(() => undefined);
        }
        return;
      case DashboardTabTypes.acount:
        if (!getProfileByIdState.value.data && profileId.value > 0 && selectedUserProfileType.value) {
          await profilesRepository.getProfileById(
            selectedUserProfileType.value,
            profileId.value,
          ).catch(() => undefined);
        }
        return;
      case DashboardTabTypes.wallet:
      case DashboardTabTypes.evmwallet:
        if (!getWalletState.value.data && profileId.value > 0) {
          await walletRepository.getWalletByProfile(profileId.value).catch(() => undefined);
        }
        if (!getEvmWalletState.value.data && profileId.value > 0) {
          await evmRepository.getEvmWalletByProfile(profileId.value, []).catch(() => undefined);
        }
        return;
      case DashboardTabTypes.distributions:
        if (!getDistributionsState.value.data && profileId.value > 0) {
          await distributionsRepository.getDistributions(String(profileId.value)).catch(() => undefined);
        }
        return;
      case DashboardTabTypes.earn:
        if (!getOffersState.value.data?.data) {
          await offerRepository.getOffers().catch(() => undefined);
        }
        return;
      default:
    }
  };

  const markTabStatus = (tab: DashboardTabTypes, status: OfflineTabStatus) => {
    tabStatuses.value = {
      ...tabStatuses.value,
      [tab]: status,
    };
  };

  const evaluateActiveTab = async (tab: DashboardTabTypes) => {
    if (!isOffline.value) {
      return;
    }

    if (hasTabData(tab)) {
      markTabStatus(tab, 'available');
      return;
    }

    markTabStatus(tab, 'checking');
    await ensureTabData(tab);
    markTabStatus(tab, hasTabData(tab) ? 'available' : 'unavailable');
  };

  watch(
    () => [activeTab.value, isOffline.value, profileId.value, selectedUserProfileType.value] as const,
    ([tab, offline]) => {
      if (!offline) {
        markTabStatus(tab, 'idle');
        return;
      }

      void evaluateActiveTab(tab);
    },
    { immediate: true },
  );

  const activeTabStatus = computed(() => (
    isOffline.value ? tabStatuses.value[activeTab.value] : 'available'
  ));
  const shouldShowUnavailableState = computed(() => activeTabStatus.value === 'unavailable');
  const activeTabCopy = computed(() => OFFLINE_UNAVAILABLE_COPY[activeTab.value]);

  return {
    activeTabStatus,
    activeTabCopy,
    shouldShowUnavailableState,
  };
}
