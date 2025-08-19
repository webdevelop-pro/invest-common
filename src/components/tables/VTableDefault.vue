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
  loading: boolean;
  loadingRowLength?: number;
  size?: 'large' | 'regular' | 'small';
}>();

const loadingRowLength = computed(() => props.loadingRowLength ?? 1);
const headerLength = computed(() => props.header?.length || 0);
</script>

<template>
  <VTable
    :size="size"
    class="VTableDefault v-table-default"
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
    <VTableBody v-if="loading">
      <VTableRow
        v-for="index in loadingRowLength"
        :key="`loading-${index}`"
      >
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
    </VTableBody>
    <!-- Data Slot -->
    <VTableBody v-else-if="data && data.length > 0">
      <slot name="default" />
    </VTableBody>
    <!-- Empty State -->
    <VTableBody v-else>
      <VTableEmpty :colspan="headerLength">
        <slot name="empty">
          No data available.
        </slot>
      </VTableEmpty>
    </VTableBody>
  </VTable>
</template>
