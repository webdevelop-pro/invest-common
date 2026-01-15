<script setup lang="ts">
import { PropType } from 'vue';
import VSkeleton from 'UiKit/components/Base/VSkeleton/VSkeleton.vue';
import VShadcnChartArea from 'UiKit/components/VCharts/VShadcnChartArea/VShadcnChartArea.vue';
import type { InfoDataItem, ChartOptions } from 'InvestCommon/data/3dParty/formatter/earnDetail.formatter';

interface OverviewSection {
  title: string;
  data: any[];
  options?: ChartOptions;
  loading?: boolean;
}

const props = defineProps({
  sections: {
    type: Array as PropType<OverviewSection[]>,
    default: () => [],
  },
});

const isChartSection = (section: OverviewSection): boolean => {
  return 'options' in section && section.options !== undefined;
};

</script>

<template>
  <div class="EarnOverview earn-overview">
    <div class="earn-overview__content">
      <div
        v-for="(section, index) in props.sections"
        :key="index"
        :class="[
          'earn-overview__section',
          { 'earn-overview__section--chart': isChartSection(section) }
        ]"
      >
        <h3 class="earn-overview__title is--h4__title">
          {{ section.title }}
        </h3>
        
        <!-- Chart section -->
        <template v-if="isChartSection(section)">
          <VSkeleton
            v-if="section.loading || section.data.length === 0"
            height="300px"
            width="100%"
          />
          <VShadcnChartArea
            v-else
            :data="section.data as any"
            :categories="section.options!.categories as any"
            :index="section.options!.index as any"
            :colors="section.options!.colors"
            :show-legend="section.options!.showLegend"
            :y-formatter="section.options!.yFormatter"
            class="earn-overview__chart"
          />
        </template>
        
        <!-- Info section -->
        <template v-else>
          <VSkeleton
            v-if="section.loading && section.data.length === 0"
            height="200px"
            width="100%"
          />
          <div
            v-else
            class="earn-overview__info-wrap"
          >
            <div
              v-for="(item, itemIndex) in (section.data as InfoDataItem[])"
              :key="itemIndex"
              class="earn-overview__info-item"
            >
              <span class="earn-overview__info-text is--small-2">
                {{ item.text }}
              </span>
              <VSkeleton
                v-if="section.loading"
                height="18px"
                width="60px"
              />
              <div
                v-else-if="item.links && item.links.length > 0"
                class="earn-overview__info-links"
              >
                <a
                  v-for="(link, linkIndex) in item.links"
                  :key="linkIndex"
                  :href="link"
                  target="_blank"
                  rel="noopener noreferrer"
                  class="earn-overview__info-value is--small is--link-2"
                >
                  {{ link }}
                  <span
                    v-if="linkIndex < item.links!.length - 1"
                    class="earn-overview__info-link-separator"
                  >, </span>
                </a>
              </div>
              <a
                v-else-if="item.link"
                :href="item.link"
                target="_blank"
                rel="noopener noreferrer"
                class="earn-overview__info-value is--small is--link-2"
              >
                {{ item.value }}
              </a>
              <span
                v-else
                class="earn-overview__info-value is--small"
              >
                {{ item.value }}
              </span>
            </div>
          </div>
        </template>
      </div>
    </div>
  </div>
</template>

<style lang="scss">
.earn-overview {
  padding: 40px 0;

  &__content {
    max-width: 1200px;
  }

  &__section {
    margin-bottom: 40px;

    &--chart {
      margin-bottom: 60px;
    }
  }

  &__chart {
    margin-top: 24px;
  }

  &__title {
    margin-bottom: 24px;
    color: $black;
  }

  &__info-wrap {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 16px;
    border-top: 1px solid $gray-20;
    padding-top: 24px;

    @media screen and (max-width: $tablet){
      grid-template-columns: repeat(1, minmax(0, 1fr));
    }
  }

  &__info-item {
    display: flex;
    gap: 12px;
    align-items: center;
    text-align: initial;
  }

  &__info-text {
    color: $gray-70;
    min-width: 120px;
    text-align: initial;
  }
}
</style>

