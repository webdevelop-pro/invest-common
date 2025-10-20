<script setup lang="ts">
import VShadcnChartDonut from 'UiKit/components/VCharts/VShadcnChartDonut/VShadcnChartDonut.vue';
import { VCard, VCardContent } from 'UiKit/components/Base/VCard';
import CardChartSideInfo from './CardChartSideInfo.vue';
import VSkeleton from 'UiKit/components/Base/VSkeleton/VSkeleton.vue';

export interface DonutDatum { name: string; percent: number }
export interface SideItem { label: string; amount?: number; percent?: number; color?: string }

const props = defineProps<{
  title: string;
  subtitle?: string;
  loading?: boolean;
  data: DonutDatum[];
  colors: string[];
  sideItems: SideItem[];
  showAmount?: boolean;
  showPercent?: boolean;
  valueFormatter?: (v: number) => string;
  percentFormatter?: (v: number) => string;
  className?: string;
  ariaLabel?: string;
  isLoading?: boolean;
}>();

const valueFormatter = (tick: number) => (props.valueFormatter ? props.valueFormatter(tick) : `${Math.round(Number(tick || 0))}%`);
</script>

<template>
  <VCard
    :class="['CardDonutUnified card-donut-unified', 'is--card', props.className]"
    :aria-label="props.ariaLabel || props.title"
  >
    <div
      v-if="props.loading"
      class="card-donut-unified__status is--small"
    >
      Loading…
    </div>
    <VCardContent
      v-else
      class="card-donut-unified__content"
    >
      <h3
        v-if="title"
        class="v-shadcn-chart-donut__title"
      >
        {{ title }}
      </h3>
      <p v-if="subtitle">
        {{ subtitle }}
      </p>
      <div 
        class="card-donut-unified__grid"
        :class="{ 'is--single': props.sideItems.length === 0 }"
      >
        <VSkeleton
          v-if="isLoading"
          height="100px"
          width="100%"
        />
        <VShadcnChartDonut
          v-else
          :data="props.data"
          index="name"
          category="percent"
          :colors="props.colors"
          :value-formatter="valueFormatter"
          class="card-donut-unified__chart"
        >
          <template #no-data>
            <slot name="no-data">
              No data to display
            </slot>
          </template>
        </VShadcnChartDonut>
        <CardChartSideInfo
          v-if="props.sideItems.length > 0"
          :items="props.sideItems"
          :show-amount="props.showAmount !== false"
          :show-percent="props.showPercent !== false"
          :percent-formatter="props.percentFormatter || ((v: number) => `${Math.round(Number(v || 0))}%`)"
        />
      </div>
    </VCardContent>
  </VCard>
</template>

<style lang="scss">
.card-donut-unified {
  padding: 20px;

  &__content {
    display: flex;
    flex-direction: column;
  }

  &__grid {
    display: grid;
    grid-template-columns: 1.2fr 0.8fr;
    gap: 16px;
    align-items: stretch;
    flex: 1 1 auto;

    @media screen and (max-width: $desktop) {
      grid-template-columns: 1fr;
    }

    &.is--single {
      display: block;
      grid-template-columns: none;
    }
  }

  &__chart {
    height: 100%;
  }

  .unovis-single-container {
    width: 80%;
    margin: 10px auto 0;

    @media screen and (max-width: $tablet) {
        width: 100%;
    }
  }
}
</style>


