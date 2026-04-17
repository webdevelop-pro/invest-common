<script setup lang="ts">
import { urlBlogSingle } from 'InvestCommon/domain/config/links';
import DashboardTabsTopInfo from 'InvestCommon/features/dashboard/components/DashboardTabsTopInfo.vue';
import { PostLinkTypes } from 'InvestCommon/data/blog/blog.types';

const INFO = {
  title: 'Portfolio',
  subTitle: 'Your holdings and belongings',
  text: `
    One of the most important things to consider when creating a portfolio is your personal risk tolerance.
  `,
};
</script>

<template>
  <DashboardTabsTopInfo
    :title="INFO.title"
    :sub-title="INFO.subTitle"
    :text="INFO.text"
    class="DashboardPortfolioTopLeft dashboard-portfolio-top-left"
  />
</template>
