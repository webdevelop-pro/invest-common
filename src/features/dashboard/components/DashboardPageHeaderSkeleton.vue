<script setup lang="ts">
import VSkeleton from 'UiKit/components/Base/VSkeleton/VSkeleton.vue';
</script>

<template>
  <section class="DashboardPageHeaderSkeleton dashboard-page-header-skeleton">
    <div class="dashboard-page-header-skeleton__info">
      <VSkeleton
        class="dashboard-page-header-skeleton__title"
        height="32px"
        width="220px"
      />
      <VSkeleton
        class="dashboard-page-header-skeleton__profile"
        height="48px"
      />
      <div class="dashboard-page-header-skeleton__status-list">
        <div class="dashboard-page-header-skeleton__status-row">
          <VSkeleton
            class="dashboard-page-header-skeleton__status-label"
            height="16px"
            width="170px"
          />
          <VSkeleton
            class="dashboard-page-header-skeleton__status-chip"
            height="24px"
            width="110px"
          />
        </div>
        <div class="dashboard-page-header-skeleton__status-row">
          <VSkeleton
            class="dashboard-page-header-skeleton__status-label"
            height="16px"
            width="190px"
          />
          <VSkeleton
            class="dashboard-page-header-skeleton__status-chip"
            height="24px"
            width="120px"
          />
        </div>
      </div>
    </div>

    <div class="dashboard-page-header-skeleton__aside">
      <VSkeleton
        class="dashboard-page-header-skeleton__aside-card"
        height="152px"
      />
    </div>
  </section>
</template>

<style lang="scss">
.dashboard-page-header-skeleton {
  display: grid;
  grid-template-columns: minmax(0, 300px) minmax(0, 1fr);
  gap: 32px 80px;
  align-items: center;

  @media screen and (max-width: $desktop-md) {
    grid-template-columns: minmax(0, 1fr);
    gap: 24px;
  }

  &__info,
  &__aside {
    width: 100%;
    min-width: 0;
  }

  &__info {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }

  &__title,
  &__profile,
  &__aside-card {
    display: block;
    width: 100%;
  }

  &__profile {
    max-width: 420px;
  }

  &__status-list {
    display: flex;
    flex-direction: column;
    gap: 8px;
    width: 100%;
    max-width: 420px;
  }

  &__status-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    width: 100%;

    @media screen and (max-width: $mobile-xs) {
      flex-wrap: wrap;
    }
  }

  &__status-label,
  &__status-chip {
    display: block;
  }
}
</style>
