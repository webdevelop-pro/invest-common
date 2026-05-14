<script setup lang="ts">
import VSkeleton from 'UiKit/components/Base/VSkeleton/VSkeleton.vue';
</script>

<template>
  <div class="DashboardTabTopLeftSkeleton dashboard-tab-top-left-skeleton">
    <VSkeleton
      class="dashboard-tab-top-left-skeleton__title"
      height="36px"
      width="180px"
    />
    <div class="dashboard-tab-top-left-skeleton__text">
      <VSkeleton height="16px" />
      <VSkeleton height="16px" width="80%" />
    </div>
  </div>
</template>

<style lang="scss">
.dashboard-tab-top-left-skeleton {
  display: flex;
  flex-direction: column;
  gap: 8px;
  min-height: 84px;

  &__title {
    display: block;
  }

  &__text {
    display: flex;
    flex-direction: column;
    gap: 6px;
  }
}
</style>
