<script setup lang="ts">
import { onBeforeMount } from 'vue';
import { useGlobalLoader } from 'UiKit/store/useGlobalLoader';
import env from 'InvestCommon/domain/config/env';

useGlobalLoader().show();


onBeforeMount(() => {
  useGlobalLoader().show();
  const dashboardBaseUrl = env.FRONTEND_URL_DASHBOARD;
  if (dashboardBaseUrl) {
    const { pathname, search, hash } = window.location;
    const needsDashboardPrefix = !pathname.startsWith('/dashboard');
    const preservedPath = `${needsDashboardPrefix ? '/dashboard' : ''}${pathname}${search}${hash}`;
    const targetUrl = new URL(preservedPath, dashboardBaseUrl).toString();
    window.location.replace(targetUrl);
  }
  // useGlobalLoader().hide();
});
</script>

<template>
  <div class="ViewError404 view-404" />
</template>

<style lang="scss">
.view404 {
  min-height: 100vh;
}
</style>
