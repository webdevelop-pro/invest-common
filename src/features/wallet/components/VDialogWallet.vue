<script setup lang="ts">
import type { IEvmWalletDataFormatted } from 'InvestCommon/data/evm/evm.types';
import { EvmTransactionTypes } from 'InvestCommon/data/evm/evm.types';
import { PropType } from 'vue';
import VDialog from 'UiKit/components/Base/VDialog/VDialog.vue';
import VDialogContent from 'UiKit/components/Base/VDialog/VDialogContent.vue';
import VDialogHeader from 'UiKit/components/Base/VDialog/VDialogHeader.vue';
import VDialogTitle from 'UiKit/components/Base/VDialog/VDialogTitle.vue';
import VFormAddFunds from './VFormAddFunds.vue';
import VFormExchange from './VFormExchange.vue';
import VFormWithdraw from './VFormWithdraw.vue';
import { useVDialogWallet } from './logic/useVDialogWallet';

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

const { isTypeDeposit, isTypeExchange, title: dialogTitle } = useVDialogWallet(props);
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
          {{ dialogTitle }}
        </VDialogTitle>
      </VDialogHeader>
      <VFormAddFunds
        v-if="isTypeDeposit"
        class="is--margin-top-20"
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
