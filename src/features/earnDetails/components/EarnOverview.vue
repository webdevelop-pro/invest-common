<script setup lang="ts">
import VSkeleton from 'UiKit/components/Base/VSkeleton/VSkeleton.vue';
import VShadcnChartArea from 'UiKit/components/VCharts/VShadcnChartArea/VShadcnChartArea.vue';
import type { InfoDataItem } from 'InvestCommon/data/3dParty/formatter/earnDetail.formatter';
import { useEarnOverview, type OverviewSection } from './composables/useEarnOverview';

interface Props {
  sections?: OverviewSection[];
}

const props = withDefaults(defineProps<Props>(), {
  sections: () => [],
});

const { isEmpty, isChartSection, getYFormatter } = useEarnOverview(props);
</script>

<template>
  <div class="EarnOverview earn-overview">
    <div class="earn-overview__content">
      <template v-if="!isEmpty">
        <section
          v-for="(section, index) in props.sections"
          :key="`${section.title}-${index}`"
          :class="[
            'earn-overview__section',
            { 'earn-overview__section--chart': isChartSection(section) }
          ]"
        >
          <h3 class="earn-overview__title is--h4__title">
            {{ section.title }}
          </h3>
          
          <!-- Chart section -->
          <template v-if="isChartSection(section) && section.options">
            <VSkeleton
              v-if="section.loading || section.data.length === 0"
              height="300px"
              width="100%"
            />
            <VShadcnChartArea
              v-else-if="section.options"
              :data="section.data as Record<string, any>[]"
              :categories="section.options.categories"
              :index="section.options.index"
              :colors="section.options.colors"
              :show-legend="section.options.showLegend"
              :y-formatter="getYFormatter(section)"
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
            <dl
              v-else
              class="earn-overview__info-wrap"
            >
              <div
                v-for="(item, itemIndex) in (section.data as InfoDataItem[])"
                :key="`${section.title}-${item.text}-${itemIndex}`"
                class="earn-overview__info-item"
              >
                <dt class="earn-overview__info-text is--small-2">
                  {{ item.text }}
                </dt>
                <dd class="earn-overview__info-value-wrap">
                  <VSkeleton
                    v-if="section.loading"
                    height="18px"
                    width="60px"
                  />
                  <template v-else>
                    <div
                      v-if="item.links && item.links.length > 0"
                      class="earn-overview__info-links"
                    >
                      <a
                        v-for="(link, linkIndex) in item.links"
                        :key="`${item.text}-link-${linkIndex}`"
                        :href="link"
                        target="_blank"
                        rel="noopener noreferrer"
                        class="earn-overview__info-value is--small is--link-2"
                      >
                        {{ link }}
                        <span
                          v-if="linkIndex < item.links.length - 1"
                          class="earn-overview__info-link-separator"
                          aria-hidden="true"
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
                  </template>
                </dd>
              </div>
            </dl>
          </template>
        </section>
      </template>
    </div>
  </div>
</template>

<style lang="scss">
.earn-overview {
  &__content {
    max-width: 1200px;
  }

  &__section {
    margin-bottom: 40px;

    @media screen and (width < $tablet) {
      margin-bottom: 30px;
    }

    &--chart {
      margin-bottom: 60px;

      @media screen and (width < $tablet) {
        margin-bottom: 30px;
      }
    }

    &:last-child {
      margin-bottom: 0;
    }
  }

  &__chart {
    margin-top: 24px;
  }

  &__title {
    margin-bottom: 24px;
    color: $black;

    @media screen and (width < $tablet) {
      margin-bottom: 16px;
    }
  }

  &__info-wrap {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 16px;
    border-top: 1px solid $gray-20;
    padding-top: 24px;

    @media screen and (max-width: $tablet) {
      grid-template-columns: 1fr;
    }
  }

  &__info-item {
    display: flex;
    gap: 12px;
    align-items: flex-start;
  }

  &__info-text {
    color: $gray-70;
    min-width: 120px;
    flex-shrink: 0;
  }

  &__info-value-wrap {
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: 8px;
    flex: 1;
  }

  &__info-value {
    overflow-wrap: break-word;
  }

  &__info-links {
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: 4px;
  }

  &__info-link-separator {
    color: $gray-60;
  }
}
</style>

