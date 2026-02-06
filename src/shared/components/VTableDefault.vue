<script setup lang="ts">
import {
  VTable, VTableBody, VTableCell, VTableRow,
  VTableEmpty, VTableHead, VTableHeader,
} from 'UiKit/components/Base/VTable';
import { computed, ref } from 'vue';
import { useIntersectionObserver } from '@vueuse/core';
import VSkeleton from 'UiKit/components/Base/VSkeleton/VSkeleton.vue';

interface IHead {
  text?: string;
  class?: string;
}

const props = withDefaults(
  defineProps<{
    header?: IHead[];
    data: unknown[];
    loading?: boolean;
    loadingRowLength?: number;
    size?: 'large' | 'regular' | 'small';
    colspan?: number;
    infiniteScroll?: boolean;
    infiniteScrollRootMargin?: string;
    infiniteScrollDisabled?: boolean;
  }>(),
  {
    infiniteScroll: false,
    infiniteScrollRootMargin: '100px',
    infiniteScrollDisabled: false,
  },
);

const emit = defineEmits<{
  'load-more': [];
}>();

const loadingRowLength = computed(() => props.loadingRowLength ?? 1);
const headerLength = computed(() => props.colspan ?? (props.header?.length || 0));
const isEmpty = computed(() => !props.loading && props.data.length === 0);

const sentinel = ref<HTMLElement | null>(null);

useIntersectionObserver(
  sentinel,
  ([{ isIntersecting }]) => {
    if (
      isIntersecting &&
      props.infiniteScroll &&
      !props.infiniteScrollDisabled &&
      !props.loading
    ) {
      emit('load-more');
    }
  },
  {
    rootMargin: props.infiniteScrollRootMargin,
  },
);
</script>

<template>
  <VTable
    :size="size"
    class="VTableDefault v-table-default"
    :class="{ 'is--empty': isEmpty }"
  >
    <VTableHeader v-if="headerLength > 0">
      <VTableRow>
        <VTableHead
          v-for="(head, headInd) in header"
          :key="head.text ?? headInd"
          :class="head.class"
          scope="col"
        >
          {{ head.text }}
        </VTableHead>
      </VTableRow>
    </VTableHeader>
    <!-- Loading State -->
    <VTableBody
      v-show="loading"
      key="loading"
    >
      <template
        v-for="index in loadingRowLength"
        :key="`loading-${index}`"
      >
        <slot name="loading">
          <VTableRow>
            <VTableCell
              v-for="skeletonItem in headerLength"
              :key="`loading-cell-${skeletonItem}`"
            >
              <VSkeleton
                height="26px"
                width="100%"
              />
            </VTableCell>
          </VTableRow>
        </slot>
      </template>
    </VTableBody>
    <!-- Data Slot -->
    <VTableBody
      v-show="!loading && data && (data.length > 0)"
      key="data"
    >
      <slot name="default" />
    </VTableBody>
    <!-- Empty State -->
    <VTableBody
      v-show="!loading && (data.length === 0)"
      key="empty"
    >
      <VTableEmpty :colspan="headerLength">
        <slot name="empty">
          No data available.
        </slot>
      </VTableEmpty>
    </VTableBody>
  </VTable>
  <div
    v-if="infiniteScroll"
    ref="sentinel"
    class="v-table-default__sentinel"
    aria-hidden="true"
  />
</template>

<style lang="scss" scoped>
@use 'UiKit/styles/_variables.scss' as *;

.fade-enter-active,
.fade-leave-active {
  transition: all 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
  position: absolute;
  width: 100%;
  transform: translateY(0);
}

.fade-move {
  transition: transform 0.3s ease;
}

.v-table-default__sentinel {
  height: 1px;
  width: 100%;
  pointer-events: none;
}

/* Hide header on mobile when table is empty */
@media screen and (max-width: $tablet) {
  .VTableDefault.is--empty :deep(.v-table-header) {
    display: none;
  }
}
</style>
