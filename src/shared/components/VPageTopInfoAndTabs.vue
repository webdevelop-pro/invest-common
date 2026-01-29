<script setup lang="ts">
import { PropType } from 'vue';
import {
  VTabs, VTabsList, VTabsTrigger,
} from 'UiKit/components/Base/VTabs';

interface ITab {
  value: string;
  label: string;
  to: {
    name: string;
    params: {
      profileId: string;
    };
  };
  subTitle?: string;
}
defineProps({
  tab: {
    type: String,
    required: true,
  },
  tabs: Object as PropType<{ [key: string]: ITab }>,
});
</script>

<template>
  <div class="VPageTopInfoAndTabs v-page-top-info-and-tabs">
    <section class="v-page-top-info-and-tabs__top-info">
      <div class="wd-container">
        <slot name="top-info" />
      </div>
    </section>
    <VTabs
      :default-value="tab"
      tabs-to-url
      class="v-page-top-info-and-tabs__tabs"
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
    <slot name="content" />
  </div>
</template>

<style lang="scss">
@use 'UiKit/styles/_variables.scss' as *;

.v-page-top-info-and-tabs {
  width: 100%;
  background-color: $gray-10;
  position: relative;
  height: calc($header-height + 100%);
  padding-top: $header-height;
  margin-bottom: 90px;

  &__top-info {
    margin: 40px 0 45px;

    @media screen and (max-width: $tablet){
      margin: 26px 0;
    }
  }

  &__tabs-content {
    background: $white;
    padding-bottom: 40px;
  }

  .v-tabs-content {
    @media screen and (width < $tablet) {
      padding-top: 24px;
    }
  }
}
</style>
