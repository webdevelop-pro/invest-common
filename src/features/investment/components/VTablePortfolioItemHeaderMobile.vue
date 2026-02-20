<script setup lang="ts">
import VBadge from 'UiKit/components/Base/VBadge/VBadge.vue';
import { PropType, computed } from 'vue';
import { useProfilesStore } from 'InvestCommon/domain/profiles/store/useProfiles';
import { storeToRefs } from 'pinia';
import { ROUTE_INVESTMENT_DOCUMENTS } from 'InvestCommon/domain/config/enums/routes';
import VImage from 'UiKit/components/Base/VImage/VImage.vue';
import { IInvestmentFormatted } from 'InvestCommon/data/investment/investment.types';

defineProps({
  id: String,
  item: {
    type: Object as PropType<IInvestmentFormatted>,
    required: true,
  },
  search: String,
  colspan: {
    type: Number,
    default: 1,
  },
});

const profilesStore = useProfilesStore();
const { selectedUserProfileId, selectedUserProfileData } = storeToRefs(profilesStore);

const profileType = computed(() => selectedUserProfileData.value?.type || '');
</script>

<template>
  <router-link
    :to="{ name: ROUTE_INVESTMENT_DOCUMENTS, params: { profileId: selectedUserProfileId, id: item.id } }"
    class="v-table-item-header-mobile"
    @click.stop
  >
    <div class="v-table-item-header-mobile__offer">
      <div class="v-table-item-header-mobile__image-wrap">
        <VImage
          :src="item?.offer?.imageMedium"
          :alt="`${item.offer?.name} image`"
          fit="cover"
          class="v-table-item-header-mobile__image"
          :class="{ 'is--default-image': item?.offer?.isDefaultImage }"
        />
      </div>
      <div
        v-highlight="search"
        class="v-table-item-header-mobile__name is--h3__title"
      >
        {{ item.offer?.name }}
      </div>
    </div>
    <div class="v-table-item-header-mobile__amount is--body">
      <router-link
        :to="{ name: ROUTE_INVESTMENT_DOCUMENTS, params: { profileId: selectedUserProfileId, id: item.id } }"
        class="v-table-item-header-mobile__link is--link-1"
        @click.stop
      >
        {{ item.id }}
      </router-link>
      <router-link
        :to="{ name: ROUTE_INVESTMENT_DOCUMENTS, params: { profileId: selectedUserProfileId, id: item.id } }"
        class="v-table-item-header-mobile__link is--link-1 is--color-black is--h5__title"
        @click.stop
      >
        {{ item.amountFormattedZero }}
      </router-link>
      <div class="v-table-item-header-mobile__ownership">
        {{ profileType.charAt(0).toUpperCase() + profileType.slice(1) }}
      </div>
      <div class="v-table-item-header-mobile__date">
        {{ item.submitedAtFormatted }}
      </div>
      <VBadge
        :color="item.statusFormatted.color"
        class="v-table-item-header-mobile__status"
      >
        {{ item.statusFormatted.text }}
      </VBadge>
    </div>
  </router-link>
</template>

<style lang="scss" scoped>
@use 'UiKit/styles/_variables.scss' as variables;

.v-table-item-header-mobile {
  color: $gray-80;
  cursor: pointer !important;
  text-decoration: none;
  position: relative;

  &__status {
    position: absolute;
    top: 12px;
    left: 12px;
  }

  &__offer {
    display: block;
    width: 100%;
    max-width: 100%;
    margin-bottom: 8px;
  }

  &__image-wrap {
    width: 100%;
    height: 150px;
    margin-bottom: 8px;
    background-color: $primary-light;
    display: flex;
    justify-content: center;
    align-items: center;
    flex-shrink: 0;
  }

  &__image {
    width: 100%;
    height: 100%;

    &.is--default-image {
      max-width: 75%;
      max-height: 75%;
    }
  }

  &__name {
    text-align: center;
  }

  &__amount {
    display: grid;
    grid-template-columns: 1fr 1fr;
    align-items: baseline;
    width: 100%;
    padding: 12px;
    margin: 8px 0 24px;
    border-top: 1px solid $gray-20;
    border-bottom: 1px solid $gray-20;
    gap: 2px 4px;

    > *:nth-child(odd) {
      text-align: left;
      display: block;
    }

    > *:nth-child(even) {
      display: block;
      text-align: right;
      justify-self: end;
      width: 100%;
    }
  }

  &__link {
    color: $gray-80;
    text-decoration: none;

    &:hover {
      color: $primary !important;
    }
  }

  &__ownership,
  &__date {
    color: $gray-80;
  }

  &__funding-type {
    font-size: 14px;
    line-height: 21px;
    background: none;
    border: none;
    padding: 0;
    cursor: pointer;
    color: inherit;
    text-align: left;
  }

  &.is--open {
    position: relative;
    box-shadow: 0 2px 5px -5px rgb(18 22 31 / 3%), 0 2px 3px -3px rgb(18 22 31 / 15%);
  }
}
</style>
