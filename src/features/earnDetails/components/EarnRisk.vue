<script setup lang="ts">
import VSkeleton from 'UiKit/components/Base/VSkeleton/VSkeleton.vue';
import VBadge from 'UiKit/components/Base/VBadge/VBadge.vue';
import type { RiskSection } from 'InvestCommon/data/3dParty/formatter/risk.formatter';
import { useEarnRisk } from './composables/useEarnRisk';

interface Props {
  formattedRiskData: RiskSection[];
  loading: boolean;
  ratingColorToCssColor: (ratingColor: string | undefined) => string;
}

const props = defineProps<Props>();

const { isEmpty, hasData } = useEarnRisk(props);
</script>

<template>
  <div class="EarnRisk earn-risk">
    <div class="earn-risk__content">
      <template v-if="hasData">
        <section
          v-for="(section, sectionIndex) in props.formattedRiskData"
          :key="`${section.title}-${sectionIndex}`"
          class="earn-risk__section"
        >
          <h3 class="earn-risk__title is--h4__title">
            {{ section.title }}
          </h3>
          <VSkeleton
            v-if="props.loading && section.items.length === 0"
            height="200px"
            width="100%"
          />
          <dl
            v-else
            class="earn-risk__info-wrap"
          >
            <div
              v-for="(item, itemIndex) in section.items"
              :key="`${section.title}-${item.label}-${itemIndex}`"
              class="earn-risk__info-item"
            >
              <dt class="earn-risk__info-text is--small-2">
                {{ item.label }}:
              </dt>
              <dd class="earn-risk__info-value-wrap">
                <VSkeleton
                  v-if="props.loading"
                  height="18px"
                  width="60px"
                />
                <template v-else>
                  <VBadge
                    v-if="item.rating"
                    :color="item.badgeColor"
                    size="small"
                  >
                    {{ item.rating }}
                  </VBadge>
                  <span
                    v-else
                    class="earn-risk__info-value is--small"
                  >
                    {{ item.value }}
                  </span>
                  <div
                    v-if="item.underlying && item.underlying.length > 0"
                    class="earn-risk__underlying is--small"
                  >
                    <template
                      v-for="(underlyingItem, underlyingIndex) in item.underlying"
                      :key="`${item.label}-underlying-${underlyingIndex}`"
                    >
                      <a
                        v-if="underlyingItem.link"
                        :href="underlyingItem.link"
                        target="_blank"
                        rel="noopener noreferrer"
                        class="earn-risk__underlying-link"
                        :style="{ color: props.ratingColorToCssColor(underlyingItem.color) }"
                      >
                        {{ underlyingItem.name }}
                      </a>
                      <span
                        v-else
                        class="earn-risk__underlying-name"
                        :style="{ color: props.ratingColorToCssColor(underlyingItem.color) }"
                      >
                        {{ underlyingItem.name }}
                      </span>
                      <span
                        v-if="underlyingIndex < item.underlying.length - 1"
                        class="earn-risk__underlying-separator"
                        aria-hidden="true"
                      >, </span>
                    </template>
                  </div>
                </template>
              </dd>
            </div>
          </dl>
        </section>
      </template>
      <div
        v-if="isEmpty"
        class="earn-risk__empty"
        role="status"
        aria-live="polite"
      >
        No risk data available
      </div>
    </div>
  </div>
</template>

<style lang="scss">
.earn-risk {
  &__content {
    max-width: 1200px;
  }

  &__section {
    margin-bottom: 40px;

    &:last-child {
      margin-bottom: 0;
    }
  }

  &__empty {
    padding: 40px 0;
    text-align: center;
    color: $gray-70;
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

  &__info-value {
    color: $black;
  }

  &__info-value-wrap {
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: 20px;
    flex: 1;
  }

  &__underlying {
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: 4px;
  }

  &__underlying-link {
    text-decoration: underline;
    transition: color 0.3s ease-in-out;

    &:hover {
      text-decoration: none;
      opacity: 0.8;
    }
  }

  &__underlying-name {
    color: inherit;
  }

  &__underlying-separator {
    color: $gray-60;
  }
}
</style>


