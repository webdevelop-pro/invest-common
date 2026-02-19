<script setup lang="ts">
import VBadge from 'UiKit/components/Base/VBadge/VBadge.vue';
import { VTableCell, VTableRow } from 'UiKit/components/Base/VTable';
import VTooltip from 'UiKit/components/VTooltip.vue';
import { useEarnTransactionItem, type IEarnTransaction } from './composables/useEarnTransactionItem';

interface Props {
  data?: IEarnTransaction;
  loading?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  loading: false,
});

const { formattedType, hasTransactionId } = useEarnTransactionItem(props);
</script>

<template>
  <VTableRow
    class="VTableEarnTransaction v-table-earn-transaction"
  >
    <VTableCell class="v-table-earn-transaction__date-cell">
      <div class="v-table-earn-transaction__date">
        <div>{{ data?.date }}</div>
        <div class="is--color-gray-60 is--small-2">
          {{ data?.time }}
        </div>
      </div>
    </VTableCell>

    <VTableCell class="is--gt-tablet-show">
      <span class="v-table-earn-transaction__type is--small-2">
        {{ formattedType }}
      </span>
    </VTableCell>

    <VTableCell>
      <div class="v-table-earn-transaction__type is--small-2  is--lt-tablet-show">
        {{ formattedType }}
      </div>
      <VTooltip v-if="hasTransactionId">
        <div class="v-table-earn-transaction__tx is--small-2">
          ID {{ data?.transaction_id }}
        </div>
        <template #content>
          {{ data?.transaction_id }}
        </template>
      </VTooltip>
      <div
        v-else
        class="v-table-earn-transaction__tx is--small-2"
      >
        <span class="is--color-gray-60">—</span>
      </div>
    </VTableCell>

    <VTableCell class="is--gt-tablet-show">
      <VBadge
        v-if="data?.status"
        color="secondary-light"
        size="small"
        class="v-table-earn-transaction__status"
      >
        {{ data.status.text }}
      </VBadge>
      <span
        v-else
        class="is--small is--color-gray-60"
      >
        —
      </span>
    </VTableCell>

    <VTableCell class="v-table-earn-transaction__amount-cell">
      <div class="v-table-earn-transaction__amount is--body">
        {{ data?.amount || '—' }}
      </div>

      <VBadge
        v-if="data?.status"
        color="secondary-light"
        size="small"
        class="v-table-earn-transaction__status is--lt-tablet-show"
      >
        {{ data.status.text }}
      </VBadge>
    </VTableCell>
  </VTableRow>
</template>

<style lang="scss">
@use 'UiKit/styles/_colors.scss' as *;

.v-table-earn-transaction {
  &__date {
    display: flex;
    flex-direction: column;
    gap: 2px;
  }

  &__date-cell {
    @media screen and (width < $tablet) {
      vertical-align: top;
    }
  }

  &__tx {
    display: flex;
    flex-direction: column;
    gap: 2px;
    text-align: initial;
    word-break: break-word;
  }

  &__type {
    @media screen and (width < $tablet) {
      margin-bottom: 12px;
    }
  }

  &__status {
    width: fit-content;
  }

  &__amount {
    text-align: right;
    width: max-content;
    margin-left: auto;
    color: $black;

    &.is--positive {
      color: $secondary;
    }

    &.is--negative {
      color: $red;
    }
  }

  &__amount-cell {
    @media screen and (width < $tablet) {
      display: flex;
      flex-direction: column;
      align-items: flex-end;
      gap: 12px;
    }
  }
}
</style>

