<script setup lang="ts">
import { computed, defineAsyncComponent, hydrateOnIdle, hydrateOnVisible, ref, onMounted } from 'vue';
import { useData } from 'vitepress';
import VSectionTopVideo from 'UiKit/components/VSectionTop/VSectionTopVideo.vue';
import { storeToRefs } from 'pinia';
import { data as allPages } from '@/store/all.data';
import { filterPages } from 'UiKit/helpers/allData';
import { IFrontmatter } from 'UiKit/types/types';
import { useGlobalLoader } from 'UiKit/store/useGlobalLoader';
import { useRepositoryOffer } from 'InvestCommon/data/offer/offer.repository';

import { __pageData as topData } from 'Docs/home/top.md';
import { __pageData as partnersData } from 'Docs/home/partners.md';
import { __pageData as introData } from 'Docs/home/intro.md';
import { __pageData as blogData } from 'Docs/home/blog.md';

const VSectionCardArticleList = defineAsyncComponent({
  loader: () => import('UiKit/components/VCard/VSectionCardArticleList.vue'),
  hydrate: hydrateOnVisible(),
});
const VSectionWhatOurClientsSay = defineAsyncComponent({
  loader: () => import('UiKit/components/VWhatOurClientsSay/VSectionWhatOurClientsSay.vue'),
  hydrate: hydrateOnVisible(),
});
const VSectionPartners = defineAsyncComponent({
  loader: () => import('UiKit/components/VSection/VSectionPartners.vue'),
  hydrate: hydrateOnVisible(),
});
const VSectionCardOfferGrid = defineAsyncComponent({
  loader: () => import('UiKit/components/VCard/VSectionCardOfferGrid.vue'),
  hydrate: hydrateOnIdle(),
});
const VIntro = defineAsyncComponent({
  loader: () => import('UiKit/components/VAds/VIntro.vue'),
  hydrate: hydrateOnVisible(),
});

const { theme } = useData();
const offerRepository = useRepositoryOffer();
const { getOffersState } = storeToRefs(offerRepository);

const blogPosts = theme.navigation.rc.filterChilds('layout', 'resource-center-single')?.map((post) => post.data);
const blog = theme.navigation.rc.data;
const explore = filterPages(allPages as IFrontmatter[], 'layout', 'offers');

const offers = computed(() => getOffersState.value.data?.data?.slice(0, 6) || []);
const latest3Items = computed(() => blogPosts?.slice(0, 3));

if (!getOffersState.value.data) offerRepository.getOffers();
useGlobalLoader().hide();

const videoSrc = ref<string | undefined>(undefined);

onMounted(async () => {
  const videoModule = await import('InvestCommon/shared/assets/video/video-bg.mp4');
  videoSrc.value = videoModule.default as string;
});
</script>

<template>
  <div
    class="ViewHome view-home"
  >
    <div class="view-home__top-wrap">
      <VSectionTopVideo
        :title="topData.frontmatter.title"
        :sub-title="topData.frontmatter.subTitle"
        :button-href="explore[0].url"
        :video-src="videoSrc"
        content-class="view-home__hero-content"
        full-height
        video-cover-image="/images/main-header-banner.svg"
      >
        <template #buttonText>
          {{ topData.frontmatter.buttonText }}
        </template>
      </VSectionTopVideo>
      <VSectionPartners
        :title="partnersData.frontmatter.title"
        :items="partnersData.frontmatter.items"
        class="view-home__partners"
      />
    </div>
    <VIntro
      :data="[introData.frontmatter]"
      color="dark"
      :image-url="introData.frontmatter.img"
    />
    <VSectionCardOfferGrid
      :items="offers"
      :button-href="explore[0].url"
      button-text="View More Offerings"
      title="Invest Now"
      sub-title="Building wealth, securing tomorrow"
      :loading="getOffersState.loading"
      class="is--paddings"
    />
    <VSectionWhatOurClientsSay />
    <VSectionCardArticleList
      :title="blogData.frontmatter.title"
      :sub-title="blogData.frontmatter.subTitle"
      :items="latest3Items"
      :button-href="blog.url"
      button-text="View More Articles"
      class="is--margin-top-130 is--paddings is--background-primary-light"
    />
  </div>
</template>

<style lang="scss">
.view-home {
  width: 100%;

  &__partners {
    position: absolute;
    bottom: 70px;
    left: 50%;
    transform: translateX(-50%);
    width: 100%;
    z-index: 5;

    @media screen and (width < $tablet){
      position: initial;
      transform: none;
      padding: 70px 0;
      background-color: $gray-10;
    }
  }

  &__top-wrap {
    position: relative;
  }

  &__intro {
    background-color: $black;
    padding: 130px 0;

    @include media-lte(tablet) {
      padding: 100px 0 40px;
    }
  }

  &__what-our-clients-say {
    margin-bottom: 130px;

    @include media-lte(tablet) {
      margin-bottom: 100px;
    }
  }

  &__hero-content {
    @include media-lte(tablet) {
      .v-button.is--margin-top-40 {
        margin: 20px 0 40px;
      }
    }
  }
}
</style>
