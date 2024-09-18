<script setup lang="ts">
import { computed } from 'vue';

const props = withDefaults(defineProps<{
  filterResults?: number;
  totalLength?: number;
  showFilterPagination?: boolean;
}>(), {
  filterResults: 0,
  totalLength: 0,
});

const showFilterResultsNumber = computed(() => (
  props.showFilterPagination && props.filterResults > 0));
const showFilterNoResultsMessage = computed(() => (
  props.showFilterPagination && props.filterResults === 0));
const resultText = computed(() => {
  if (props.filterResults === 1) return 'result';
  return 'results';
});
</script>

<template>
  <div
    v-if="showFilterPagination"
    class="FilterPagination filter-pagination"
  >
    <div
      v-if="showFilterResultsNumber"
      class="filter-pagination__filter-pagination is--small"
    >
      {{ filterResults }} {{ resultText }} of {{ totalLength }}
    </div>
    <div
      v-if="showFilterNoResultsMessage"
      class="filter-pagination__filter-pagination is--small"
    >
      No results
    </div>
  </div>
</template>

<style lang="scss">
.filter-pagination {
  flex-shrink: 0;

  &__filter-pagination {
    color: $gray-60;
    flex-shrink: 0;
    min-width: 79.6px;
  }
}
</style>
