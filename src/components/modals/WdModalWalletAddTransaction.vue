<script setup lang="ts">
import BaseModalLayout from 'UiKit/components/BaseModal/BaseModalLayout.vue';
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
  <BaseModalLayout
    class="WdModalWalletAddTransaction wd-modal-wallet-add-transaction"
    @close="$emit('close')"
  >
    <template #default>
      <FormWalletAddTransaction
        :transaction-type="transactionType"
        @cancel="$emit('close')"
      />
    </template>
  </BaseModalLayout>
</template>

<style lang="scss">
.wd-modal-wallet-add-transaction {
  width: 100%;
  min-height: 100%;
}
</style>
