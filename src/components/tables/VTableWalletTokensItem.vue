<script setup lang="ts">
import VBadge from 'UiKit/components/Base/VBadge/VBadge.vue';
import { VTableCell, VTableRow } from 'UiKit/components/Base/VTable';
import { PropType } from 'vue';
import VTooltip from 'UiKit/components/VTooltip.vue';

interface ITableWalletTransaction {
  id: number;
  date: string;
  time: string;
  amount: string;
  type: string;
  status: {
    text: string;
    toolip: string;
  };
  tagColor: string;
}

defineProps({
  data: Object as PropType<ITableWalletTransaction>,
  loading: Boolean,
});

</script>

<template>
  <VTableRow
    class="VTableWalletTokens v-table-wallet-tokens"
  >
    <VTableCell>
      <div>
        {{ data?.date }}
      </div>
      <div class="is--color-gray-60">
        {{ data?.time }}
      </div>
    </VTableCell>
    <VTableCell>
      <div class="v-table-wallet-tokens__table-type">
        <VBadge
          size="small"
          :color="data?.tagColor"
          class="profile-status-info__tag"
        >
          {{ data?.type[0]?.toUpperCase() + data?.type?.slice(1) }}
        </VBadge>
      </div>
    </VTableCell>
    <VTableCell>
      <VTooltip>
        <span
          class="is--small"
        >
          {{ data?.status?.text }}
        </span>
        <template #content>
          <p>
            {{ data?.status?.tooltip }}
          </p>
        </template>
      </VTooltip>
    </VTableCell>
    <VTableCell>
      <div class="v-table-wallet-tokens__table-amount is--h6__title">
        {{ data?.amount }}
      </div>
    </VTableCell>
  </VTableRow>
</template>

<style lang="scss">
@use 'UiKit/styles/_colors.scss' as *;

.v-table-wallet-tokens {

  &__table-amount {
    text-align: right;
    color: $black;
  }

  &__table-type {
    display: flex;
  }
}
</style>
