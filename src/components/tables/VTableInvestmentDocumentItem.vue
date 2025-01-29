<script setup lang="ts">
import { formatToFullDate } from 'InvestCommon/helpers/formatters/formatToDate';
import { PropType, computed, ref } from 'vue';
import VBadge from 'UiKit/components/Base/VBadge/VBadge.vue';
import VButton from 'UiKit/components/Base/VButton/VButton.vue';
import { IInvestmentDocuments } from 'InvestCommon/types/api/invest';
import { useInvestmentsStore } from 'InvestCommon/store/useInvestments';
import { useRouter } from 'vue-router';
import { storeToRefs } from 'pinia';
import file from 'UiKit/assets/images/file.svg';
import download from 'UiKit/assets/images/download.svg';
import { VTableCell, VTableRow } from 'UiKit/components/Base/VTable';

const investmentsStore = useInvestmentsStore();
const { getDocumentData, isGetDocumentLoading } = storeToRefs(investmentsStore);
const router = useRouter();

const props = defineProps({
  data: Object as PropType<IInvestmentDocuments>,
  search: String,
});

const isSubscriptionAgreement = computed(() => props.data?.name === 'Subscription Agreement');
const investmentID = computed(() => router.currentRoute.value.params.id);
const isLoading = ref(false);

const onDocumentClick = async () => {
  isLoading.value = true;
  let url = props.data?.url;

  if (isSubscriptionAgreement.value && investmentID.value) {
    await investmentsStore.getDocument(String(investmentID.value));
    url = getDocumentData.value;
  }

  window.open(url, '_blank');
  isLoading.value = false;
};

</script>
<template>
  <VTableRow
    class="VTableInvestmentDocumentItem v-table-investment-document-item"
    @click.stop="onDocumentClick"
  >
    <VTableCell>
      <div class="v-table-investment-document-item__name-wrap">
        <file
          alt="file icon"
          class="v-table-investment-document-item__icon"
        />
        <div v-highlight="search">
          {{ data?.name }}
        </div>
        <VBadge
          v-if="false"
          class="is--background-red-light"
        >
          New
        </VBadge>
      </div>
    </VTableCell>
    <VTableCell class="v-table-investment-document-item__date-wrap is--small">
      {{ data?.updated_at ? formatToFullDate(new Date(data?.updated_at).toISOString()) : '' }}
    </VTableCell>
    <VTableCell class="v-table-investment-document-item__download-wrap">
      <VButton
        size="small"
        variant="link"
        :loading="isGetDocumentLoading && isLoading"
        :disabled="isGetDocumentLoading && isLoading"
        @click.stop="onDocumentClick"
      >
        <download
          alt="file icon"
          class="v-table-investment-document-item__download-icon"
        />
        Download
      </VButton>
    </VTableCell>
  </VTableRow>
</template>

<style lang="scss">
.v-table-investment-document-item {
  width: 100%;
  cursor: pointer !important;

  &__icon {
    width: 20px;
    height: 20px;
    color: $gray-70;
    margin-right: 16px;
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
