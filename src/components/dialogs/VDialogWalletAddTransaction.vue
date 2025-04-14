<script setup lang="ts">
import FormWalletAddTransaction from 'InvestCommon/components/forms/VFormWalletAddTransaction.vue';
import { WalletAddTransactionTypes } from 'InvestCommon/types/api/wallet';
import { PropType, ref, watch } from 'vue';
import {
  VDialogContent, VDialog,
  VDialogHeader,
  VDialogTitle,
} from 'UiKit/components/Base/VDialog';
import { useDialogs } from 'InvestCommon/store/useDialogs';
import { storeToRefs } from 'pinia';

const useDialogsStore = useDialogs();
const { isDialogAddTransactionOpen } = storeToRefs(useDialogsStore);

const open = defineModel<boolean>();
const props = defineProps({
  transactionType: {
    type: String as PropType<WalletAddTransactionTypes>,
    required: true,
  },
});

const isTypeDeposit = ref((props.transactionType === WalletAddTransactionTypes.deposit));
const titile = ref((isTypeDeposit.value ? 'Add Funds' : 'Withdraw'));

watch(() => open.value, () => {
  if (!open.value) {
    isDialogAddTransactionOpen.value = false;
  }
});
</script>

<template>
  <VDialog v-model:open="open">
    <VDialogContent
      :aria-describedby="undefined"
      class="VDialogWalletAddTransaction v-dialog-wallet-add-transaction"
    >
      <VDialogHeader>
        <VDialogTitle>
          {{ titile }}
        </VDialogTitle>
      </VDialogHeader>
      <FormWalletAddTransaction
        :transaction-type="transactionType"
        class="is--margin-top-20"
        @cancel="open = false"
      />
    </VDialogContent>
  </VDialog>
</template>

<style lang="scss">
.v-dialog-wallet-add-transaction {
  width: 100%;
}
</style>
