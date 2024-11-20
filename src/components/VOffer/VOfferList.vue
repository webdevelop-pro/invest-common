<script setup lang="ts">
import { defineAsyncComponent, hydrateOnVisible, PropType } from 'vue';
import { IOffer } from 'InvestCommon/types/api/offers';
import VSkeleton from 'UiKit/components/VSkeleton/VSkeleton.vue';
import { urlOfferSingle } from 'InvestCommon/global/links';

// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
const VButton = defineAsyncComponent({
  loader: () => import('UiKit/components/VButton/VButton.vue'),
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call
  hydrate: hydrateOnVisible(),
});
// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
const VOfferCard = defineAsyncComponent({
  loader: () => import('InvestCommon/components/VOffer/VOfferCard.vue'),
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call
  hydrate: hydrateOnVisible(),
});

defineProps({
  loading: {
    type: Boolean,
    default: true,
  },
  items: {
    type: Array as PropType<IOffer[]>,
    required: true,
  },
  buttonLink: String,
  title: {
    type: String,
    default: 'Invest Now',
  },
  subtitle: {
    type: String,
    default: 'Building wealth, securing tomorrow',
  },
});
</script>

<template>
  <section class="VOfferList v-offer-list">
    <div class="is--container">
      <div class="v-offer-list__title-wrap">
        <h1 class="v-offer-list__title">
          {{ title }}
        </h1>
        <p class="is--subheading-1">
          {{ subtitle }}
        </p>
      </div>
      <ClientOnly>
        <div
          v-if="loading"
          class="v-offer-list__skeleton-wrap"
        >
          <VSkeleton
            v-for="i in 3"
            :key="i"
            height="487px"
            width="calc(33.3333% - 30px)"
            class="v-offer-list__skeleton"
            data-testid="v-offer-list-skeleton"
          />
          <VSkeleton
            v-for="i in 3"
            :key="i"
            height="487px"
            width="calc(33.3333% - 30px)"
            class="v-offer-list__skeleton"
            data-testid="v-offer-list-skeleton"
          />
        </div>
        <div
          v-else
          class="v-offer-list__lists-wrap"
        >
          <template v-if="items?.length">
            <div class="v-offer-list__lists">
              <VOfferCard
                v-for="(offer, index) in items"
                :key="offer.slug"
                :offer="offer"
                :loading="(index < 7) ? 'eager' : 'lazy'"
                :link="urlOfferSingle(offer.slug)"
                class="v-offer-list__list-item"
              />
            </div>
            <VButton
              tag="a"
              :href="buttonLink"
              size="large"
              variant="link"
              class="v-offer-list__button"
            >
              View More Offerings
            </VButton>
          </template>
          <p
            v-else
            class="is--no-data"
          >
            Offers not found
          </p>
        </div>
      </ClientOnly>
    </div>
  </section>
</template>

<style lang="scss">
.v-offer-list {
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
    padding-bottom: 51px;
  }

  &__skeleton {
    margin: 0 15px 30px;
  }

  &__title-wrap {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    padding-bottom: 40px;
    border-bottom: 1px solid $gray-40;
    margin-bottom: 30px;
  }

  &__lists {
    display: grid;
    width: 100%;
    grid-template-columns: repeat(3, 1fr);
    gap: 31px;
    @include media-lte(desktop) {
      grid-template-columns: repeat(2, 1fr);
    }
    @include media-lte(tablet) {
      grid-template-columns: repeat(1, 1fr);
    }
  }

  &__lists-wrap {
    display: flex;
    align-items: center;
    flex-direction: column;
  }

  &__list-item {
    margin-top: 0;
  }

  &__button {
    margin-top: 32px;
  }
}
</style>
