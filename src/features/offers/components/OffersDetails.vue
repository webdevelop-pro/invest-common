<script setup lang="ts">
import { IOfferFormatted } from 'InvestCommon/data/offer/offer.types';
import { PropType, computed, defineAsyncComponent, hydrateOnVisible } from 'vue';
import VSkeleton from 'UiKit/components/Base/VSkeleton/VSkeleton.vue';
import OfferDetailsSide from './OffersDetailsSide.vue';
import OffersDetailsContent from './OffersDetailsContent.vue';
import { useOffersDetails } from './logic/useOffersDetails';
import VCarousel from 'UiKit/components/VCarousel.vue';
import { useGlobalLoader } from 'UiKit/store/useGlobalLoader';

// const VBadge = defineAsyncComponent({
//   loader: () => import('UiKit/components/Base/VBadge/VBadge.vue'),
// });
const VBreadcrumbs = defineAsyncComponent({
  loader: () => import('UiKit/components/VBreadcrumb/VBreadcrumbsList.vue'),
  hydrate: hydrateOnVisible(),
});

const VSocialLinks = defineAsyncComponent({
  loader: () => import('UiKit/components/VSocialLinks/VSocialLinks.vue'),
});

const props = defineProps({
  offer: {
    type: Object as PropType<IOfferFormatted> | undefined,
  },
  loading: {
    type: Boolean,
    default: true,
  },
});
const emit = defineEmits(['invest']);

const offerRef = computed(() => props.offer);
const { breadcrumbsList, carouselFiles, frontmatter, socialLinks } = useOffersDetails(offerRef);

useGlobalLoader().hide();
</script>

<template>
  <div class="OffersDetails offer-details is--no-margin">
    <div class="offer-details__wrap">
      <div class="offer-details__main is--left">
        <VSkeleton
          v-if="loading"
          height="75px"
          width="100px"
          class="offer-details__title"
        />
        <h1
          v-else
          class="offer-details__title"
          itemprop="name"
        >
          {{ offer?.name }}
        </h1>
        <VSkeleton
          v-if="loading"
          height="491px"
          width="100%"
          class="offer-details__img-wrap"
        />
        <div
          v-else
          class="offer-details__img-wrap"
        >
          <VCarousel
            :name="offer?.name"
            :files="carouselFiles"
            active-item-by-url
          />
        </div>
        <VSkeleton
          v-if="!(offer?.website || offer?.city || offer?.state || socialLinks.length > 0)"
          height="45px"
          width="100%"
          class="offer-details__additional-info-wrap"
        />
        <div
          v-else
          class="offer-details__additional-info-wrap"
        >
          <div
            v-if="offer?.website || offer?.city || offer?.state"
            class="offer-details__additional-info"
          >
            <div
              v-if="offer?.city || offer?.state"
              class="offer-details__city is--small"
            >
              {{ offer?.city ? `${offer.city},` : '' }} {{ offer?.state }}
            </div>
            <a
              v-if="offer?.website"
              :href="offer?.website"
              class="offer-details__website is--link-2"
              target="_blank"
              rel="noopener noreferrer"
            >
              {{ offer?.website?.replace('https://', '')?.replace('/', '') }}
            </a>
          </div>
          <!-- <ul class="offer-details__tags-wrap">
            <VBadge
              v-for="(tag, index) in tags"
              :key="index"
              size="small"
              as="li"
              itemprop="keywords"
            >
              {{ tag }}
            </VBadge>
          </ul> -->
          <VSocialLinks
            v-if="socialLinks.length > 0"
            :social-list="socialLinks"
            class="offer-details__social-links"
          />
        </div>
        <OfferDetailsSide
          :loading="loading"
          :offer="offer"
          class="is--lt-desktop-show is--margin-top-40"
          @invest="emit('invest')"
        />
        <OffersDetailsContent
          v-if="offer"
          :offer="offer"
          :loading="loading"
          class="offer-details__content"
        />
      </div>
      <div class="offer-details__side is--right is--gt-desktop-show">
        <OfferDetailsSide
          :loading="loading"
          :offer="offer"
          class="offer-details__side-scroll is--sticky"
          @invest="emit('invest')"
        />
      </div>
    </div>
    <VBreadcrumbs
      v-if="breadcrumbsList"
      :data="breadcrumbsList"
      :slug="frontmatter.slug"
      class="offer-details__breadcrumbs is--margin-top-80"
    />
  </div>
</template>

<style lang="scss">
.offer-details {
  min-height: 100vh;

  &__wrap {
    display: flex;
    gap: 30px;

    @media screen and (max-width: $desktop){
      flex-direction: column-reverse;
    }
  }

  &__additional-info-wrap {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    padding: 12px;
    border-bottom: 1px solid $gray-20;

    @media screen and (max-width: $desktop){
      flex-direction: column;
    }
  }

  &__additional-info {
    display: flex;
    align-items: center;
    gap: 12px;
  }

  &__tags-wrap {
    display: flex;
    align-items: center;
    gap: 12px;
    padding-left: 0;
  }

  .is--left {
    width: 66%;

    @media screen and (max-width: $desktop){
      width: 100%;
    }
  }

  .is--right {
    width: 32%;

    @media screen and (max-width: $desktop){
      width: 100%;
    }
  }

  &__img-wrap {
    height: 491px;
    background-color: $primary-light;
    display: flex;
    justify-content: center;
    align-items: center;
    overflow: hidden;
    margin-top: 0;

    @media screen and (max-width: $desktop){
      height: 350px;
    }
  }

  &__img {
    width: 100%;
    height: 100%;
    max-width: 100%;
    object-fit: cover;

    &.is--default-image {
      max-width: 120px;
      max-height: 120px !important;
    }
  }

  &__city {
    color: $gray-80;
    flex-shrink: 0;
  }

  & &__social-links {
      color: $gray-70;
      gap: 10px;
      width: auto;
      
      &__item {
        &:hover {
          color: $primary;
        }
      }

      svg {
        width: 20px;
        height: 20px;
      }

      a {
        margin-right: 0;
      }
  }

  &__breadcrumbs {
    margin-top: 90px;
  }

  &__title {
    margin-bottom: 12px;
  }

  &__side {
    position: relative;
  }
}
</style>
