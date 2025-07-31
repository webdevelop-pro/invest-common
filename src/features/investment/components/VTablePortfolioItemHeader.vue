<script setup lang="ts">
import VBadge from 'UiKit/components/Base/VBadge/VBadge.vue';
import { PropType, computed } from 'vue';
import { useProfilesStore } from 'InvestCommon/domain/profiles/store/useProfiles';
import { storeToRefs } from 'pinia';
import { ROUTE_INVESTMENT_DOCUMENTS } from 'InvestCommon/helpers/enums/routes';
import expand from 'UiKit/assets/images/expand.svg';
import { VTableCell, VTableRow } from 'UiKit/components/Base/VTable';
import chevronDownIcon from 'UiKit/assets/images/chevron-down.svg';
import VImage from 'UiKit/components/Base/VImage/VImage.vue';
import { IInvestmentFormatted } from 'InvestCommon/data/investment/investment.types';

const profilesStore = useProfilesStore();
const { selectedUserProfileId, selectedUserProfileData } = storeToRefs(profilesStore);

defineProps({
  item: {
    type: Object as PropType<IInvestmentFormatted>,
    required: true,
  },
  search: String,
});

const emit = defineEmits(['clickFundingType']);

const profileType = computed(() => selectedUserProfileData.value?.type || '');
</script>

<template>
  <VTableRow
    class="VTableItemHeader v-table-item-header"
  >
    <VTableCell>
      <router-link
        :to="{ name: ROUTE_INVESTMENT_DOCUMENTS, params: { profileId: selectedUserProfileId, id: item.id } }"
        class="v-table-item-header__document-icon"
        @click.stop
      >
        <expand
          alt="expand icon"
          class="v-table-item-header__expand-icon"
        />
      </router-link>
    </VTableCell>
    <VTableCell v-highlight="search">
      {{ item.id }}
    </VTableCell>
    <VTableCell>
      <div class="v-table-item-header__table-offer is--body">
        <div class="v-table-item-header__table-image-wrap">
          <VImage
            :src="item?.offer?.imageSmall"
            :alt="`${item.offer?.name} image`"
            fit="cover"
            class="v-table-item-header__table-image"
            :class="{ 'is--default-image': item?.offer?.isDefaultImage }"
          />
        </div>
        <div>
          <div v-highlight="search">
            {{ item.offer?.name }}
          </div>
          <div class="v-table-item-header__table-funded is--small">
            {{ item.offer?.offerFundedPercent }}% funded
          </div>
        </div>
      </div>
    </VTableCell>
    <VTableCell class="v-table-item-header__date">
      {{ item.submitedAtFormatted }}
    </VTableCell>
    <VTableCell class="v-table-item-header__amount is--color-black is--h5__title">
      {{ item.amountFormattedZero }}
    </VTableCell>
    <VTableCell class="v-table-item-header__ownership">
      {{ profileType.charAt(0).toUpperCase() + profileType.slice(1) }}
    </VTableCell>
    <VTableCell>
      <div
        class="v-table-item-header__table-funding-type"
        :class="{ 'is--link-regular': item.isFundingClickable }"
        @click.stop="emit('clickFundingType', item.id)"
      >
        {{ item.fundingTypeFormatted }}
      </div>
    </VTableCell>
    <VTableCell class="v-table-item-header__status">
      <VBadge
        :color="item.statusFormatted.color"
      >
        {{ item.statusFormatted.text }}
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

  &__document-icon {
    display: block;
  }

  &__table-funded {
    color: $gray-60;
  }

  &__table-image {
    width: 100%;
    height: 100%;
    &.is--default-image {
      max-width: 75%;
      max-height: 75%;
    }
  }

  &__table-offer {
    display: flex;
    align-items: center;
    max-width: 205px;
    gap: 16px;
  }

  &__table-image-wrap {
    width: 55px;
    height: 55px;
    background-color: $primary-light;
    display: flex;
    justify-content: center;
    align-items: center;
    flex-shrink: 0;
  }

  &__table-funding-type {
    font-size: 14px;
    line-height: 21px;
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
    width: 20px;
    transition: 0.3s all ease;
  }

  &.is--open {
    position: relative;
    box-shadow: 0px 2px 5px -5px rgba(18, 22, 31, 0.03), 0px 2px 3px -3px rgba(18, 22, 31, 0.15);

    #{$root}__chevron {
      transform: rotate(180deg);
    }
  }
}
</style>
