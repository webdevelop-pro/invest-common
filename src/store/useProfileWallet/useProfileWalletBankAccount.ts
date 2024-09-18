
import { IFundingSourceDataResponse } from 'InvestCommon/types/api/wallet';
import { acceptHMRUpdate, defineStore } from 'pinia';
import { computed, ref } from 'vue';

const STATUS_PENDING = 'pending';
// profile wallet bank account handling

export const useProfileWalletBankAccountStore = defineStore('walletBankAccount', () => {
  const bankAccount = ref<IFundingSourceDataResponse>();

  // FORMAT transaction
  const isBankAccountStatusPending = computed(() => (
    bankAccount.value?.status === STATUS_PENDING
  ));

  const bankAccountFormatted = computed(() => ({
    ...bankAccount.value,
    isBankAccountStatusPending: isBankAccountStatusPending.value,
  }));

  return {
    bankAccount,
    bankAccountFormatted,
  };
});

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useProfileWalletBankAccountStore, import.meta.hot));
}
