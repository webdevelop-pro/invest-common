<script setup lang="ts">
import { VCardInfo } from 'UiKit/components/Base/VCard';
import { useDashboardTopInfoRight } from '../composables/useDashboardTopInfoRight';

const { isLoading, sliderData } = useDashboardTopInfoRight();
</script>

<template>
  <div class="DashboardTopInfoRight dashboard-top-info-right">
    <VCardInfo
      v-for="item in sliderData"
      :key="item.id"
      class="dashboard-top-info-right__item"
      min-width="172px"
      :amount="item?.currency"
      :unit="item?.coin"
      :title="item?.title"
      :loading="isLoading"
      :secondary-text="item?.secondaryText"
      :secondary-value="item?.secondaryValue"
      :value-props="{ amountClass: 'is--h2__title' }"
    />
  </div>
</template>

<style lang="scss">
.dashboard-top-info-right {
  display: flex;
  align-items: flex-start;
  gap: 20px;
  width: 100%;
  flex-wrap: wrap;

  @media screen and (width < $desktop-md) {
    gap: 8px;
  }

  &__item {
    flex: 1 0 0;
    width: 100%;
    min-width: 172px;
  }
}
</style>
