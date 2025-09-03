<script setup lang="ts">
import { computed, PropType } from 'vue';
import VButton from 'UiKit/components/Base/VButton/VButton.vue';
import VFormInputSearch from 'UiKit/components/Base/VForm/VFormInputSearch.vue';
import VFilter, { IVFilter } from 'UiKit/components/VFilter/VFilter.vue';
import download from 'UiKit/assets/images/download.svg';
import FilterPagination from 'InvestCommon/shared/components/VFilterPagination.vue';

const props = defineProps({
  totalResultsLength: Number,
  filterResultsLength: Number,
  filterItems: Array as PropType<IVFilter[]>,
});

const emit = defineEmits(['filterItems']);

const totalResults = computed(() => props.totalResultsLength || 0);
const isActiveToolbar = computed(() => totalResults.value > 0);
const filterResults = computed(() => (props.filterResultsLength || 0));
const search = defineModel<string>();

const onApplyFilter = (items: IVFilter[]) => {
  emit('filterItems', items);
};
</script>

<template>
  <div class="VTableToolbar v-table-toolbar">
    <div class="v-table-toolbar__toolbar-left">
      <div
        class="v-table-toolbar__search"
      >
        <VFormInputSearch
          v-model="search"
          :disabled="!isActiveToolbar"
          size="small"
        />
      </div>
      <VFilter
        :items="filterItems"
        :disabled="!isActiveToolbar"
        class="v-table-toolbar__filter"
        @apply="onApplyFilter"
      />
      <FilterPagination
        :show-filter-pagination="Boolean(totalResults && (totalResults > 0))"
        :filter-results="filterResults"
        :total-length="totalResults"
      />
    </div>
    <VButton
      v-show="false"
      size="small"
      :disabled="!isActiveToolbar"
      variant="outlined"
      class="v-table-toolbar__export"
    >
      <download
        alt="download icon"
        class="v-table-toolbar__export-icon"
      />
      Export
    </VButton>
  </div>
</template>

<style lang="scss">
@use 'UiKit/styles/_variables.scss' as *;

.v-table-toolbar {
  $root: &;

  display: flex;
  padding-top: 16px;
  padding-bottom: 12px;
  align-items: center;
  gap: 8px;
  align-self: stretch;
  justify-content: space-between;

  @media screen and (max-width: $tablet){
    flex-direction: column;
  }

  &__table {
    margin-top: 40px;
  }

  &__tablet-link {
    text-transform: uppercase;
    border-bottom: 1px dotted $primary;
    color: $black;
    transition: all .3s ease;

    &:hover {
      color: $primary;
      border-color: transparent;
    }
  }

  &__toolbar {
    display: flex;
    padding-top: 16px;
    padding-bottom: 12px;
    align-items: center;
    gap: 8px;
    align-self: stretch;
    justify-content: space-between;
  }

  &__table-header {
    display: flex;
    align-items: flex-start;
    align-self: stretch;
    width: 100%;
    color: $gray-60;
    font-size: 14px;
    font-style: normal;
    font-weight: 800;
    line-height: 21px;
    padding-right: 80px;
  }

  &__toolbar-left {
    display: flex;
    gap: 8px;
    align-items: center;
    width: 100%;
    flex-wrap: wrap;
    // @media screen and (max-width: $tablet){
    //   flex-direction: column;
    // }
  }

  &__filter {
    --v-filter-dropdown-min-width: 250px
  }

  &__export-icon {
    width: 16px;
  }

  &__search {
    width: 34.5%;

    @media screen and (max-width: $desktop){
      width: 50%;
    }

    @media screen and (max-width: $tablet){
      width: 100%;
    }
  }

  &__export {
    @media screen and (max-width: $tablet){
      align-self: flex-end;
    }
  }
}
</style>
