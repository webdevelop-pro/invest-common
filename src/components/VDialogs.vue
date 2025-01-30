<script setup lang="ts">
import { defineAsyncComponent } from 'vue';
import { useDialogs } from 'InvestCommon/store/useDialogs';
import { storeToRefs } from 'pinia';


// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
const VDialogLogOut = defineAsyncComponent({
  loader: () => import('InvestCommon/components/dialogs/VDialogLogOut.vue'),
});

// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
const VDialogWalletAddTransaction = defineAsyncComponent({
  loader: () => import('InvestCommon/components/dialogs/VDialogWalletAddTransaction.vue'),
});

// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
const VDialogPortfolioCancelInvestment = defineAsyncComponent({
  loader: () => import('InvestCommon/components/dialogs/VDialogPortfolioCancelInvestment.vue'),
});

// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
const VDialogPortfolioTransaction = defineAsyncComponent({
  loader: () => import('InvestCommon/components/dialogs/VDialogPortfolioTransaction.vue'),
});

// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
const VDialogPortfolioWire = defineAsyncComponent({
  loader: () => import('InvestCommon/components/dialogs/VDialogPortfolioWire.vue'),
});


// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
const VDialogDocument = defineAsyncComponent({
  loader: () => import('InvestCommon/components/dialogs/VDialogDocument.vue'),
});

const useDialogsStore = useDialogs();
const {
  isDialogLogoutOpen, isDialogAddTransactionOpen, addTransactiontTransactionType,
  isDialogCancelInvestmentOpen, cancelInvestmentInvestment,
  isDialogTransactionOpen, transactionInvestment, transactionuserName,
  isDialogWireOpen, wireInvestment, wireuserName,
  isDialogDocumentOpen, documentClose, documentOpen, documentSignup,
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
  </div>
</template>
