<script setup lang="ts">
import { currency } from 'InvestCommon/helpers/currency';
import { formatToFullDate } from 'InvestCommon/helpers/formatters/formatToDate';
import { IInvest } from 'InvestCommon/types/api/invest';
import VBadge from 'UiKit/components/Base/VBadge/VBadge.vue';
import { PropType, computed, watch } from 'vue';
import { useDialogs } from 'InvestCommon/store/useDialogs';
import { useOfferStore } from 'InvestCommon/store/useOffer';
import { useUsersStore } from 'InvestCommon/store/useUsers';
import { storeToRefs } from 'pinia';
import {
  getInvestmentOfferImage, getInvestmentStatusFormated, getInvestmentTagBackground, isInvestmentFundingClickable,
} from 'InvestCommon/helpers/investment';
import { ROUTE_INVESTMENT_DOCUMENTS } from 'InvestCommon/helpers/enums/routes';
import expand from 'UiKit/assets/images/expand.svg';
import { useRoute } from 'vue-router';
import { VTableCell, VTableRow } from 'UiKit/components/Base/VTable';
import chevronDownIcon from 'UiKit/assets/images/chevron-down.svg';
import VImage from 'UiKit/components/Base/VImage/VImage.vue';
import { capitalizeFirstLetter } from 'UiKit/helpers/text';

const useDialogsStore = useDialogs();
const userStore = useUsersStore();
const { selectedUserProfileData, selectedUserProfileId } = storeToRefs(userStore);
const offerStore = useOfferStore();
const route = useRoute();

const props = defineProps({
  item: {
    type: Object as PropType<IInvest>,
    required: true,
  },
  search: String,
});

const queryPopupWire = computed(() => (route.query.popup === 'wire'));
const queryPopupTransaction = computed(() => (route.query.popup === 'transaction'));
const queryPopupId = computed(() => Number(route.query.id));

const itemFormatted = computed(() => ({
  id: props.item.id,
  date: formatToFullDate(new Date(props.item.submited_at).toISOString()),
  offer: props.item.offer?.name,
  offerLegalName: props.item.offer?.legal_name,
  image: getInvestmentOfferImage(props.item),
  type: capitalizeFirstLetter(props.item.funding_type || ''),
  ownership: capitalizeFirstLetter(selectedUserProfileData.value?.type || ''),
  amount: currency(props.item.amount),
  status: getInvestmentStatusFormated(props.item.status),
  tagBackground: getInvestmentTagBackground(props.item.status),
  amountPercent: offerStore.getOfferFundedPercent(props.item.offer),
}));

const isDefaultImage = computed(() => (!props.item?.offer?.image?.meta_data?.small && !props.item?.offer?.image?.url));
const userName = computed(() => `${selectedUserProfileData.value?.data.first_name} ${selectedUserProfileData.value?.data.last_name}`);
const isFundingLinkWire = computed(() => itemFormatted.value.type === 'wire');
const isFundingClickable = computed(() => isInvestmentFundingClickable(props.item));

const onFundingType = () => {
  if (!isFundingClickable.value) return;
  if (isFundingLinkWire.value) useDialogsStore.showWire(props.item, userName.value);
  else useDialogsStore.showTransaction(props.item, userName.value);
};

watch(() => [queryPopupWire.value, queryPopupId.value, queryPopupTransaction.value], () => {
  if ((queryPopupWire.value || queryPopupTransaction.value)
    && queryPopupId.value && (queryPopupId.value === props.item.id)) {
    setTimeout(() => onFundingType(), 400);
  }
}, { immediate: true });
</script>

<template>
  <VTableRow
    class="VTableItemHeader v-table-item-header"
  >
    <VTableCell>
      <router-link
        :to="{ name: ROUTE_INVESTMENT_DOCUMENTS, params: { profileId: selectedUserProfileId, id: item.id } }"
        @click.stop
      >
        <expand
          alt="expand icon"
          class="v-table-item-header__expand-icon"
        />
      </router-link>
    </VTableCell>
    <VTableCell v-highlight="search">
      {{ itemFormatted.id }}
    </VTableCell>
    <VTableCell class="v-table-item-header__table-offer is--body">
      <div class="v-table-item-header__table-image-wrap">
        <VImage
          :src="itemFormatted.image"
          :alt="`${itemFormatted.offer} image`"
          fit="cover"
          class="v-table-item-header__table-image"
          :class="{ 'is--default-image': isDefaultImage }"
        />
      </div>
      <div>
        <div v-highlight="search">
          {{ itemFormatted.offer }}
        </div>
        <div class="v-table-item-header__table-funded is--small">
          {{ itemFormatted.amountPercent?.toFixed(0) }}% funded
        </div>
      </div>
    </VTableCell>
    <VTableCell>
      {{ itemFormatted.date }}
    </VTableCell>
    <VTableCell class="is--color-black is--h5__title">
      {{ itemFormatted.amount }}
    </VTableCell>
    <VTableCell>
      {{ itemFormatted.ownership }}
    </VTableCell>
    <VTableCell>
      <div
        :class="{ 'is--link-regular': isFundingClickable }"
        @click.stop="onFundingType"
      >
        {{ itemFormatted.type }}
      </div>
    </VTableCell>
    <VTableCell>
      <VBadge
        :color="itemFormatted.tagBackground"
      >
        {{ itemFormatted.status }}
      </VBadge>
    </VTableCell>
    <VTableCell>
      <chevronDownIcon class="v-table-item-header__chevron" />
    </VTableCell>
  </VTableRow>
</template>

<style lang="scss">
@use 'UiKit/styles/_variables.scss' as variables;
.v-table-item-header {
  $root: &;

  color: $gray-80;
  cursor: pointer !important;

  &__table-funded {
    color: $gray-60;
  }

  &__table-image {
    width: 100%;
    height: 100%;
  }

  &__table-offer {
    display: flex;
    align-items: center;
    width: 100%;
    gap: 16px;
  }

  &__table-image-wrap {
    width: 55px;
    height: 55px;
    background-color: $primary-light;
    display: flex;
    justify-content: center;
    align-items: center;
  }

  &__expand-icon {
    color: $gray-70;
    width: 20px;
    display: block;
    transition: 0.3s all ease;
    &:hover {
      color: $primary;
    }
  }

  &__chevron {
    width: 16px;
    transition: 0.3s all ease;
  }

  &.is--open {
    position: relative;
    &::after {
      box-sizing: border-box;
      content:'';
      position:absolute;
      left:0;
      right:2px;
      top: 0;
      display: block;
      height: 100%;
      // box-shadow: variables.$box-shadow-small;
      box-shadow: 0px 2px 5px -5px rgba(18, 22, 31, 0.03), 0px 2px 3px -3px rgba(18, 22, 31, 0.15);;
    }

    #{$root}__chevron {
      transform: rotate(180deg);
    }
  }
}
</style>
