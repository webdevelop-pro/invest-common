<script setup lang="ts">
import { computed } from 'vue';
import VSkeleton from 'UiKit/components/VSkeleton/VSkeleton.vue';

export interface IInfoSlot {
  title: string;
  text: string;
}
const props = withDefaults(defineProps<{
  title?: string;
  text?: string;
  size?: 'regular' | 'small';
  loading?: boolean;
}>(), {
  size: 'regular',
});
const isSizeSmall = computed(() => props.size === 'small');
</script>

<template>
  <div
    class="InfoSlot info-slot"
    :class="{ 'is--size-small': isSizeSmall }"
  >
    <slot>
      <span
        v-if="title"
        class="info-slot__title"
        :class="{ 'is--small-2': isSizeSmall, 'is--h6__title': !isSizeSmall }"
      >
        {{ title }}
      </span>
      <VSkeleton
        v-if="loading"
        height="26px"
        width="50%"
      />
      <span
        v-if="!loading && text"
        class="info-slot__text"
        :class="{ 'is--small': isSizeSmall, 'is--body': !isSizeSmall }"
      >
        {{ text }}
      </span>
    </slot>
  </div>
</template>

<style lang="scss">
.info-slot {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: flex-start;
  gap: 8px;
  flex: 1 0 0;
  padding: 16px;
  border-bottom: 1px solid $gray-20;
  width: 100%;

  &.is--size-small {
    padding: 12px;
    gap: 2px;
  }

  &:first-of-type {
    border-top: 1px solid $gray-20;
  }

  &__title {
    color: $gray-70;
  }
  &__text {
    color: $gray-80;
  }
}
</style>
