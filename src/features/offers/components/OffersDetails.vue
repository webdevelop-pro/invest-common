<script setup lang="ts">

import { IOffer } from 'InvestCommon/types/api/offers';
import { useOfferStore } from 'InvestCommon/store/useOffer';
import {
  PropType, computed, defineAsyncComponent, hydrateOnVisible, watch,
} from 'vue';
import { storeToRefs } from 'pinia';
import { useBreadcrumbs } from 'UiKit/composables/useBreadcrumbs';
import { useData } from 'vitepress';
import VSkeleton from 'UiKit/components/Base/VSkeleton/VSkeleton.vue';
import OfferDetailsSide from './OffersDetailsSide.vue';
import OffersDetailsContent from './OffersDetailsContent.vue';
import env from 'InvestCommon/global';
import { useRepositoryFiler } from 'InvestCommon/data/filer/filer.repository';

const { FILER_URL } = env;

const VBadge = defineAsyncComponent({
  loader: () => import('UiKit/components/Base/VBadge/VBadge.vue'),
});
const VBreadcrumbs = defineAsyncComponent({
  loader: () => import('UiKit/components/VBreadcrumb/VBreadcrumbsList.vue'),
  hydrate: hydrateOnVisible(),
});
const VImage = defineAsyncComponent({
  loader: () => import('UiKit/components/Base/VImage/VImage.vue'),
});
const VCarousel = defineAsyncComponent({
  loader: () => import('UiKit/components/VCarousel.vue'),
});
const VVideoEmbedded = defineAsyncComponent({
  loader: () => import('UiKit/components/VVideoEmbedded/VVideoEmbedded.vue'),
});

const { page, frontmatter } = useData();
const breadcrumbsList = computed(() => (
  useBreadcrumbs(page, frontmatter)
));

const props = defineProps({
  offer: {
    type: Object as PropType<IOffer> | undefined,
  },
  loading: {
    type: Boolean,
    default: true,
  },
});
const emit = defineEmits(['invest']);

const tags = [
  'Fintech',
  'E-Commerce',
  'Network Security',
];

const offerStore = useOfferStore();
const { isGetOfferOneLoading } = storeToRefs(offerStore);
const filerRepository = useRepositoryFiler();
const { getFilesState, getPublicFilesState } = storeToRefs(filerRepository);

const isLoading = computed(() => (
  getPublicFilesState.value.loading || getFilesState.value.loading || isGetOfferOneLoading.value));

const filesData = computed(() => getPublicFilesState.value.data);
const videoSrc = computed(() => props.offer?.data?.video);
const imageID = computed(() => props.offer?.image_link_id);
const documentsMedia = computed(() => filesData.value?.entities?.media?.entities || {});
const documentsMediaArray = computed(() => Object.values(documentsMedia.value) || []);
const documentsMediaFormatted = computed(() => documentsMediaArray.value?.map((item) => {
  if (item?.url) return { image: item?.url };
  return null;
}) || []);
const carouselFiles = computed(() => {
  const array = documentsMediaFormatted.value;
  if (videoSrc.value) array.unshift({ video: videoSrc.value });
  if (!((array.length === 1) && videoSrc.value) && (imageID.value > 0)) {
    array.push({ image: `${FILER_URL}/public/files/${imageID.value}?size=big`, thumb: `${FILER_URL}/public/files/${imageID.value}?size=small` });
  }
  return array;
});

watch(() => props.offer?.id, () => {
  if (props.offer?.id) {
    filerRepository.getPublicFiles(props.offer?.id, 'offer');
    filerRepository.getFiles(props.offer?.id, 'offer');
  }
}, { immediate: true });
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
          v-if="!(offer?.website || offer?.city || offer?.state)"
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
          <div class="offer-details__tags-wrap">
            <VBadge
              v-for="(tag, index) in tags"
              :key="index"
              size="small"
              itemprop="keywords"
            >
              {{ tag }}
            </VBadge>
          </div>
        </div>
        <OfferDetailsSide
          :loading="loading"
          :offer="offer"
          class="is--lt-desktop-show is--margin-top-40"
          @invest="emit('invest')"
        />
        <VSkeleton
          v-if="!offer"
          height="22px"
          width="100%"
          class="offer-details__content"
        />
        <OffersDetailsContent
          v-else
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
