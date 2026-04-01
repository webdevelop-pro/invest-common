<script setup lang="ts">
import { PropType } from 'vue';
import {
  type RouteLocationRaw,
  useRoute,
  useRouter,
} from 'vue-router';
import {
  VTabs, VTabsList, VTabsTrigger,
} from 'UiKit/components/Base/VTabs';

interface ITab {
  value: string;
  label: string;
  to?: RouteLocationRaw;
  subTitle?: string;
}
const props = defineProps({
  tab: {
    type: String,
    required: true,
  },
  hideTabs: {
    type: Boolean,
    default: false,
  },
  tabs: Object as PropType<{ [key: string]: ITab }>,
});

const route = useRoute();
const router = useRouter();

const handleTabChange = (nextTab: string) => {
  if (nextTab === props.tab) {
    return;
  }

  const nextRouteTarget = props.tabs?.[nextTab]?.to;

  if (!nextRouteTarget) {
    return;
  }

  const nextResolvedRoute = router.resolve(nextRouteTarget);

  if (nextResolvedRoute.fullPath === route.fullPath) {
    return;
  }

  void router.push(nextRouteTarget);
};
</script>

<template>
  <div class="VPageTopInfoAndTabs v-page-top-info-and-tabs">
    <section class="v-page-top-info-and-tabs__top-info">
      <div class="wd-container">
        <slot name="top-info" />
      </div>
    </section>
    <VTabs
      v-if="!hideTabs"
      :model-value="tab"
      class="v-page-top-info-and-tabs__tabs"
      @update:model-value="handleTabChange"
    >
      <div class="wd-container">
        <VTabsList>
          <VTabsTrigger
            v-for="(item, tabIndex) in tabs"
            :key="tabIndex"
            :value="item.value"
          >
            {{ item.label }}
            <template
              v-if="item.subTitle"
              #subtitle
            >
              {{ item.subTitle }}
            </template>
          </VTabsTrigger>
        </VTabsList>
      </div>
      <div class="v-page-top-info-and-tabs__tabs-content">
        <div class="wd-container">
          <slot name="tabs-content" />
        </div>
      </div>
    </VTabs>
    <div
      v-else
      class="v-page-top-info-and-tabs__tabs-content"
    >
      <div class="wd-container">
        <slot name="tabs-content" />
      </div>
    </div>
    <slot name="content" />
  </div>
</template>

<style lang="scss">
@use 'UiKit/styles/_variables.scss' as *;

.v-page-top-info-and-tabs {
  width: 100%;
  background-color: $gray-10;
  position: relative;
  // height: calc($header-height + 100%);
  // padding-top: $header-height;
  margin-bottom: 90px;


  // @media screen and (max-width: $tablet){
  //   height: calc($header-height + 100%);
  //   padding-top: $header-height;
  // }

  &__top-info {
    margin: 40px 0 45px;

    @media screen and (max-width: $tablet){
      margin: 26px 0;
    }
  }

  &__tabs-content {
    background: $white;
    padding-bottom: 40px;
    height: 100%;

    @media screen and (width < $tablet) {
      padding-top: 24px;
    }
  }

  .v-tabs-content {
    @media screen and (width < $tablet) {
      padding-top: 24px;
    }
  }
}
</style>
