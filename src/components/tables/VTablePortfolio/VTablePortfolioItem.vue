<script setup lang="ts">
import {
  PropType, computed, defineAsyncComponent, onMounted, ref, watch,
} from 'vue';
import VTableItemHeader from './VTablePortfolioItemHeader.vue';
import VTableItemContent from './VTablePortfolioItemContent.vue';
import { IInvest } from 'InvestCommon/types/api/invest';
import { useRoute } from 'vue-router';
import { storeToRefs } from 'pinia';
import { useUsersStore } from 'InvestCommon/store/useUsers';
import { isInvestmentFundingClickable } from 'InvestCommon/helpers/investment';

const userStore = useUsersStore();
const { selectedUserProfileData, selectedUserProfileId } = storeToRefs(userStore);

const VDialogPortfolioTransaction = defineAsyncComponent({
  loader: () => import('InvestCommon/components/dialogs/VDialogPortfolioTransaction.vue'),
});
const VDialogPortfolioWire = defineAsyncComponent({
  loader: () => import('InvestCommon/components/dialogs/VDialogPortfolioWire.vue'),
});
const VDialogPortfolioCancelInvestment = defineAsyncComponent({
  loader: () => import('InvestCommon/components/dialogs/VDialogPortfolioCancelInvestment.vue'),
});

const route = useRoute();
const queryId = computed(() => Number(route.query.id));
const props = defineProps({
  item: {
    type: Object as PropType<IInvest>,
    required: true,
  },
  search: String,
  colspan: Number,
});
const isOpen = defineModel<boolean>();
const scrollTarget = computed(() => `scrollTarget${props.item?.id}`);
const isDialogTransactionOpen = ref(false);
const isDialogWireOpen = ref(false);
const isDialogCancelOpen = ref(false);

const userName = computed(() => `${selectedUserProfileData.value?.data.first_name} ${selectedUserProfileData.value?.data.last_name}`);
const isFundingLinkWire = computed(() => props.item?.type === 'wire');
const isFundingClickable = computed(() => isInvestmentFundingClickable(props.item));

const onFundingType = () => {
  if (!isFundingClickable.value) return;
  if (isFundingLinkWire.value) isDialogWireOpen.value = true;
  else isDialogTransactionOpen.value = true;
};

onMounted(() => {
  if (queryId.value && (props.item.id === queryId.value)) {
    const target = document.getElementById(scrollTarget.value);
    // Ensure the element exists before scrolling
    if (target) {
      target.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }
});

watch(() => props.item.id, () => {
  isOpen.value = (props.item.id === queryId.value);
}, { immediate: true });

</script>

<template>
  <VTableItemHeader
    :id="scrollTarget"
    :item="item"
    :search="search"
    :class="{ 'is--open': isOpen }"
    @click="isOpen = !isOpen"
    @click-funding-type="onFundingType"
  />
  <!-- eslint-disable-next-line vue/no-multiple-template-root -->
  <VTableItemContent
    v-if="isOpen"
    :item="item"
    :colspan="colspan"
    :class="{ 'is--open': isOpen }"
    @on-cancel-investment-click="isDialogCancelOpen = true"
  />

  <VDialogPortfolioTransaction
    v-model:open="isDialogTransactionOpen"
    :investment="item"
    :user-name="userName"
  />
  <VDialogPortfolioWire
    v-model:open="isDialogWireOpen"
    :investment="item"
    :user-name="userName"
  />
  <VDialogPortfolioCancelInvestment
    v-model:open="isDialogCancelOpen"
    :investment="item"
  />
</template>
