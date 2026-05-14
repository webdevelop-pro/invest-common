<script setup lang="ts">
import { type Component } from 'vue';
import { DashboardTabTypes } from '../utils';

type DashboardPageHeaderLeftProps = {
  activeTab: DashboardTabTypes;
  tabTopLeftComponents: Record<DashboardTabTypes, Component>;
  loadedTopLeftTabs: DashboardTabTypes[];
};

defineProps<DashboardPageHeaderLeftProps>();
</script>

<template>
  <template
    v-for="(component, tabKey) in tabTopLeftComponents"
    :key="tabKey"
  >
    <component
      :is="component"
      v-if="loadedTopLeftTabs.includes(tabKey as DashboardTabTypes)"
      v-show="tabKey === activeTab"
      class="dashboard-page-header-left"
    />
  </template>
</template>

<style lang="scss">
.dashboard-page-header-left {
  width: 100%;
  min-width: 0;
}
</style>
