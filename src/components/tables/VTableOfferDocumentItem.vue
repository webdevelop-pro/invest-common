<script setup lang="ts">
import { formatToFullDate } from 'InvestCommon/helpers/formatters/formatToDate';
import {
  PropType, computed, defineAsyncComponent, ref,
} from 'vue';
import { IInvestmentDocuments } from 'InvestCommon/types/api/invest';
import { useInvestmentsStore } from 'InvestCommon/store/useInvestments';
import { storeToRefs } from 'pinia';
import file from 'UiKit/assets/images/file.svg';
import { VTableCell, VTableRow } from 'UiKit/components/Base/VTable';

const VBadge = defineAsyncComponent({
  loader: () => import('UiKit/components/Base/VBadge/VBadge.vue'),
});

const investmentsStore = useInvestmentsStore();
const { getDocumentData, isGetDocumentLoading } = storeToRefs(investmentsStore);

const props = defineProps({
  data: Object as PropType<IInvestmentDocuments>,
  search: String,
});

const isLoading = ref(false);

const onDocumentClick = async () => {
  isLoading.value = true;
  window.open(props.data?.url, '_blank');
  isLoading.value = false;
};

const isNewTag = (date: string): boolean => {
  // Convert the input date string to a Date object
  const tagDate = new Date(date);

  // Get the current date
  const currentDate = new Date();

  // Calculate the difference in milliseconds between the current date and the tag date
  const differenceInMs = currentDate.getTime() - tagDate.getTime();

  // Convert the difference to days
  const differenceInDays = differenceInMs / (1000 * 3600 * 24);

  // If the difference is less than 2 days, return true, otherwise return false
  return differenceInDays < 2;
};

</script>
<template>
  <VTableRow
    class="VTableOfferDocumentItem v-table-offer-document-item"
    @click.stop="onDocumentClick"
  >
    <VTableCell>
      <div class="v-table-offer-document-item__name-wrap is--small-2 is--color-black">
        <file
          alt="file icon"
          class="v-table-offer-document-item__icon"
        />
        <div v-highlight="search">
          {{ data?.name }}
        </div>
      </div>
    </VTableCell>
    <VTableCell>
      <VBadge
        v-if="isNewTag(data.updated_at)"
        class="is--background-red-light"
      >
        New
      </VBadge>
    </VTableCell>
    <VTableCell class="v-table-offer-document-item__date-wrap is--small">
      {{ data?.updated_at ? formatToFullDate(new Date(data?.updated_at).toISOString()) : '' }}
    </VTableCell>
  </VTableRow>
</template>

<style lang="scss">
.v-table-offer-document-item {
  width: 100%;
  cursor: pointer !important;

  &__icon {
    width: 16px;
    height: 16px;
    color: $black;
    margin-right: 4px;
  }

  &__name-wrap {
    display: flex;
    align-items: center;
  }

  &__download-icon {
    width: 16px;
  }
}
</style>
