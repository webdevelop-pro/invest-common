import {
  computed, ref, watch, ComputedRef, Ref,
} from 'vue';
import { storeToRefs } from 'pinia';
import { FilerFormatter } from 'InvestCommon/data/filer/filer.formatter';
import { IFilerItemFormatted } from 'InvestCommon/data/filer/filer.type';
import { useRepositoryFiler } from 'InvestCommon/data/filer/filer.repository';
import { useRepositoryInvestment } from 'InvestCommon/data/investment/investment.repository';

export interface UseInvestmentDocumentsOptions {
  investmentId: string;
}

export interface UseInvestmentDocumentsReturn {
  folders: ComputedRef<string[]>;
  filesWithSubscription: ComputedRef<IFilerItemFormatted[]>;
  tableHeader: Array<{ text: string; class?: string }>;
  loadingDocId: Ref<number | undefined>;
  loadingTable: ComputedRef<boolean>;
}

export const useInvestmentDocuments = (): UseInvestmentDocumentsReturn => {
  const investmentRepository = useRepositoryInvestment();
  const { getInvestOneState } = storeToRefs(investmentRepository);

  const filerRepository = useRepositoryFiler();
  const { getFilesState, getPublicFilesState } = storeToRefs(filerRepository);

  const folders = computed(() => (
    FilerFormatter.getFolderedInvestmentDocuments(getFilesState.value.data, getPublicFilesState.value.data)
  ));

  const filesFormatted = computed<IFilerItemFormatted[]>(() => (
    FilerFormatter.getFormattedInvestmentDocuments(getFilesState.value.data, getPublicFilesState.value.data)
  ));

  const filesWithSubscription = computed<IFilerItemFormatted[]>(() => filesFormatted.value);

  const tableHeader = [
    {
      text: 'Document Name',
    },
    {
      text: 'Type',
    },
    {
      text: 'Date Added',
      class: 'v-table-investment-document-item__date-wrap',
    },
    {
      text: '',
      class: 'v-table-investment-document-item__download-wrap',
    },
  ];

  const loadingDocId = ref<number | undefined>();

  const getOfferDocuments = () => {
    if (getInvestOneState.value.data?.offer?.id) {
      if (getFilesState.value.data?.id !== getInvestOneState.value.data?.offer?.id) {
        filerRepository.getFiles(`offer/${getInvestOneState.value.data?.offer?.id}`, 'user');
      }
      if (getPublicFilesState.value.data?.id !== getInvestOneState.value.data?.offer?.id) {
        filerRepository.getPublicFiles(getInvestOneState.value.data?.offer?.id, 'offer');
      }
    }
  };

  const loadingTable = computed(() => getFilesState.value.loading || getInvestOneState.value.loading);

  watch(() => getInvestOneState.value.data?.offer?.id, () => {
    getOfferDocuments();
  }, { immediate: true });

  return {
    folders,
    filesWithSubscription,
    tableHeader,
    loadingDocId,
    loadingTable,
  };
};
