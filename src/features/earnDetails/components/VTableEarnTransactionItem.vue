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

const { formattedType, hasTransactionId, badgeColor } = useEarnTransactionItem(props);
</script>

<template>
  <VTableRow
    class="VTableEarnTransaction v-table-earn-transaction"
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
      <VTooltip v-if="hasTransactionId">
        <div class="v-table-earn-transaction__transaction-id is--small-2">
          ID {{ data?.transaction_id }}
        </div>
        <template #content>
          {{ data?.transaction_id }}
        </template>
      </VTooltip>
      <span
        v-else
        class="v-table-earn-transaction__transaction-id is--small-2 is--color-gray-60"
      >
        —
      </span>
    </VTableCell>
    <VTableCell>
      <div class="v-table-earn-transaction__table-type">
        <VBadge
          v-if="badgeColor"
          size="small"
          :color="badgeColor"
          class="profile-status-info__tag"
        >
          {{ formattedType }}
        </VBadge>
        <span
          v-else
          class="is--small"
        >
          {{ formattedType }}
        </span>
      </div>
    </VTableCell>
    <VTableCell>
      <VTooltip v-if="data?.status">
        <span class="is--small">
          {{ data.status.text }}
        </span>
        <template #content>
          <p>
            {{ data.status.tooltip }}
          </p>
        </template>
      </VTooltip>
      <span
        v-else
        class="is--small is--color-gray-60"
      >
        —
      </span>
    </VTableCell>
    <VTableCell>
      <div class="v-table-earn-transaction__table-amount is--h6__title">
        {{ data?.amount || '—' }}
      </div>
    </VTableCell>
  </VTableRow>
</template>

<style lang="scss">
@use 'UiKit/styles/_colors.scss' as *;

.v-table-earn-transaction {
  @media screen and (width < $desktop) {
    display: flex;
    flex-wrap: wrap;
  }

  &__table-amount {
    text-align: right;
    color: $black;
    width: 100%;


    @media screen and (width < $desktop) {
      width: max-content;
    }
  }

  &__table-type {
    display: flex;
  }

  &__transaction-id {
    color: $gray-80;
    max-width: 110px;
    width: 110px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .v-table-cell {
    &:nth-child(2) {
      width: 135px;

      @media screen and (width < $desktop) {
        text-align: right;
      }
    }

    &:nth-child(1),
    &:nth-child(2) {
      @media screen and (width < $desktop) {
        flex: 0 0 50%;
      }
    }

    &:nth-child(4) {
      @media screen and (width < $desktop) {
        display: flex;
        align-items: center;
        justify-content: center;
      }
    }

    &:nth-child(5) {
      @media screen and (width < $desktop) {
        display: flex;
        align-items: center;
        justify-content: end;
      }
    }
  }
}
</style>

