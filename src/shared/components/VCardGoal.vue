<script setup lang="ts">
import { computed } from 'vue';
import { VCard, VCardContent, VCardHeader, VCardTitle } from 'UiKit/components/Base/VCard';
import VProgress from 'UiKit/components/Base/VProgress/VProgress.vue';

export interface GoalCardProps {
  title: string;
  subtitle?: string;
  currentAmount?: number;
  goalAmount?: number;
  monthsRemaining?: number;
  totalMonths?: number;
  currency?: string;
}

const props = withDefaults(defineProps<GoalCardProps>(), {
  currency: 'USD',
  monthsRemaining: 0,
  totalMonths: 0,
});

const monthsElapsed = computed(() => Math.max(0, props.totalMonths - props.monthsRemaining));

const progressPercentage = computed(() => {
  if (!props.totalMonths) return 0;
  return (monthsElapsed.value * 100) / props.totalMonths;
});

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: props.currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};
</script>

<template>
  <VCard
    class="InvestCommon v-card-goal is--card"
    variant="primary"
  >
    <VCardHeader v-if="title">
      <VCardTitle>
        {{ title }}
      </VCardTitle>
    </VCardHeader>
    
    <VCardContent class="v-card-goal__content">
      <div v-if="subtitle">
        <span class="is--color-gray-60">
          {{ subtitle }}
        </span>
      </div>
    
      <div
        v-if="currentAmount || goalAmount"
        class="v-card-goal__amount"
      >
        <span
          v-if="currentAmount"
          class="is--h4__title is--color-primary"
        >
          {{ formatCurrency(currentAmount) }}
        </span>
        <span
          v-if="goalAmount"
          class="is--color-gray-60"
        >
          Goal: {{ formatCurrency(goalAmount) }}
        </span>
      </div>
      
      <div class="v-card-goal__progress">
        <VProgress
          :model-value="progressPercentage"
          class="v-card-goal__progress-bar"
        >
          <template #top-start>
            <span class=" is--h5__title is--color-secondary-dark">
              {{ monthsElapsed }} months ({{ Math.round(progressPercentage) }}%)
            </span>
          </template>
          <template #top-end>
            <span class=" is--h5__title is--color-secondary-dark">
              {{ totalMonths }} months
            </span>
          </template>
        </VProgress>
      </div>
    </VCardContent>
  </VCard>
</template>

<style lang="scss">
.v-card-goal {
  flex-direction: column;
  padding: 20px;

  &__content {
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    gap: 16px;
    height: 100%;
  }

  &__amount {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  &__progress {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }
}
</style>
