<script setup lang="ts">
import { IOffer } from 'InvestCommon/types/api/offers';
import { currency } from 'InvestCommon/helpers/currency';
import VButton from 'UiKit/components/VButton/VButton.vue';
import VTag from 'UiKit/components/VTag/VTag.vue';
import { PropType, computed } from 'vue';
import defaulImage from 'InvestCommon/assets/images/default.svg?url';
import VInfoSlot from 'InvestCommon/components/VInfoSlot/VInfoSlot.vue';
import { useOfferStore } from 'InvestCommon/store/useOffer';
import VImage from 'UiKit/components/VImage/VImage.vue';

const props = defineProps({
  offer: {
    type: Object as PropType<IOffer>,
    required: true,
  },
  funded: Boolean,
  routeName: String,
  link: String,
  loading: {
    type: String,
    default: 'eager',
  },
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
</script>

<template>
  <article
    itemscope
    itemtype="https://schema.org/Product"
    class="VOfferCard v-offer-card"
  >
    <VTag
      v-if="showTag"
      round
      :background="tagBackground"
      class="v-offer-card__tag"
    >
      {{ tagText }}
    </VTag>
    <div
      v-if="offerImage"
      class="v-offer-card__img-wrap"
    >
      <VImage
        :src="offerImage"
        :alt="offer.slug"
        itemprop="image"
        :loading="loading"
        class="v-offer-card__img is--no-margin"
        :class="{ 'is--default-image': isDefaultImage }"
      />
    </div>
    <div class="v-offer-card__inner">
      <h2
        class="v-offer-card__title is--h3__title"
        data-testid="offer-title"
        itemprop="name"
      >
        {{ offer.name }}
      </h2>
      <div class="v-offer-card__inner-bottom">
        <div class="v-offer-card__content">
          <div
            v-if="funded"
            class="v-offer-card__funded is--small-2"
          >
            Funded
          </div>
          <div
            v-if="offer.seo_description"
            itemprop="description"
            class="v-offer-card__description is--small"
          >
            {{ offer.seo_description }}
          </div>
          <VInfoSlot
            v-if="!funded"
            size="small"
            class="v-offer-card__info"
          >
            <div class="v-offer-card__info-wrap">
              <div class="v-offer-card__details is--small-2">
                Min investment:
                <span class="v-offer-card__details-number is--h6__title">
                  {{ currency(minInvestment, 0) }}
                </span>
              </div>
              <div class="v-offer-card__details is--small-2">
                Pre-Money Valuation:
                <span class="v-offer-card__details-number is--h6__title">
                  {{ currency(offer.valuation, 0) }}
                </span>
              </div>
            </div>
          </VInfoSlot>
          <div class="v-offer-card__tag-info-wrap">
            <VTag
              v-for="(tagInfo, indexInfo) in infoTags"
              :key="indexInfo"
              round
              size="small"
              background="#DEE2E6"
              itemprop="keywords"
              class="v-offer-card__tag-info"
            >
              {{ tagInfo }}
            </VTag>
          </div>
        </div>
        <VButton
          v-if="!funded"
          tag="router-link"
          :to="to"
          block
          color="secondary"
          class="v-offer-card__btn"
        >
          Invest Now
        </VButton>
      </div>
    </div>
    <a
      v-if="link"
      :href="link"
      :aria-label="offer.name"
      v-bind="$attrs"
      class="v-offer-card__link"
    />
    <router-link
      v-if="routeName"
      :to="to"
      class="v-offer-card__link"
      :aria-label="`card ${offer.name} link`"
    />
  </article>
</template>

<style lang="scss">
.v-offer-card {
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

  &__link {
    position: absolute;
    top: 0;
    bottom: 0;
    left: 0;
    right: 0;
  }
}
</style>
