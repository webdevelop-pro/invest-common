<script setup lang="ts">
import DashboardTabsTopInfo from 'InvestCommon/features/dashboard/components/DashboardTabsTopInfo.vue';

const INFO = {
  title: 'Overview',
  subTitle: undefined,
  text: 'An overview of your account, portfolio and recent activity.',
} as const;
</script>

<template>
  <DashboardTabsTopInfo
    :title="INFO.title"
    :sub-title="INFO.subTitle"
    :text="INFO.text"
    class="DashboardSummaryTopLeft dashboard-summary-top-left"
  />
</template>
