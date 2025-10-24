<script setup lang="ts">
import VButton from 'UiKit/components/Base/VButton/VButton.vue';
import VTimeline from 'UiKit/components/Base/VTimeline/VTimeline.vue';
import VTimelineItem from 'UiKit/components/Base/VTimeline/VTimelineItem.vue';
import VTimelineCard from 'UiKit/components/Base/VTimeline/VTimelineCard.vue';
import { useData } from 'vitepress';
import { data as allPages } from '@/store/all.data';
import { filterPages } from 'UiKit/helpers/allData';
import { IFrontmatter } from 'UiKit/types/types';
import VListsCaption from 'UiKit/components/VList/VListsCaption.vue';
import { useGlobalLoader } from 'UiKit/store/useGlobalLoader';

const { frontmatter } = useData();

const offers = filterPages(allPages as IFrontmatter[], 'layout', 'offers');

useGlobalLoader().hide();
</script>

<template>
  <div class="ViewHowItWorks view-how-it-works is--page">
    <div class="is--container is--flex-row">
      <aside class="view-how-it-works__left">
        <div class="is--sticky with-default-distance">
          <h1>
            {{ frontmatter.title }}
          </h1>
          <p class="view-how-it-works__subheading is--subheading-1">
            {{ frontmatter.description }}
          </p>
          <VButton
            size="large"
            as="a"
            :href="offers[0].url"
          >
            Start Investing
          </VButton>
        </div>
      </aside>
      <section class="view-how-it-works__right">
        <VTimeline>
          <VTimelineItem
            v-for="(dataItem, index) in frontmatter.data"
            :key="index"
            :circle-type="dataItem.circleType"
            :title="dataItem.title"
          >
            <VTimelineCard
              v-for="(item, i) in dataItem.items"
              :key="i"
              :title="item.title"
            >
              <div>
                <p v-html="item.text" />
                <VListsCaption
                  v-if="item.captions"
                  :items="item.captions"
                  class="is--margin-top-15"
                />
                <div
                  v-if="item.buttonRoute || item.buttonHref"
                  class="is--margin-top-15"
                >
                  <VButton
                    v-if="item.buttonRoute"
                    as="router-link"
                    variant="tetriary"
                    block
                    :to="{ name: item.buttonRoute }"
                  >
                    {{ item.buttonText }}
                  </VButton>
                  <VButton
                    v-if="item.buttonHref"
                    as="a"
                    variant="tetriary"
                    block
                    :href="item.buttonHref"
                  >
                    {{ item.buttonText }}
                  </VButton>
                </div>
              </div>
            </VTimelineCard>
          </VTimelineItem>
        </VTimeline>
      </section>
    </div>
  </div>
</template>

<style lang="scss">
.view-how-it-works{
  width: 100%;
  padding-bottom: 40px;

  @include media-lt(tablet) {
    padding-bottom: 0;
  }

  &__subheading {
    color: $black;
    margin-bottom: 10px;
  }

  &__left {
    position: relative;
    width: 34%;
    flex-shrink: 0;

    @include media-lt(tablet) {
      width: 100%;
      margin-bottom: 40px;
    }
  }

  &__right {
    width: 63.3%;
    margin-top: 8px;

    @include media-lt(tablet) {
      width: 100%;
    }
  }

  .v-timeline-item:not(.is--horizontal) .v-timeline-item__items {
    margin-left: 12px;
  }
}
</style>
