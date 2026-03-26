import {
  computed, ref, watch, ComputedRef, Ref,
} from 'vue';
import { storeToRefs } from 'pinia';
import { FilerFormatter } from 'InvestCommon/data/filer/filer.formatter';
import { IFilerItemFormatted } from 'InvestCommon/data/filer/filer.type';
import { useRepositoryFiler } from 'InvestCommon/data/filer/filer.repository';
import { useRepositoryInvestment } from 'InvestCommon/data/investment/investment.repository';
import { reportOfflineReadError } from 'InvestCommon/domain/error/errorReporting';

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

export const useInvestmentDocuments = (options?: UseInvestmentDocumentsOptions): UseInvestmentDocumentsReturn => {
  const investmentRepository = useRepositoryInvestment();
  const { getInvestOneState } = storeToRefs(investmentRepository);

  const filerRepository = useRepositoryFiler();
  const { getFilesState, getPublicFilesState } = storeToRefs(filerRepository);

  // Local collections of all filer responses we care about on the investment page
  const userFileSources = ref<any[]>([]);
  const publicFileSources = ref<any[]>([]);

  // Seed with any existing filer data so we don't lose responses
  if (getFilesState.value.data) {
    userFileSources.value.push(getFilesState.value.data);
  }
  if (getPublicFilesState.value.data) {
    publicFileSources.value.push(getPublicFilesState.value.data);
  }

  const folders = computed(() => (
    FilerFormatter.getFolderedInvestmentDocuments(userFileSources.value, publicFileSources.value)
  ));

  const filesFormatted = computed<IFilerItemFormatted[]>(() => (
    FilerFormatter.getFormattedInvestmentDocuments(userFileSources.value, publicFileSources.value)
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

  const getOfferDocuments = async () => {
    const offerId = getInvestOneState.value.data?.offer?.id;
    if (!offerId) return;

    const [userData, publicData] = await Promise.allSettled([
      filerRepository.getFiles(`offer/${offerId}`, 'user'),
      filerRepository.getPublicFiles(offerId, 'offer'),
    ]);

    if (userData.status === 'fulfilled' && userData.value) {
      userFileSources.value.push(userData.value);
    } else if (userData.status === 'rejected') {
      reportOfflineReadError(userData.reason, 'Failed to load investment documents');
    }

    if (publicData.status === 'fulfilled' && publicData.value) {
      publicFileSources.value.push(publicData.value);
    } else if (publicData.status === 'rejected') {
      reportOfflineReadError(publicData.reason, 'Failed to load investment documents');
    }
  };

  const loadingTable = computed(
    () => getFilesState.value.loading
      || getPublicFilesState.value.loading
      || getInvestOneState.value.loading,
  );

  watch(() => getInvestOneState.value.data?.offer?.id, () => {
    getOfferDocuments();
  }, { immediate: true });

  if (options?.investmentId) {
    void filerRepository.getFiles(options.investmentId, 'investment')
      .then((data) => {
        if (data) userFileSources.value.push(data);
      })
      .catch((error) => {
        reportOfflineReadError(error, 'Failed to load investment documents');
      });
  }

  return {
    folders,
    filesWithSubscription,
    tableHeader,
    loadingDocId,
    loadingTable,
  };
};
