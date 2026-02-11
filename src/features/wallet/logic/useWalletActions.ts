import { computed } from 'vue';
import { storeToRefs } from 'pinia';
import { useRouter, useRoute } from 'vue-router';
import { useRepositoryEvm } from 'InvestCommon/data/evm/evm.repository';
import { useRepositoryWallet } from 'InvestCommon/data/wallet/wallet.repository';
import { EvmTransactionTypes } from 'InvestCommon/data/evm/evm.types';
import { useProfilesStore } from 'InvestCommon/domain/profiles/store/useProfiles';
import { hasRestrictedWalletBehavior } from 'InvestCommon/features/wallet/helpers/walletProfileHelpers';
import type { IProfileFormatted } from 'InvestCommon/data/profiles/profiles.types';
import { currency } from 'InvestCommon/helpers/currency';
import env from 'InvestCommon/domain/config/env';
import { ROUTE_DASHBOARD_EARN, ROUTE_SETTINGS_BANK_ACCOUNTS } from 'InvestCommon/domain/config/enums/routes';
import plus from 'UiKit/assets/images/plus.svg';

const WALLET_SCAN_URL = env.CRYPTO_WALLET_SCAN_URL as string;

export function useWalletActions(
  props: { isError?: boolean } = {},
  emit?: (e: 'click', type: EvmTransactionTypes) => void,
) {
  const router = useRouter();
  const route = useRoute();
  const { getEvmWalletState } = storeToRefs(useRepositoryEvm());
  const { getWalletState } = storeToRefs(useRepositoryWallet());
  const { selectedUserProfileData, selectedUserProfileId } = storeToRefs(useProfilesStore());

  const isShowIncomingBalance = computed(
    () => (getEvmWalletState.value.data?.pendingIncomingBalance ?? 0) > 0,
  );
  const isShowOutgoingBalance = computed(
    () => (getEvmWalletState.value.data?.pendingOutcomingBalance ?? 0) > 0,
  );

  const hasRestrictedWallet = computed(() =>
    hasRestrictedWalletBehavior((selectedUserProfileData.value ?? null) as IProfileFormatted | null),
  );
  const isWalletReady = computed(() => {
    const { data, loading, error } = getEvmWalletState.value;
    return (
      !loading &&
      !error &&
      !props.isError &&
      !!data &&
      (data.isStatusCreated || data.isStatusVerified) &&
      !data.isStatusAnyError
    );
  });

  const canAccessKycFeatures = computed(
    () =>
      isWalletReady.value &&
      !hasRestrictedWallet.value &&
      !!selectedUserProfileData.value?.isKycApproved,
  );
  const hasAvailableBalances = computed(() => {
    const balances = getEvmWalletState.value.data?.balances ?? [];
    return balances.some((b) => (Number(b?.amount) ?? 0) > 0);
  });
  const fiatCurrentBalance = computed(
    () => getWalletState.value.data?.currentBalance ?? 0,
  );
  const fiatPendingOutcomingBalance = computed(
    () => getWalletState.value.data?.pendingOutcomingBalance ?? 0,
  );
  const fiatMaxWithdrawable = computed(
    () => Math.max(0, fiatCurrentBalance.value - fiatPendingOutcomingBalance.value),
  );
  const hasFiatAvailable = computed(() => fiatMaxWithdrawable.value > 0);

  const canWithdraw = computed(
    () => isWalletReady.value && (hasAvailableBalances.value || hasFiatAvailable.value),
  );
  const canExchange = computed(() => isWalletReady.value && hasAvailableBalances.value);

  const buttonConfigs = computed(() => [
    {
      id: 'add-funds',
      label: 'Add Funds',
      variant: 'default',
      icon: plus,
      disabled: !canAccessKycFeatures.value,
      transactionType: EvmTransactionTypes.deposit,
    },
    {
      id: 'withdraw',
      label: 'Withdraw',
      variant: 'outlined',
      disabled: !canWithdraw.value,
      transactionType: EvmTransactionTypes.withdrawal,
    },
    {
      id: 'exchange',
      label: 'Exchange',
      variant: 'outlined',
      disabled: !canExchange.value,
      transactionType: EvmTransactionTypes.exchange,
    },
    {
      id: 'buy',
      label: 'Buy',
      variant: 'outlined',
      disabled: !canAccessKycFeatures.value,
      transactionType: null,
    },
    {
      id: 'earn',
      label: 'Earn',
      variant: 'outlined',
      disabled: !canAccessKycFeatures.value,
      transactionType: null,
    },
    {
      id: 'bank-accounts',
      label: 'Bank Accounts',
      variant: 'outlined',
      disabled: false,
      transactionType: null,
    },
  ]);

  const balances = computed(() => [
    {
      title: 'Wallet Balance:',
      balance: currency(getEvmWalletState.value.data?.fundingBalance),
      href: `${WALLET_SCAN_URL}/address/${getEvmWalletState.value.data?.address}`,
    },
    ...(isShowIncomingBalance.value
      ? [
          {
            title: 'Incoming:',
            balance: `+ ${currency(getEvmWalletState.value.data?.pendingIncomingBalance)}`,
            label: 'Pending',
          },
        ]
      : []),
    ...(isShowOutgoingBalance.value
      ? [
          {
            title: 'Outgoing:',
            balance: `- ${currency(getEvmWalletState.value.data?.pendingOutcomingBalance)}`,
            label: 'Pending investment',
          },
        ]
      : []),
  ]);

  const handleButtonClick = (payload: { id: string | number; transactionType?: unknown }) => {
    if (payload.id === 'earn') {
      if (route.name === ROUTE_DASHBOARD_EARN) {
        const url = new URL(window.location.href);
        url.search = '';
        window.history.replaceState(history.state, '', url.toString());
        router.replace({ path: route.path, query: {} });
      } else {
        router.push({
          name: ROUTE_DASHBOARD_EARN,
          params: { profileId: selectedUserProfileId.value },
          query: {},
        });
      }
      return;
    }
    if (payload.id === 'bank-accounts') {
      router.push({
        name: ROUTE_SETTINGS_BANK_ACCOUNTS,
        params: { profileId: selectedUserProfileId.value },
      });
      return;
    }
    if (payload.transactionType && emit) {
      emit('click', payload.transactionType as EvmTransactionTypes);
    }
  };

  return {
    balances,
    buttonConfigs,
    handleButtonClick,
  };
}
