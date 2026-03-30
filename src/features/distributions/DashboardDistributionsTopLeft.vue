<script setup lang="ts">
import DashboardTabsTopInfo from 'InvestCommon/features/dashboard/components/DashboardTabsTopInfo.vue';

const INFO = {
  title: 'Your Total Assets',
  subTitle: undefined,
  text: undefined,
} as const;
</script>

<template>
  <DashboardTabsTopInfo
    :title="INFO.title"
    :sub-title="INFO.subTitle"
    :text="INFO.text"
    class="DashboardDistributionsTopLeft dashboard-distributions-top-left"
  />
</template>
