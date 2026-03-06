<script setup lang="ts">
import VSkeleton from 'UiKit/components/Base/VSkeleton/VSkeleton.vue';
</script>

<template>
  <section class="DashboardTabSkeleton dashboard-tab-skeleton">
    <div class="dashboard-tab-skeleton__top-info">
      <div class="dashboard-tab-skeleton__title-wrap">
        <VSkeleton
          class="dashboard-tab-skeleton__title"
          height="28px"
          width="220px"
        />
      </div>
      <div class="dashboard-tab-skeleton__text">
        <VSkeleton
          class="dashboard-tab-skeleton__text-line"
          height="14px"
        />
        <VSkeleton
          class="dashboard-tab-skeleton__text-line"
          height="14px"
          width="80%"
        />
      </div>
    </div>

    <div class="dashboard-tab-skeleton__body">
      <VSkeleton class="dashboard-tab-skeleton__line" />
      <VSkeleton class="dashboard-tab-skeleton__line" />
      <VSkeleton class="dashboard-tab-skeleton__line" />
    </div>
  </section>
</template>

<style lang="scss">
.dashboard-tab-skeleton {
  padding: 24px 20px;

  @include media-lte(tablet) {
    padding: 16px 15px;
  }

  &__top-info {
    display: flex;
    flex-direction: column;
    gap: 8px;
    margin-bottom: 24px;
  }

  &__title-wrap {
    max-width: 260px;
  }

  &__title {
    display: block;
  }

  &__text {
    display: flex;
    flex-direction: column;
    gap: 6px;
  }

  &__text-line {
    display: block;
  }

  &__body {
    display: flex;
    flex-direction: column;
    gap: 10px;
  }

  &__line {
    height: 14px;
  }
}
</style>

