<script setup lang="ts">
import {
  PropType, computed, defineAsyncComponent, onMounted, ref, watch,
} from 'vue';
import VTableItemHeader from './VTablePortfolioItemHeader.vue';
import VTableItemContent from './VTablePortfolioItemContent.vue';
import { IInvest } from 'InvestCommon/types/api/invest';
import { storeToRefs } from 'pinia';
import { useProfilesStore } from 'InvestCommon/domain/profiles/store/useProfiles';
import { isInvestmentFundingClickable } from 'InvestCommon/helpers/investment';
import { useSyncWithUrl } from 'UiKit/composables/useSyncWithUrl';

const profilesStore = useProfilesStore();
const { selectedUserProfileId, selectedUserProfileData } = storeToRefs(profilesStore);

const VDialogPortfolioTransaction = defineAsyncComponent({
  loader: () => import('InvestCommon/components/dialogs/VDialogPortfolioTransaction.vue'),
});
const VDialogPortfolioWire = defineAsyncComponent({
  loader: () => import('InvestCommon/components/dialogs/VDialogPortfolioWire.vue'),
});
const VDialogPortfolioCancelInvestment = defineAsyncComponent({
  loader: () => import('InvestCommon/components/dialogs/VDialogPortfolioCancelInvestment.vue'),
});

const props = defineProps({
  item: {
    type: Object as PropType<IInvest>,
    required: true,
  },
  search: String,
  colspan: Number,
  activeId: Number,
});
const isOpen = defineModel<boolean>();
const isOpenId = useSyncWithUrl<number>({
  key: 'id',
  defaultValue: 0,
  parse: (val) => {
    const num = Number(val);
    return Number.isNaN(num) ? 0 : num;
  },
});
const scrollTarget = computed(() => `scrollTarget${props.item?.id}`);
const isDialogTransactionOpen = ref(false);
const isDialogWireOpen = ref(false);
const isDialogCancelOpen = ref(false);

const userName = computed(() => `${selectedUserProfileData.value?.data.first_name} ${selectedUserProfileData.value?.data.last_name}`);
const isFundingLinkWire = computed(() => props.item?.type === 'wire');
const isFundingClickable = computed(() => isInvestmentFundingClickable(props.item));
const isActiveId = computed(() => (props.item.id === props.activeId));

const onFundingType = () => {
  if (!isFundingClickable.value) return;
  if (isFundingLinkWire.value) isDialogWireOpen.value = true;
  else isDialogTransactionOpen.value = true;
};

onMounted(() => {
  if (props.activeId && (props.item.id === props.activeId)) {
    const target = document.getElementById(scrollTarget.value);
    // Ensure the element exists before scrolling
    if (target) {
      target.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }
});

watch(() => props.item.id, () => {
  isOpen.value = isActiveId.value;
}, { immediate: true });

watch(() => isOpen.value, () => {
  if (isOpen.value) {
    isOpenId.value = props.item.id;
  } else if (isActiveId.value) {
    isOpenId.value = 0;
  }
});

watch(() => props.activeId, (newId) => {
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
