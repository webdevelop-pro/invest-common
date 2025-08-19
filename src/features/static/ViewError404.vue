<script setup lang="ts">
import { onBeforeMount } from 'vue';
import { useGlobalLoader } from 'UiKit/store/useGlobalLoader';


useGlobalLoader().show();

onBeforeMount(() => {
  useGlobalLoader().show();
  window.location.reload();
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
