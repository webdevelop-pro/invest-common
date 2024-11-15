<script setup lang="ts">
import VModalLayout from 'UiKit/components/VModal/VModalLayout.vue';
import FormWalletAddTransaction from 'InvestCommon/components/forms/FormWalletAddTransaction.vue';
import { WalletAddTransactionTypes } from 'InvestCommon/types/api/wallet';
import { PropType } from 'vue';

defineEmits(['close']);
defineProps({
  transactionType: {
    type: String as PropType<WalletAddTransactionTypes>,
    required: true,
  },
});
</script>

<template>
  <VModalLayout
    class="WdModalWalletAddTransaction wd-modal-wallet-add-transaction is--no-margin"
    @close="$emit('close')"
  >
    <template #default>
      <FormWalletAddTransaction
        :transaction-type="transactionType"
        @cancel="$emit('close')"
      />
    </template>
  </VModalLayout>
</template>

<style lang="scss">
.wd-modal-wallet-add-transaction {
  width: 100%;
  min-height: 100%;
}
</style>
