<script setup lang="ts">
import VButton from 'UiKit/components/Base/VButton/VButton.vue';
import VTableDefault from 'InvestCommon/shared/components/VTableDefault.vue';
import VTooltip from 'UiKit/components/VTooltip.vue';
import VSkeleton from 'UiKit/components/Base/VSkeleton/VSkeleton.vue';

type ActionButton = {
  id: string | number,
  label: string,
  variant?: string,
  disabled?: boolean,
  icon?: unknown,
  transactionType?: unknown,
};

type BalanceItem = {
  title: string,
  balance: string,
  href?: string,
  incomingBalance?: string,
  outcomingBalance?: string,
  to?: string,
};

type TableItem = {
  title: string,
  viewAllHref?: string,
  tableRowComponent?: unknown,
  header: Array<{ text: string }>,
  data: unknown[],
  loading?: boolean,
  rowLength?: number,
  colspan?: number,
  emptyText?: string,
};

defineProps({
  balances: {
    type: Array as unknown as () => BalanceItem[],
    required: true,
  },
  tables: {
    type: Array as unknown as () => TableItem[],
    required: true,
  },
  actionButtons: {
    type: Array as unknown as () => ActionButton[],
    required: false,
    default: () => [],
  },
  balancesLoading: {
    type: Boolean,
    required: false,
    default: false,
  },
});

const emit = defineEmits<{
  (e: 'button-click', payload: { id: string | number, transactionType?: unknown }): void,
}>();
</script>

<template>
  <div class="WalletTokensAndTransactions wallet-tokens-and-transactions">
    <div class="wallet-tokens-and-transactions__top">
      <div class="wallet-tokens-and-transactions__balance">
        <div
          v-for="(b, i) in balances"
          :key="i"
          class="wallet-tokens-and-transactions__balance-block"
        >
          <div class="wallet-tokens-and-transactions__top-title is--h6__title">
            {{ b.title }}
          </div>
          <div class="wallet-tokens-and-transactions__balance-numbers">
            <VSkeleton
              v-if="balancesLoading"
              height="24px"
              width="100px"
              class="wallet-tokens-and-transactions__balance-skeleton"
            />
            <template v-else>
              <a
                v-if="b.href"
                :href="b.href"
                class="wallet-tokens-and-transactions__balance-current is--subheading-1 is--link"
                target="_blank"
                rel="noopener noreferrer"
              >
                {{ b.balance }}
              </a>
              <router-link
                v-else-if="b.to"
                :to="b.to"
                class="wallet-tokens-and-transactions__balance-current is--subheading-1 is--link"
              >
                {{ b.balance }}
              </router-link>
              <span
                v-else
                class="wallet-tokens-and-transactions__balance-current is--subheading-1"
              >
                {{ b.balance }}
              </span>
            </template>
            <div class="wallet-tokens-and-transactions__pending-wrap">
              <span
                v-if="b.incomingBalance"
                class="wallet-tokens-and-transactions__balance-incoming is--small"
              >
                + {{ b.incomingBalance }}
              </span>
              <span v-if="b.outcomingBalance">|</span>
              <VTooltip
                class="wallet-tokens-and-transactions__tooltip"
              >
                <span
                  v-if="b.outcomingBalance"
                  class="wallet-tokens-and-transactions__balance-outcoming is--small"
                >
                  - {{ b.outcomingBalance }}
                </span>
                <template #content>
                  Pending investment
                </template>
              </VTooltip>
            </div>
          </div>
        </div>
      </div>
      <div class="wallet-tokens-and-transactions__buttons">
        <VButton
          v-for="button in actionButtons"
          :key="button.id"
          size="small"
          :variant="(button.variant as any)"
          :disabled="button.disabled"
          class="wallet-tokens-and-transactions__funds-button"
          @click="emit('button-click', { id: button.id, transactionType: button.transactionType })"
        >
          <component
            :is="button.icon"
            v-if="button.icon"
            alt="button icon"
            class="wallet-tokens-and-transactions__button-icon"
          />
          {{ button.label }}
        </VButton>
      </div>
    </div>
    <div class="wallet-tokens-and-transactions__content">
      <template
        v-for="(table, tIndex) in tables"
        :key="tIndex"
      >
        <div
          class="wallet-tokens-and-transactions__content-top is--h6__title"
          :class="{ 'is--margin-top-40': tIndex > 0 }"
        >
          <span>{{ table.title }}</span>

          <VButton
            v-if="table.viewAllHref"
            :href="table.viewAllHref"
            variant="link"
            size="small"
            target="_blank"
            rel="noopener noreferrer"
            class="dashboard-evm-wallet-tokens__view-all"
          >
            View All
          </VButton>
        </div>
        <VTableDefault
          class="investment-documents__table"
          size="small"
          :header="table.header"
          :data="table.data || []"
          :loading="!!table.loading"
          :loading-row-length="table.rowLength ?? 5"
          :colspan="table.colspan ?? table.header.length"
        >
          <template #empty>
            <p>
              {{ table.emptyText || 'No data available.' }}
            </p>
          </template>
          <component
            :is="table.tableRowComponent"
            v-for="(row, rIndex) in table.data"
            :key="rIndex"
            :data="row"
            size="small"
          />
        </VTableDefault>
      </template>
    </div>
  </div>
</template>

<style lang="scss">
.wallet-tokens-and-transactions {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  flex: 1 0 0;
  background: $white;
  box-shadow: $box-shadow-medium;

  &__top {
    display: flex;
    align-items: center;
    gap: 20px;
    padding: 20px;
    align-self: stretch;
    border-radius: 2px;
    background: $primary-light;

    @media screen and (max-width: $tablet){
      flex-direction: column;
      align-items: flex-start;
    }
  }

  &__balance {
    display: flex;
    flex-direction: row;
    align-items: flex-start;
    gap: 4px;
    flex: 1 0 0;

    @media screen and (max-width: $tablet){
      flex-direction: column;
    }
  }

  &__balance-block {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    gap: 4px;
    flex: 1 0 0;

    @media screen and (max-width: $tablet){
      // flex-direction: row;
      // align-items: center;
      gap: 8px;
    }
  }

  &__buttons {
    display: flex;
    align-items: center;
    gap: 12px;
    flex-wrap: wrap;
    justify-content: end;
    
    @media screen and (max-width: $tablet) {
      width: 100%;
      justify-content: flex-start;
    }
  }

  &__top-title {
    color: $gray-70;
  }

  &__balance-numbers {
    color: $gray-40;
    display: flex;
    flex-wrap: wrap;
    align-items: center;
  }

  &__balance-current {
    margin-right: 8px;

    &:not(.is--link) {
      color: $black;
    }
  }

  &__pending_wrap {
    flex-shrink: 0;
  }

  &__balance-incoming {
    color: $secondary-dark;
    margin-right: 8px;
  }

  &__balance-outcoming {
    color: $red;
    margin-left: 8px;
  }

  &__content {
    display: flex;
    padding: 20px;
    flex-direction: column;
    align-items: flex-start;
    align-self: stretch;
  }

  &__content-top {
    display: flex;
    padding-bottom: 8px;
    align-items: center;
    justify-content: space-between;
    gap: 10px;
    align-self: stretch;
    color: $gray-70;
  }

  &__button-icon {
    width: 16px;
  }

  &__balance-skeleton {
    margin-right: 8px;
  }

  .v-table-head:last-of-type {
    text-align: end;
  }
}
</style>

