<script setup lang="ts">
import { computed, type Component } from 'vue';
import { DashboardTabTypes } from '../utils';

type DashboardPageHeaderLeftProps = {
  activeTab: DashboardTabTypes;
  tabTopLeftComponents: Record<DashboardTabTypes, Component>;
};

const props = defineProps<DashboardPageHeaderLeftProps>();

const currentTopLeftComponent = computed(() => (
  props.tabTopLeftComponents[props.activeTab]
  ?? props.tabTopLeftComponents[DashboardTabTypes.portfolio]
));
</script>

<template>
  <component
    :is="currentTopLeftComponent"
    class="dashboard-page-header-left"
  />
</template>

<style lang="scss">
.dashboard-page-header-left {
  width: 100%;
  min-width: 0;
}
</style>
