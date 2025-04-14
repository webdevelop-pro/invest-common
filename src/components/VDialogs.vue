<script setup lang="ts">
import { defineAsyncComponent } from 'vue';
import { useDialogs } from 'InvestCommon/store/useDialogs';
import { storeToRefs } from 'pinia';

const VDialogLogOut = defineAsyncComponent({
  loader: () => import('InvestCommon/components/dialogs/VDialogLogOut.vue'),
});

const VDialogWalletAddTransaction = defineAsyncComponent({
  loader: () => import('InvestCommon/components/dialogs/VDialogWalletAddTransaction.vue'),
});

const VDialogPortfolioCancelInvestment = defineAsyncComponent({
  loader: () => import('InvestCommon/components/dialogs/VDialogPortfolioCancelInvestment.vue'),
});

const VDialogPortfolioTransaction = defineAsyncComponent({
  loader: () => import('InvestCommon/components/dialogs/VDialogPortfolioTransaction.vue'),
});

const VDialogPortfolioWire = defineAsyncComponent({
  loader: () => import('InvestCommon/components/dialogs/VDialogPortfolioWire.vue'),
});

const VDialogDocument = defineAsyncComponent({
  loader: () => import('InvestCommon/components/dialogs/VDialogDocument.vue'),
});

const VDialogContactUs = defineAsyncComponent({
  loader: () => import('InvestCommon/components/dialogs/VDialogContactUs.vue'),
});

const VDialogMfa = defineAsyncComponent({
  loader: () => import('InvestCommon/components/dialogs/VDialogMfa.vue'),
});

const VDialogRefreshSession = defineAsyncComponent({
  loader: () => import('InvestCommon/components/dialogs/VDialogRefreshSession.vue'),
});

const useDialogsStore = useDialogs();
const {
  isDialogLogoutOpen, isDialogAddTransactionOpen, addTransactiontTransactionType,
  isDialogCancelInvestmentOpen, cancelInvestmentInvestment,
  isDialogTransactionOpen, transactionInvestment, transactionuserName,
  isDialogWireOpen, wireInvestment, wireuserName,
  isDialogDocumentOpen, documentClose, documentOpen, documentSignup,
  isDialogContactUsOpen, isDialogMfaOpen, isDialogRefreshSessionOpen,
} = storeToRefs(useDialogsStore);
</script>

<template>
  <div>
    <VDialogLogOut
      v-if="isDialogLogoutOpen"
      v-model="isDialogLogoutOpen"
    />
    <VDialogWalletAddTransaction
      v-if="isDialogAddTransactionOpen"
      v-model="isDialogAddTransactionOpen"
      :transaction-type="addTransactiontTransactionType"
    />
    <VDialogPortfolioCancelInvestment
      v-if="isDialogCancelInvestmentOpen"
      v-model="isDialogCancelInvestmentOpen"
      :investment="cancelInvestmentInvestment"
    />
    <VDialogPortfolioTransaction
      v-if="isDialogTransactionOpen"
      v-model="isDialogTransactionOpen"
      :investment="transactionInvestment"
      :user-name="transactionuserName"
    />
    <VDialogPortfolioWire
      v-if="isDialogWireOpen"
      v-model="isDialogWireOpen"
      :investment="wireInvestment"
      :user-name="wireuserName"
    />
    <VDialogDocument
      v-if="isDialogDocumentOpen"
      v-model="isDialogDocumentOpen"
      :sign-url="documentSignup"
      :close="documentClose"
      :open="documentOpen"
    />
    <VDialogContactUs
      v-if="isDialogContactUsOpen"
      v-model="isDialogContactUsOpen"
    />
    <VDialogMfa
      v-if="isDialogMfaOpen"
      v-model="isDialogMfaOpen"
    />
    <VDialogRefreshSession
      v-if="isDialogRefreshSessionOpen"
      v-model="isDialogRefreshSessionOpen"
    />
  </div>
</template>
