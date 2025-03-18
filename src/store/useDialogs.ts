/* eslint-disable @typescript-eslint/no-unsafe-function-type */
import { ref } from 'vue';
import { acceptHMRUpdate, defineStore } from 'pinia';
import { WalletAddTransactionTypes } from 'InvestCommon/types/api/wallet';
import { IInvest } from 'InvestCommon/types/api/invest';

export const useDialogs = defineStore('dialogs', () => {
  const isDialogLogoutOpen = ref(false);

  const isDialogAddTransactionOpen = ref(false);
  const addTransactiontTransactionType = ref<WalletAddTransactionTypes>();

  const showDialogAddTransaction = (transactionType: WalletAddTransactionTypes) => {
    addTransactiontTransactionType.value = transactionType;
    isDialogAddTransactionOpen.value = true;
  };

  const isDialogCancelInvestmentOpen = ref(false);
  const cancelInvestmentInvestment = ref<IInvest>();

  const showCancelInvestment = (investment: IInvest) => {
    cancelInvestmentInvestment.value = investment;
    isDialogCancelInvestmentOpen.value = true;
  };

  const isDialogTransactionOpen = ref(false);
  const transactionInvestment = ref<IInvest>();
  const transactionuserName = ref<string>();

  const showTransaction = (investment: IInvest, userName: string) => {
    transactionInvestment.value = investment;
    isDialogTransactionOpen.value = true;
    transactionuserName.value = userName;
  };

  const isDialogWireOpen = ref(false);
  const wireInvestment = ref<IInvest>();
  const wireuserName = ref<string>();

  const showWire = (investment: IInvest, userName: string) => {
    wireInvestment.value = investment;
    isDialogWireOpen.value = true;
    wireuserName.value = userName;
  };

  const isDialogDocumentOpen = ref(false);
  const documentSignup = ref<string>();
  const documentOpen = ref<Function>();
  const documentClose = ref<Function>();

  const showDocument = (signup: string, open: Function, close: Function) => {
    documentSignup.value = signup;
    isDialogDocumentOpen.value = true;
    documentOpen.value = open;
    documentClose.value = close;
  };

  const hideDocument = () => {
    isDialogDocumentOpen.value = false;
  };

  return {
    isDialogLogoutOpen,
    showDialogAddTransaction,
    isDialogAddTransactionOpen,
    addTransactiontTransactionType,
    showCancelInvestment,
    cancelInvestmentInvestment,
    isDialogCancelInvestmentOpen,
    showTransaction,
    transactionInvestment,
    isDialogTransactionOpen,
    transactionuserName,
    showWire,
    isDialogWireOpen,
    wireInvestment,
    wireuserName,
    showDocument,
    isDialogDocumentOpen,
    documentSignup,
    documentOpen,
    documentClose,
    hideDocument,
  };
});

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useDialogs, import.meta.hot));
}
