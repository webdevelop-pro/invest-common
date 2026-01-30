<script setup lang="ts">
import type { DashboardTopInfoRightCard } from '../composables/useDashboardTopInfoRight';

defineProps<{
  slide: DashboardTopInfoRightCard;
}>();
</script>

<template>
  <div class="DashboardTopInfoCard dashboard-top-info-card">
    <div class="dashboard-top-info-card__label is--h6__title">
      {{ slide?.title }}
    </div>
    <div class="dashboard-top-info-card__currency is--h2__title">
      {{ slide?.currency }}
      <span class="dashboard-top-info-card__coin is--small">
        {{ slide?.coin }}
      </span>
    </div>
    <div
      v-if="slide?.changeText"
      class="dashboard-top-info-card__change is--small"
      :class="slide?.changeClass"
    >
      {{ slide?.changeText }}
    </div>
  </div>
</template>

<style lang="scss">
.dashboard-top-info-card {
  display: flex;
  padding: 20px;
  flex-direction: column;
  align-items: flex-start;
  gap: 4px;
  flex: 1 0 0;
  width: 100%;
  min-width: 172px;
  background-color: #fff;
  box-shadow: $box-shadow-medium;
  border-radius: 2px;

  &__label {
    color: $gray-70;
  }

  &__currency {
    color: $black;
  }

  &__coin {
    margin-left: -8px;
  }

  &__change {
    color: $gray-60;
    visibility: hidden;

    &.is--positive {
      color: $secondary-dark;
    }

    &.is--negative {
      color: $red;
    }

    &.is--show {
      visibility: visible;
    }
  }
}
</style>
