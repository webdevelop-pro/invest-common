<script setup lang="ts">
import VSkeleton from 'UiKit/components/Base/VSkeleton/VSkeleton.vue';
import VBadge from 'UiKit/components/Base/VBadge/VBadge.vue';
import type { RiskSection } from 'InvestCommon/data/3dParty/formatter/risk.formatter';

const props = defineProps<{
  formattedRiskData: RiskSection[];
  loading: boolean;
  ratingColorToCssColor: (ratingColor: string | undefined) => string;
}>();
</script>

<template>
  <div class="EarnRisk earn-risk">
    <div class="earn-risk__content">
      <div
        v-for="(section, sectionIndex) in props.formattedRiskData"
        :key="sectionIndex"
        class="earn-risk__section"
      >
        <h3 class="earn-risk__title is--h4__title">
          {{ section.title }}
        </h3>
        <VSkeleton
          v-if="loading && section.items.length === 0"
          height="200px"
          width="100%"
        />
        <div
          v-else
          class="earn-risk__info-wrap"
        >
          <div
            v-for="(item, itemIndex) in section.items"
            :key="itemIndex"
            class="earn-risk__info-item"
          >
            <span class="earn-risk__info-text is--small-2">
              {{ item.label }}:
            </span>
            <VSkeleton
              v-if="loading"
              height="18px"
              width="60px"
            />
            <div
              v-else
              class="earn-risk__info-value-wrap"
            >
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
                  :key="underlyingIndex"
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
                  >, </span>
                </template>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div
        v-if="!loading && props.formattedRiskData.length === 0"
        class="earn-risk__empty"
      >
        No risk data available
      </div>
    </div>
  </div>
</template>

<style lang="scss">
.earn-risk {
  padding: 40px 0;

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

  &__info-value {
    color: $black;
  }

  &__info-value-wrap {
    display: flex;
    align-items: center;
    gap: 20px;
  }

  &__underlying {
    display: flex;
    align-items: center;
    gap: 4px;
  }

  &__underlying-link {
    text-decoration: underline;
    transition: 0.3s all ease-in-out;

    &:hover {
      text-decoration: none;
    }
  }

  &__underlying-name {
    color: inherit;
  }
}
</style>


