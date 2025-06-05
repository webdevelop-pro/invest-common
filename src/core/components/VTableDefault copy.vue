<script setup lang="ts">
import {
  VTable, VTableBody, VTableCell, VTableRow,
  VTableEmpty, VTableHead, VTableHeader,
} from 'UiKit/components/Base/VTable';
import { computed, PropType, TransitionGroup } from 'vue';
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
    <VTableBody>
      <TransitionGroup
        name="fade"
        :key="loading ? 'loading' : data.length > 0 ? 'data' : 'empty'"
      >
        <!-- Loading State -->
        <template v-if="loading">
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
        </template>
        <!-- Data Slot -->
        <template v-else-if="data && data.length > 0">
          <slot name="default" />
        </template>
        <!-- Empty State -->
        <VTableEmpty v-else-if="!loading && data.length === 0" key="empty" :colspan="headerLength">
          <slot name="empty">
            No data available.
          </slot>
        </VTableEmpty>
      </TransitionGroup>
    </VTableBody>
  </VTable>
</template>

<style lang="scss">
.v-table-default {
  &__content {
    position: relative;
    min-height: 100px;
    width: 100%;
  }
}

.fade-enter-active,
.fade-leave-active {
  transition: all 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
  position: absolute;
  width: 100%;
  transform: translateY(10px);
}

.fade-move {
  transition: transform 0.3s ease;
}
</style>
