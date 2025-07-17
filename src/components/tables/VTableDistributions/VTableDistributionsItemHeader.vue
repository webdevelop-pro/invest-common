<script setup lang="ts">
import { currency } from 'InvestCommon/helpers/currency';
import { formatToFullDate } from 'InvestCommon/helpers/formatters/formatToDate';
import VBadge from 'UiKit/components/Base/VBadge/VBadge.vue';
import { PropType, computed } from 'vue';
import { useUsersStore } from 'InvestCommon/store/useUsers';
import { useProfilesStore } from 'InvestCommon/domain/profiles/store/useProfiles';
import { storeToRefs } from 'pinia';
import {
  getInvestmentOfferImage, getDistributionTagBackground,
} from 'InvestCommon/helpers/investment';
import { ROUTE_INVESTMENT_DOCUMENTS } from 'InvestCommon/helpers/enums/routes';
import expand from 'UiKit/assets/images/expand.svg';
import { IStakingData } from 'InvestCommon/types/api/distributions';
import { VTableCell, VTableRow } from 'UiKit/components/Base/VTable';
import chevronDownIcon from 'UiKit/assets/images/chevron-down.svg';
import VImage from 'UiKit/components/Base/VImage/VImage.vue';

const userStore = useUsersStore();
const profilesStore = useProfilesStore();
const { selectedUserProfileData, selectedUserProfileId } = storeToRefs(userStore);

const props = defineProps({
  item: {
    type: Object as PropType<IStakingData>,
    required: true,
  },
  search: String,
});

const itemFormatted = computed(() => ({
  id: props.item.id,
  date: formatToFullDate(new Date(props.item.created_at).toISOString()),
  offer: props.item.investment?.offer?.name,
  offerLegalName: props.item.investment?.offer?.legal_name,
  image: getInvestmentOfferImage(props.item.investment),
  total_distribution: currency(props.item.total_amount),
  ownership: selectedUserProfileData.value?.type,
  amount: currency(props.item.amount),
  status: props.item.status,
  tagBackground: getDistributionTagBackground(props.item.status),
}));

</script>

<template>
  <VTableRow class="VTableDistributionsItemHeader v-table-distributions-header">
    <VTableCell>
      <router-link
        :to="{ name: ROUTE_INVESTMENT_DOCUMENTS, params: { profileId: selectedUserProfileId, id: item.id } }"
        @click.stop
      >
        <expand
          alt="expand icon"
          class="v-table-distributions-header__expand-icon"
        />
      </router-link>
    </VTableCell>
    <VTableCell class="v-table-distributions-header__table-offer">
      <div class="v-table-distributions-header__table-image-wrap">
        {{ props.item.provider }}
      </div>
      <div v-if="props.item.pool">
        {{ props.item.pool }}
      </div>
    </VTableCell>
    <VTableCell class="is--color-black is--h5__title">
      {{ props.item.reward_rate }}
    </VTableCell>
    <VTableCell>
      {{ props.item.tvl }}
    </VTableCell>
    <VTableCell>
        {{ props.item.assets[0] }}
    </VTableCell>
    <VTableCell class="is--color-black is--h5__title">
      {{ props.item.network }}
    </VTableCell>
    <VTableCell>
      <chevronDownIcon class="v-table-item-header__chevron" />
    </VTableCell>
  </VTableRow>
</template>

<style lang="scss">
.v-table-distributions-header {
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
    min-width: 55px;
    min-height: 55px;
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

  &__table-amount {
    color: $black;
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
