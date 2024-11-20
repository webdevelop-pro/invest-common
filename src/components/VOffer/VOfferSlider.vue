<script setup lang="ts">
import { PropType } from 'vue';
import { IOffer } from 'InvestCommon/types/api/offers';
import VOfferCard from 'InvestCommon/components/VOffer/VOfferCard.vue';
import SliderSwiper from 'UiKit/components/Sliders/VSliderSwiper.vue';
import { SwiperSlide } from 'swiper/vue';
import { urlOfferSingle } from 'InvestCommon/global/links';

defineProps({
  loading: Boolean,
  items: {
    type: Array as PropType<IOffer[]>,
    required: true,
  },
  buttonLink: String,
  title: {
    type: String,
    default: 'Closed Deals',
  },
  subtitle: {
    type: String,
    default: 'Explore successfully funded investment offerings',
  },
});


const breakpoints = {
  767: {
    slidesPerView: 2,
    spaceBetween: 30,
  },
  980: {
    slidesPerView: 3,
    spaceBetween: 30,
  },
};
</script>

<template>
  <section
    v-if="items && (items.length > 0)"
    class="VOfferSlider v-offer-slider"
  >
    <div class="is--container">
      <div class="v-offer-slider__closed-title-wrap">
        <h2 class="is--h1__title">
          {{ title }}
        </h2>
        <div class="is--subheading-1">
          {{ subtitle }}
        </div>
      </div>
      <SliderSwiper :breakpoints="breakpoints">
        <SwiperSlide
          v-for="offer in items"
          :key="offer.slug"
        >
          <VOfferCard
            :offer="offer"
            funded
            :link="urlOfferSingle(offer.slug)"
            class="v-offer-slider__closed-item"
          />
        </SwiperSlide>
      </SliderSwiper>
    </div>
  </section>
</template>

<style lang="scss">
.v-offer-slider {
  width: 100%;
  overflow: hidden;

  &__closed-title-wrap {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
    margin-bottom: 60px;
  }

  &__closed-item {
    height: 100%;
  }
}
</style>
