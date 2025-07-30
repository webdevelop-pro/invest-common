<script setup lang="ts">
import VTableDocuments from 'InvestCommon/shared/components/VTableDocuments.vue';
import { useInvestmentDocuments } from 'InvestCommon/features/investment/components/logic/useInvestmentDocuments';

const props = defineProps({
  investmentId: {
    type: String,
    required: true,
  },
});

const {
  folders,
  filesWithSubscription,
  tableHeader,
  loadingDocId,
  loadingTable,
  onDocumentClick,
} = useInvestmentDocuments({
  investmentId: props.investmentId,
});
</script>

<template>
  <div class="InvestmentDocuments investment-documents">
    <h1 class="investment-documents__title is--h2__title">
      Investment Documents
    </h1>
    <VTableDocuments
      :folders="folders"
      :files="filesWithSubscription"
      :table-header="tableHeader"
      :loading-document-id="loadingDocId"
      :loading-table="loadingTable"
      with-download
      show-pagination
      @row-click="onDocumentClick"
    />
  </div>
</template>

<style lang="scss">
.investment-documents {
  $root: &;

  &__title {
    color: $black;
    margin-bottom: 24px;
  }

  &__toolbar {
    display: flex;
    align-items: center;
    gap: 20px;
    margin-bottom: 19px;
    flex-wrap: wrap;
  }

  &__table-header {
    color: $gray-60;
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
