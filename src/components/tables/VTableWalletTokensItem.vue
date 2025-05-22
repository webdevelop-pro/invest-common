<script setup lang="ts">
import VBadge from 'UiKit/components/Base/VBadge/VBadge.vue';
import { VTableCell, VTableRow } from 'UiKit/components/Base/VTable';
import { PropType } from 'vue';
import VTooltip from 'UiKit/components/VTooltip.vue';

interface ITableEvmWalletTransaction {
  name: string;
  amount: string;
}

defineProps({
  data: Object as PropType<ITableEvmWalletTransaction>,
  loading: Boolean,
});

</script>

<template>
  <VTableRow
    class="VTableWalletTokensItem v-table-wallet-tokens-item"
  >
    <VTableCell>
      <div>
        {{ data?.name }}
      </div>
    </VTableCell>
    <VTableCell>
      <div class="v-table-wallet-tokens-item__table-amount is--h6__title">
        {{ data?.amount }}
      </div>
    </VTableCell>
  </VTableRow>
</template>

<style lang="scss">
@use 'UiKit/styles/_colors.scss' as *;

.v-table-wallet-tokens-item {

  &__table-amount {
    text-align: right;
    color: $black;
  }

  &__table-type {
    display: flex;
  }
}
</style>
