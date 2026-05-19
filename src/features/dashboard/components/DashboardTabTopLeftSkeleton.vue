<script setup lang="ts">
import VSkeleton from 'UiKit/components/Base/VSkeleton/VSkeleton.vue';
</script>

<template>
  <div class="DashboardTabTopLeftSkeleton dashboard-tab-top-left-skeleton">
    <VSkeleton
      class="dashboard-tab-top-left-skeleton__title"
      height="54px"
      width="180px"
    />
    <div class="dashboard-tab-top-left-skeleton__text">
      <VSkeleton height="36px" />
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
