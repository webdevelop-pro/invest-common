<script setup lang="ts">
import { EvmTransactionTypes } from 'InvestCommon/data/evm/evm.types';
import { computed, PropType, ref, watch } from 'vue';
import VDialog from 'UiKit/components/Base/VDialog/VDialog.vue';
import VDialogContent from 'UiKit/components/Base/VDialog/VDialogContent.vue';
import VDialogHeader from 'UiKit/components/Base/VDialog/VDialogHeader.vue';
import VDialogTitle from 'UiKit/components/Base/VDialog/VDialogTitle.vue';
import VFormFundsAdd from './VFormFundsAdd.vue';
import VFormFundsWithdraw from './VFormFundsWithdraw.vue';
import VFormFundsExchange from './VFormFundsExchange.vue';

const open = defineModel<boolean>();
const props = defineProps({
  transactionType: {
    type: String as PropType<EvmTransactionTypes>,
    required: true,
  },
  data: Object,
  defaultBuySymbol: {
    type: String,
    required: false,
  },
  poolId: {
    type: String,
    required: false,
  },
  profileId: {
    type: [String, Number],
    required: false,
  },
});

const isTypeDeposit = ref((props.transactionType === EvmTransactionTypes.deposit));
const isTypeExchange = ref((props.transactionType === EvmTransactionTypes.exchange));
const titile = computed(() => {
  if (isTypeDeposit.value) return 'Add Funds';
  if (isTypeExchange.value) return 'Exchange Tokens';
  return 'Withdraw';
});

watch(() => props.transactionType, (newVal: EvmTransactionTypes) => {
  isTypeDeposit.value = newVal === EvmTransactionTypes.deposit;
  isTypeExchange.value = newVal === EvmTransactionTypes.exchange;
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
      <VFormFundsExchange
        v-else-if="isTypeExchange"
        class="is--margin-top-20"
        :data="data"
        :default-buy-symbol="defaultBuySymbol"
        :pool-id="poolId"
        :profile-id="profileId"
        @close="open = false"
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
  max-width: 800px;
}
</style>
