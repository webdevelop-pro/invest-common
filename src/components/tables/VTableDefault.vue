<script setup lang="ts">
import {
  VTable, VTableBody, VTableCell, VTableRow,
  VTableEmpty, VTableHead, VTableHeader,
} from 'UiKit/components/Base/VTable';
import { PropType } from 'vue';
import VSkeleton from 'UiKit/components/Base/VSkeleton/VSkeleton.vue';

interface IHead {
  text?: string;
  class?: string;
}

defineProps({
  header: Array as PropType<IHead[]>,
  data: Array,
  loading: Boolean,
  size: String as PropType<'large' | 'regular' | 'small'>,
});

</script>

<template>
  <VTable
    :size="size"
    class="VTableDefault v-table-default"
  >
    <VTableHeader v-if="header">
      <VTableRow>
        <VTableHead
          v-for="(head, headInd) in header"
          :key="headInd"
          :class="head.class"
        >
          {{ head.text }}
        </VTableHead>
      </VTableRow>
    </VTableHeader>
    <VTableBody v-if="loading">
      <VTableRow>
        <VTableCell
          :colspan="header?.length"
        >
          <VSkeleton
            height="26px"
            width="100%"
          />
        </VTableCell>
      </VTableRow>
    </VTableBody>
    <VTableBody v-else-if="data && data.length > 0">
      <slot />
    </VTableBody>
    <VTableBody v-else>
      <VTableEmpty :colspan="header?.length">
        <slot name="empty" />
      </VTableEmpty>
    </VTableBody>
  </VTable>
</template>
