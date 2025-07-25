<script setup lang="ts">
import VFormInputSearch from 'UiKit/components/Base/VForm/VFormInputSearch.vue';
import {
  computed, ref, watch, PropType,
} from 'vue';
import VTableDefault from 'InvestCommon/shared/components/VTableDefault.vue';
import FilterPagination from 'InvestCommon/components/VFilterPagination.vue';
import { VTabs, VTabsList, VTabsTrigger } from 'UiKit/components/Base/VTabs';
import { IFilerItemFormatted } from 'InvestCommon/data/filer/filer.type';
import VTableDocumentItem from 'InvestCommon/features/filer/VTableDocumentItem.vue';

// Generalized table header type
interface ITableHeader {
  text: string;
  class?: string;
  value?: string;
}

const props = defineProps({
  folders: {
    type: Array as PropType<string[]>,
    default: () => [],
  },
  files: {
    type: Array as PropType<IFilerItemFormatted[]>,
    default: () => [],
  },
  tableHeader: {
    type: Array as PropType<ITableHeader[]>,
    default: () => [],
  },
  loadingDocumentId: Number,
  loadingTable: Boolean,
});

const emit = defineEmits<{(e: 'row-click', item: IFilerItemFormatted): void;}>();

const tabs = computed(() => ([
  {
    value: 'all',
    label: 'All',
  },
  ...((props.folders ?? []).map((item) => ({
    value: item,
    label: item,
  }))),
]));
const currentTab = ref(tabs.value[0].value);
const search = ref('');

const documentList = computed(() => props.files ?? []);
const documentListLength = computed(() => documentList.value.length);

const tabsData = computed(() => {
  if (currentTab.value === 'all') return documentList.value;
  return documentList.value.filter((item) => (
    (item['object-type']?.toLowerCase?.() ?? '').includes(currentTab.value.toLowerCase())
  ));
});

const searchData = computed(() => {
  const searchValue = search.value ? String(search.value).toLowerCase() : '';
  if (searchValue) {
    return tabsData.value.filter((item) => (
      (item.name?.toLowerCase?.() ?? '').includes(searchValue)
    ));
  }
  return tabsData.value;
});

const filterResults = computed(() => searchData.value.length);
const showSearch = computed(() => filterResults.value > 0);
const showPagination = computed(() => (
  Boolean(documentListLength.value && (documentListLength.value > 0)) && (filterResults.value > 0)
));

const clearSearch = () => {
  search.value = '';
};

const onDocumentClick = (doc: IFilerItemFormatted) => {
  emit('row-click', doc);
};

watch(() => currentTab.value, () => {
  clearSearch();
});
</script>

<template>
  <div class="VTableDocuments investment-documents">
    <div class="investment-documents__toolbar">
      <VTabs
        v-model="currentTab"
        :default-value="tabs[0].value"
        variant="secondary"
        class="investment-documents__tabs"
      >
        <VTabsList
          variant="secondary"
        >
          <VTabsTrigger
            v-for="(tab, tabIndex) in tabs"
            :key="tabIndex"
            :value="tab.value"
            variant="secondary"
          >
            {{ tab.label }}
          </VTabsTrigger>
        </VTabsList>
      </VTabs>
      <VFormInputSearch
        v-model="search"
        :disabled="!showSearch"
        size="small"
        class="investment-documents__search"
      />
      <FilterPagination
        :show-filter-pagination="showPagination"
        :filter-results="filterResults"
        :total-length="documentListLength"
      />
    </div>
    <VTableDefault
      class="investment-documents__table"
      :data="searchData"
      :header="tableHeader"
      :loading="loadingTable"
    >
      <VTableDocumentItem
        v-for="item in searchData"
        :key="item.name"
        :search="search"
        :data="item"
        :loading="loadingDocumentId === item.id"
        with-download
        @click="onDocumentClick"
      />
      <template #empty>
        You have no documents in this category.
      </template>
    </VTableDefault>
  </div>
</template>

<style lang="scss">
.investment-documents {
  $root: &;

  &__toolbar {
    display: flex;
    align-items: center;
    gap: 20px;
    margin-bottom: 19px;
    flex-wrap: wrap;
  }

  &__search {
    @media screen and (max-width: $tablet){
      width: 100%;
    }
  }

  &__tabs {
    @media screen and (max-width: $tablet){
      width: 100%;
    }
  }
}
</style>
