<script setup lang="ts">
import DashboardTabsTopInfo from 'InvestCommon/features/dashboard/components/DashboardTabsTopInfo.vue';

const INFO = {
  title: 'Earn',
  subTitle: 'Yield opportunities',
  text: 'Discover earning opportunities and explore ways to grow your wealth and maximize returns. Explore Aave lending pools with the highest yields. Data provided by DefiLlama.',
} as const;
</script>

<template>
  <DashboardTabsTopInfo
    :title="INFO.title"
    :sub-title="INFO.subTitle"
    :text="INFO.text"
    class="DashboardEarnTopLeft dashboard-earn-top-left"
  />
</template>
