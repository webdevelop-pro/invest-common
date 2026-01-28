<script setup lang="ts">
import { useGlobalLoader } from 'UiKit/store/useGlobalLoader';
import VSectionWhatOurClientsSay from 'UiKit/components/VWhatOurClientsSay/VSectionWhatOurClientsSay.vue';
import {
  computed, defineAsyncComponent, hydrateOnVisible,
  watch,
} from 'vue';
import { storeToRefs } from 'pinia';
import VSectionCardOfferGrid from 'UiKit/components/VCard/VSectionCardOfferGrid.vue';
import { useRoute } from 'vitepress';
import { useRepositoryOffer } from 'InvestCommon/data/offer/offer.repository';

const VSliderSectionCardOffer = defineAsyncComponent({
  loader: () => import('UiKit/components/VSlider/VSliderSectionCardOffer.vue'),
  hydrate: hydrateOnVisible(),
});

const offerRepository = useRepositoryOffer();
const { getOffersState } = storeToRefs(offerRepository);

const offers = computed(() => getOffersState.value.data?.data || []);
const offersClosed = computed(() => offers.value.filter((item) => item.isStatusClosedSuccessfully));
const showClosed = computed(() => ((offersClosed.value?.length || 0) > 0));

useGlobalLoader().hide();

if (!getOffersState.value.data) offerRepository.getOffers();
const route = useRoute();

watch(
  () => route.path,
  () => {
    setTimeout(() => {
      useGlobalLoader().hide();
    }, 100);
  },
);
</script>

<template>
  <div class="ViewOffers view-offers is--page">
    <div class="is--container">
      <h1> Invest Now </h1>
    </div>
    <VSectionCardOfferGrid
      :items="offers"
      sub-title="Building wealth, securing tomorrow"
      :loading="getOffersState.loading"
      class="is--no-padding is--margin-top-10"
      :class="{ 'is--padding-bottom-130': showClosed }"
    />
    <VSliderSectionCardOffer
      v-if="showClosed"
      class="is--background-gray-10 is--paddings"
      :items="offersClosed"
      :data-title="{
        title: 'Closed Deals',
        subtitle: 'Explore successfully funded investment offerings',
      }"
    />
    <VSectionWhatOurClientsSay />
  </div>
</template>

<style lang="scss">
@use 'UiKit/styles/colors.scss' as *;

.view-offers {
  width: 100%;

  &__lists-empty {
    text-align: center;
    font-size: 20px;

    strong {
      font-weight: 800;
    }
  }

  &__skeleton-wrap {
    display: flex;
    justify-content: space-between;
    align-items: stretch;
    flex-wrap: wrap;
    margin: 0 -15px;
  }

  &__skeleton {
    margin: 0 15px 30px;
  }

  &__title-wrap {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
    padding-bottom: 40px;
    border-bottom: 1px solid $gray-40;
    margin-bottom: 30px;
  }

  &__lists {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 31px;

    @include media-lte(desktop) {
      grid-template-columns: repeat(2, 1fr);
    }

    @include media-lte(tablet) {
      grid-template-columns: repeat(1, 1fr);
    }
  }

  .v-section__content {
    @media screen and (width < $tablet) {
      margin-top: 20px !important;
    }
  }
}
</style>
