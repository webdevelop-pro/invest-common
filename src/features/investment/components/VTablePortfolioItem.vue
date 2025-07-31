<script setup lang="ts">
import {
  PropType, defineAsyncComponent, watch,
} from 'vue';
import VTableItemHeader from './VTablePortfolioItemHeader.vue';
import VTableItemContent from './VTablePortfolioItemContent.vue';
import { IInvestmentFormatted } from 'InvestCommon/data/investment/investment.types';
import { useTablePortfolioItem } from './logic/useTablePortfolioItem';

const VDialogPortfolioTransaction = defineAsyncComponent({
  loader: () => import('InvestCommon/features/investment/components/VDialogPortfolioTransaction.vue'),
});
const VDialogPortfolioWire = defineAsyncComponent({
  loader: () => import('InvestCommon/features/investment/components/VDialogPortfolioWire.vue'),
});
const VDialogPortfolioCancelInvestment = defineAsyncComponent({
  loader: () => import('InvestCommon/features/investment/components/VDialogPortfolioCancelInvestment.vue'),
});

const props = defineProps({
  item: {
    type: Object as PropType<IInvestmentFormatted>,
    required: true,
  },
  search: String,
  colspan: Number,
  activeId: Number,
  loading: Boolean,
});

const isOpen = defineModel<boolean>();

const {
  scrollTarget,
  isDialogTransactionOpen,
  isDialogWireOpen,
  isDialogCancelOpen,
  userName,
  isActiveId,
  onFundingType,
  isOpenId,
} = useTablePortfolioItem(props);

// Watch for item.id changes to update isOpen state
watch(() => props.item.id, () => {
  isOpen.value = isActiveId.value;
}, { immediate: true });

// Watch for isOpen changes to sync with URL
watch(() => isOpen.value, () => {
  if (isOpen.value) {
    isOpenId.value = props.item.id;
  } else if (isActiveId.value) {
    isOpenId.value = 0;
  }
});

// Watch for activeId changes to close item if not active
watch(() => props.activeId, () => {
  if (!isActiveId.value) {
    isOpen.value = false;
  }
}, { immediate: true });
</script>

<template>
  <VTableItemHeader
    :id="scrollTarget"
    :item="item"
    :search="search"
    :loading="loading"
    :class="{ 'is--open': isOpen }"
    @click="isOpen = !isOpen"
    @click-funding-type="onFundingType"
  />
  <!-- eslint-disable-next-line vue/no-multiple-template-root -->
  <VTableItemContent
    v-if="isOpen"
    :item="item"
    :loading="loading"
    :colspan="colspan"
    :class="{ 'is--open': isOpen }"
    @on-cancel-investment-click="isDialogCancelOpen = true"
  />

  <VDialogPortfolioTransaction
    v-if="item"
    v-model:open="isDialogTransactionOpen"
    :investment="item"
    :user-name="userName"
  />
  <VDialogPortfolioWire
    v-if="item"
    v-model:open="isDialogWireOpen"
    :investment="item"
    :user-name="userName"
  />
  <VDialogPortfolioCancelInvestment
    v-if="item"
    v-model:open="isDialogCancelOpen"
    :investment="item"
    @close="isDialogCancelOpen = false"
  />
</template>
