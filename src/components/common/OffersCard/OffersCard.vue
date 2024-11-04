<script setup lang="ts">
import { IOffer } from 'InvestCommon/types/api/offers';
import { currency } from 'InvestCommon/helpers/currency';
import BaseButton from 'UiKit/components/BaseButton/BaseButton.vue';
import BaseTag from 'UiKit/components/BaseTag/BaseTag.vue';
import { PropType, computed } from 'vue';
import defaulImage from 'InvestCommon/assets/images/default.svg?url';
import InfoSlot from '../InfoSlot.vue';
import { useOfferStore } from 'InvestCommon/store';

const props = defineProps({
  offer: {
    type: Object as PropType<IOffer>,
    required: true,
  },
  funded: Boolean,
  routeName: String,
  link: String,
});
const offerStore = useOfferStore();

const offerImage = computed(() => {
  if (props.offer.image.meta_data?.medium) return props.offer.image.meta_data.medium;
  if (props.offer.image.url) return props.offer.image.url;
  return defaulImage;
});
const to = computed(() => ({ name: props.routeName, params: { slug: props.offer.slug } }));
const isDefaultImage = computed(() => (!props.offer.image.meta_data?.small && !props.offer.image.url));
const minInvestment = computed(() => (props.offer.min_investment * props.offer.price_per_share));
const amountPercent = computed(() => offerStore.getOfferFundedPercent(props.offer));
const isClosingSoon = computed(() => (amountPercent.value > 90));
const isNew = computed(() => {
  const twoDaysAgo = new Date();
  twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);
  // return start_at < twoDaysAgo;
  return false; // TODO fix
});
const tagText = computed(() => (isClosingSoon.value ? '🔥 Closing Soon' : 'New'));
const tagBackground = computed(() => (isClosingSoon.value ? '#FFF7E8' : '#D9FFEE'));
const showTag = computed(() => isClosingSoon.value || isNew.value);
const infoTags = computed(() => ([
  'Fintech',
  'E-Commerce',
  'Network Security',
]));
const componentName = computed(() => {
  if (props.routeName) return 'router-link';
  else if (props.link) return 'a';
  return 'div';
})
</script>

<template>
  <component
    :is="componentName"
    :to="to"
    :href="link"
    itemscope
    itemtype="https://schema.org/Product"
    class="OffersCard offers-card"
  >
    <BaseTag
      v-if="showTag"
      round
      :background="tagBackground"
      class="offers-card__tag"
    >
      {{ tagText }}
    </BaseTag>
    <div
      v-if="offerImage"
      class="offers-card__img-wrap"
    >
      <img
        :src="offerImage"
        :alt="offer.slug"
        itemprop="image"
        class="offers-card__img is--no-margin"
        :class="{ 'is--default-image': isDefaultImage }"
      >
    </div>
    <div class="offers-card__inner">
      <h2
        class="offers-card__title is--h3__title"
        data-testid="offer-title"
        itemprop="name"
      >
        {{ offer.name }}
      </h2>
      <div class="offers-card__inner-bottom">
        <div class="offers-card__content">
          <div
            v-if="funded"
            class="offers-card__funded is--small-2"
          >
            Funded
          </div>
          <div
            v-if="offer.seo_description"
            itemprop="description"
            class="offers-card__description is--small"
          >
            {{ offer.seo_description }}
          </div>
          <InfoSlot
            v-if="!funded"
            size="small"
            class="offers-card__info"
          >
            <div class="offers-card__info-wrap">
              <div class="offers-card__details is--small-2">
                Min investment:
                <span class="offers-card__details-number is--h6__title">
                  {{ currency(minInvestment, 0) }}
                </span>
              </div>
              <div class="offers-card__details is--small-2">
                Pre-Money Valuation:
                <span class="offers-card__details-number is--h6__title">
                  {{ currency(offer.valuation, 0) }}
                </span>
              </div>
            </div>
          </InfoSlot>
          <div class="offers-card__tag-info-wrap">
            <BaseTag
              v-for="(tagInfo, indexInfo) in infoTags"
              :key="indexInfo"
              round
              size="small"
              background="#DEE2E6"
              itemprop="keywords"
              class="offers-card__tag-info"
            >
              {{ tagInfo }}
            </BaseTag>
          </div>
        </div>
        <BaseButton
          v-if="!funded"
          tag="router-link"
          :to="to"
          block
          color="secondary"
          class="offers-card__btn"
        >
          Invest Now
        </BaseButton>
      </div>
    </div>
  </component>
</template>

<style lang="scss">
.offers-card {
  position: relative;
  display: flex;
  flex-direction: column;
  background: $white;
  box-shadow: $box-shadow-medium;
  transition: all .3s ease;
  width: 100%;
  cursor: pointer;
  text-decoration: none;

  &:hover {
    box-shadow: $box-shadow-large;
  }

  &__img-wrap {
    width: 100%;
    min-height: 190px;
    background-color: $primary-light;
    display: flex;
    justify-content: center;
    align-items: center;
  }

  &__img {
    height: 190px;
    width: 100%;
    max-width: 100%;
    object-fit: cover;

    &.is--default-image {
      max-width: 120px;
      max-height: 120px;
    }
  }

  &__inner {
    display: flex;
    padding: 40px;
    flex-direction: column;
    border-radius: 2px;
    color: $black;
    height: 100%;
  }

  &__title {
    text-transform: capitalize;
  }

  &__funded {
    color: $secondary-dark;
    margin-bottom: 8px;
  }

  &__details {
    color: $gray-70;
    width: 50%;
    display: flex;
    flex-direction: column;
  }

  &__details-number {
    color: $gray-80;
  }

  &__inner-bottom {
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    height: 100%;
  }

  &__description {
    margin-bottom: 16px;
    color: $gray-80;
    max-height: 36px;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
    display: -webkit-box;
  }

  &__btn {
    margin-top: 28px !important;
  }

  &__tag {
    position: absolute;
    top: 12px;
    left: 12px;
  }

  &__info {
    border-top: 1px solid $gray-20;
  }

  &__info-wrap {
    margin: 0 -12px;
    display: flex;
    width: calc(100% + 24px);
  }

  &__tag-info-wrap {
    margin-top: 20px;
    display: flex;
    width: 100%;
    gap: 8px;
  }
}
</style>
