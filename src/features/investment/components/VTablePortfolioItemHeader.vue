<script setup lang="ts">
import VBadge from 'UiKit/components/Base/VBadge/VBadge.vue';
import { PropType, computed } from 'vue';
import { useProfilesStore } from 'InvestCommon/domain/profiles/store/useProfiles';
import { storeToRefs } from 'pinia';
import { ROUTE_INVESTMENT_DOCUMENTS } from 'InvestCommon/domain/config/enums/routes';
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
    <VTableCell
      v-highlight="search"
      class="is--gt-tablet-show"
    >
      <router-link
        :to="{ name: ROUTE_INVESTMENT_DOCUMENTS, params: { profileId: selectedUserProfileId, id: item.id } }"
        class="v-table-item-header__link is--link-1"
        @click.stop
      >
        {{ item.id }}
      </router-link>
    </VTableCell>

    <VTableCell class="is--gt-tablet-show">
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

    <VTableCell class="is--lt-tablet-show">
      <div class="v-table-item-header__table-offer is--body">
        <div class="v-table-item-header__table-image-wrap">
          <VImage
            :src="item?.offer?.imageMedium"
            :alt="`${item.offer?.name} image`"
            fit="cover"
            class="v-table-item-header__table-image is--lt-tablet-show"
            :class="{ 'is--default-image': item?.offer?.isDefaultImage }"
          />
        </div>
        <div>
          <div
            v-highlight="search"
            class="is--h3__title"
          >
            {{ item.offer?.name }}
          </div>
        </div>
      </div>
    </VTableCell>

    <VTableCell class="v-table-item-header__date is--gt-tablet-show">
      {{ item.submitedAtFormatted }}
    </VTableCell>

    <VTableCell class="v-table-item-header__amount">
      <router-link
        :to="{ name: ROUTE_INVESTMENT_DOCUMENTS, params: { profileId: selectedUserProfileId, id: item.id } }"
        class="v-table-item-header__link is--link-1"
        @click.stop
      >
        {{ item.id }}
      </router-link>

      <router-link
        :to="{ name: ROUTE_INVESTMENT_DOCUMENTS, params: { profileId: selectedUserProfileId, id: item.id } }"
        class="v-table-item-header__link is--link-1 is--color-black is--h5__title"
        @click.stop
      >
        {{ item.amountFormattedZero }}
      </router-link>

      <div class="v-table-item-header__ownership is--lt-tablet-show">
        {{ profileType.charAt(0).toUpperCase() + profileType.slice(1) }}
      </div>

      <div class="is--lt-tablet-show">
        {{ item.submitedAtFormatted }}
      </div>

      <button
        class="v-table-item-header__table-funding-type is--lt-tablet-show"
        :class="{ 'is--link-regular': item.isFundingClickable }"
        @click.stop="emit('clickFundingType', item.id)"
      >
        {{ item.fundingTypeFormatted }}
      </button>

      <VBadge
        :color="item.statusFormatted.color"
        size="small"
        class="is--lt-tablet-show"
      >
        {{ item.statusFormatted.text }}
      </VBadge>
    </VTableCell>

    <VTableCell class="v-table-item-header__ownership is--gt-tablet-show">
      {{ profileType.charAt(0).toUpperCase() + profileType.slice(1) }}
    </VTableCell>

    <VTableCell class="is--gt-tablet-show">
      <button
        class="v-table-item-header__table-funding-type"
        :class="{ 'is--link-regular': item.isFundingClickable }"
        @click.stop="emit('clickFundingType', item.id)"
      >
        {{ item.fundingTypeFormatted }}
      </button>
    </VTableCell>

    <VTableCell class="v-table-item-header__status is--gt-tablet-show">
      <VBadge
        :color="item.statusFormatted.color"
      >
        {{ item.statusFormatted.text }}
      </VBadge>
    </VTableCell>

    <VTableCell class="is--gt-tablet-show">
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

  @media screen and (width < $tablet){
    display: flex;
    align-items: center;
    flex-direction: column;
  }

  @media screen and (width < $tablet){
    .v-table-cell {
      width: 100%;
      display: flex;
      align-items: center;
      padding: 0;
    }
  }

  & &__amount {
    @media screen and (width < $tablet){
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 2px 4px;
      align-items: baseline;
      width: 100%;
      padding: 8px 0 24px;

      > *:nth-child(odd) {
        text-align: left;
      }

      > *:nth-child(even) {
        text-align: right;
        justify-self: end;
      }
    }
  }

  &__link {
    color: $gray-80;
    text-decoration: none;

    &:hover {
      color: $primary !important;
    }
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

    @media screen and (width < $tablet){
      display: block;
      width: 100%;
      max-width: 100%;
      text-align: center;
    }
  }

  &__table-image-wrap {
    width: 55px;
    height: 55px;
    background-color: $primary-light;
    display: flex;
    justify-content: center;
    align-items: center;
    flex-shrink: 0;

    @media screen and (width < $tablet){
      width: 100%;
      height: 150px;
      margin-bottom: 8px;
    }
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
    box-shadow: 0 2px 5px -5px rgb(18 22 31 / 3%), 0 2px 3px -3px rgb(18 22 31 / 15%);

    #{$root}__chevron {
      transform: rotate(180deg);
    }
  }
}
</style>
