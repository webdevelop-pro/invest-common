<script setup lang="ts">
import { defineAsyncComponent, hydrateOnVisible, onBeforeMount, ref } from 'vue';
import { useGlobalLoader } from 'UiKit/store/useGlobalLoader';

const shouldHydrate = ref(false);

useGlobalLoader().toggle(true);

onBeforeMount(() => {
  useGlobalLoader().toggle(true);
  const currentUrl = window.location.pathname;
  
  // Check if current URL contains /dashboard
  const hasDashboardInCurrent = currentUrl.includes('/dashboard');
  const hadDashboardInPrevious = document.referrer.includes('/dashboard');
  console.log('onBeforeMount', document.referrer);

  
  // If current URL has dashboard, reload once
  if (hasDashboardInCurrent && !hadDashboardInPrevious) {
    window.location.reload();
  } else {
    // Only hydrate if no reload is needed
    shouldHydrate.value = true;
  }
});

const VErrorPageNotFound404 = defineAsyncComponent({
  loader: () => import('UiKit/components/VPage/VErrorPage/VErrorPageNotFound404.vue'),
  hydrate: shouldHydrate.value ? hydrateOnVisible() : undefined,
});
</script>

<template>
  <div class="ViewError404 view-404">
    <VErrorPageNotFound404 />
  </div>
</template>

<style lang="scss">
.view404 {
  min-height: 100vh;
}
</style>
