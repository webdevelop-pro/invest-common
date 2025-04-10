<script setup lang="ts">
import { PropType } from 'vue';
import {
  VTabs, VTabsContent, VTabsList, VTabsTrigger,
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
  tabs: Array as PropType<ITab[]>,
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
            <!-- <router-link :to="item.to">
            {{ item.label }}
          </router-link> -->
            {{ item.label }}
            <template v-if="item.subTitle" #subtitle>
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
  </div>
</template>

<style lang="scss">
@use 'UiKit/styles/_variables.scss' as *;
.v-page-top-info-and-tabs {
  &__top-info {
    margin: 40px 0 45px;
  }
}
</style>
