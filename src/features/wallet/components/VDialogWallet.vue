<script setup lang="ts">
import type { IEvmWalletDataFormatted } from 'InvestCommon/data/evm/evm.types';
import { EvmTransactionTypes } from 'InvestCommon/data/evm/evm.types';
import { computed, PropType, ref, watch } from 'vue';
import VDialog from 'UiKit/components/Base/VDialog/VDialog.vue';
import VDialogContent from 'UiKit/components/Base/VDialog/VDialogContent.vue';
import VDialogHeader from 'UiKit/components/Base/VDialog/VDialogHeader.vue';
import VDialogTitle from 'UiKit/components/Base/VDialog/VDialogTitle.vue';
import VFormAddFunds from './VFormAddFunds.vue';
import VFormExchange from './VFormExchange.vue';
import VFormWithdraw from './VFormWithdraw.vue';

const open = defineModel<boolean>();
const props = defineProps({
  transactionType: {
    type: String as PropType<EvmTransactionTypes>,
    required: true,
  },
  data: {
    type: Object as PropType<IEvmWalletDataFormatted | undefined>,
    required: false,
  },
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
      class="VDialogWallet v-dialog-wallet"
    >
      <VDialogHeader>
        <VDialogTitle>
          {{ titile }}
        </VDialogTitle>
      </VDialogHeader>
      <VFormAddFunds
        v-if="isTypeDeposit"
        class="is--margin-top-20"
        :data="data"
        @close="open = false"
      />
      <VFormExchange
        v-else-if="isTypeExchange"
        class="is--margin-top-20"
        :data="data"
        :default-buy-symbol="defaultBuySymbol"
        :pool-id="poolId"
        :profile-id="profileId"
        @close="open = false"
      />
      <VFormWithdraw
        v-else
        class="is--margin-top-20"
        @close="open = false"
      />
    </VDialogContent>
  </VDialog>
</template>
<style lang="scss" scoped>
.v-dialog-wallet {
  width: 100%;
  max-width: 800px;
}
</style>
