<script setup lang="ts">
import {
  VTable, VTableBody, VTableCell, VTableRow,
  VTableEmpty, VTableHead, VTableHeader,
} from 'UiKit/components/Base/VTable';
import { computed } from 'vue';
import VSkeleton from 'UiKit/components/Base/VSkeleton/VSkeleton.vue';

interface IHead {
  text?: string;
  class?: string;
}

const props = defineProps<{
  header?: IHead[];
  data: unknown[];
  loading?: boolean;
  loadingRowLength?: number;
  size?: 'large' | 'regular' | 'small';
  colspan?: number;
}>();

const loadingRowLength = computed(() => props.loadingRowLength ?? 1);
const headerLength = computed(() => props.colspan ?? (props.header?.length || 0));
const isEmpty = computed(() => !props.loading && props.data.length === 0);
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

/* Hide header on mobile when table is empty */
@media screen and (max-width: $tablet) {
  .VTableDefault.is--empty :deep(.v-table-header) {
    display: none;
  }
}
</style>
