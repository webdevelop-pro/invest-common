<script setup lang="ts">
import { EvmTransactionTypes } from 'InvestCommon/data/evm/evm.types';
import { computed, defineAsyncComponent, PropType, ref, watch } from 'vue';
import VDialog from 'UiKit/components/Base/VDialog/VDialog.vue';
import VDialogContent from 'UiKit/components/Base/VDialog/VDialogContent.vue';
import VDialogHeader from 'UiKit/components/Base/VDialog/VDialogHeader.vue';
import VDialogTitle from 'UiKit/components/Base/VDialog/VDialogTitle.vue';

const VFormFundsAdd = defineAsyncComponent({
  loader: () => import('./VFormFundsAdd.vue'),
});

const VFormFundsWithdraw = defineAsyncComponent({
  loader: () => import('./VFormFundsWithdraw.vue'),
});

const open = defineModel<boolean>();
const props = defineProps({
  transactionType: {
    type: String as PropType<EvmTransactionTypes>,
    required: true,
  },
  data: Object,
});

const isTypeDeposit = ref((props.transactionType === EvmTransactionTypes.deposit));
const titile = computed(() => (isTypeDeposit.value ? 'Add Funds' : 'Withdraw'));

watch(() => props.transactionType, (newVal: EvmTransactionTypes) => {
  isTypeDeposit.value = newVal === EvmTransactionTypes.deposit;
});
</script>

<template>
  <VDialog
    v-model:open="open"
    query-key="add-transaction"
    :query-value="transactionType"
  >
    <VDialogContent
      :aria-describedby="undefined"
      class="VDialogWalletAddTransaction v-dialog-wallet-add-transaction"
    >
      <VDialogHeader>
        <VDialogTitle>
          {{ titile }}
        </VDialogTitle>
      </VDialogHeader>
      <VFormFundsAdd
        v-if="isTypeDeposit"
        class="is--margin-top-20"
        :data="data"
      />
      <VFormFundsWithdraw
        v-else
        class="is--margin-top-20"
        :data="data"
        @close="open = false"
      />
    </VDialogContent>
  </VDialog>
</template>

<style lang="scss">
.v-dialog-wallet-add-transaction {
  width: 100%;
}
</style>
