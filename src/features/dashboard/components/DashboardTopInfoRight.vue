<script setup lang="ts">
import VSkeleton from 'UiKit/components/Base/VSkeleton/VSkeleton.vue';
import DashboardTopInfoCard from './DashboardTopInfoCard.vue';
import { useDashboardTopInfoRight } from '../composables/useDashboardTopInfoRight';

const { isLoading, sliderData } = useDashboardTopInfoRight();
</script>

<template>
  <div class="DashboardTopInfoRight dashboard-top-info-right">
    <template
      v-for="item in sliderData"
      :key="item.id"
    >
      <VSkeleton
        v-if="isLoading"
        height="54px"
        width="100px"
        class="dashboard-top-info-right__skeleton"
      />
      <DashboardTopInfoCard
        v-else
        :slide="item"
        class="dashboard-top-info-right__item"
      />
    </template>
  </div>
</template>

<style lang="scss">
.dashboard-top-info-right {
  display: flex;
  align-items: flex-start;
  gap: 20px;
  width: 100%;
  flex-wrap: wrap;
  
  @media screen and (width < $desktop-md){
    gap: 8px;
  }

  &__item {
    flex: 1 0 0;
    width: 100%;
    min-width: 172px;
  }

  &__skeleton {
    flex: 1 0 0;
    min-width: 172px;
  }
}
</style>
