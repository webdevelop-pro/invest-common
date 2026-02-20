import {
  computed, ref, watch, ComputedRef, Ref,
} from 'vue';
import { storeToRefs } from 'pinia';
import { FilerFormatter } from 'InvestCommon/data/filer/filer.formatter';
import { IFilerItemFormatted } from 'InvestCommon/data/filer/filer.type';
import { useRepositoryFiler } from 'InvestCommon/data/filer/filer.repository';
import { useRepositoryInvestment } from 'InvestCommon/data/investment/investment.repository';
import { useRepositoryEsign } from 'InvestCommon/data/esign/esign.repository';
import env from 'InvestCommon/domain/config/env';
import { downloadURI } from 'UiKit/helpers/url';

export interface UseInvestmentDocumentsOptions {
  investmentId: string;
}

export interface UseInvestmentDocumentsReturn {
  folders: ComputedRef<string[]>;
  filesWithSubscription: ComputedRef<IFilerItemFormatted[]>;
  tableHeader: Array<{ text: string; class?: string }>;
  loadingDocId: Ref<number | undefined>;
  loadingTable: ComputedRef<boolean>;
  onDocumentClick: (doc: IFilerItemFormatted) => Promise<void>;
}

export const useInvestmentDocuments = (options: UseInvestmentDocumentsOptions): UseInvestmentDocumentsReturn => {
  const { investmentId } = options;

  const investmentRepository = useRepositoryInvestment();
  const { getInvestOneState } = storeToRefs(investmentRepository);
  const esignRepository = useRepositoryEsign();

  const filerRepository = useRepositoryFiler();
  const { getFilesState, getPublicFilesState } = storeToRefs(filerRepository);

  const folders = computed(() => (
    FilerFormatter.getFolderedInvestmentDocuments(getFilesState.value.data, getPublicFilesState.value.data)
  ));

  const filesFormatted = computed<IFilerItemFormatted[]>(() => (
    FilerFormatter.getFormattedInvestmentDocuments(getFilesState.value.data, getPublicFilesState.value.data)
  ));

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

  const subscriptionAgreementType = 'investment-agreements';

  const subscriptionAgreement = computed<IFilerItemFormatted[]>(() => {
    const submitedAt = getInvestOneState.value.data?.submited_at;
    const submitedAtString = typeof submitedAt === 'string' ? submitedAt : '';
    const formattedDate = FilerFormatter.formatToFullDate(submitedAtString) || '';

    return [{
      id: 0,
      name: 'Subscription Agreement',
      filename: 'subscription-agreement',
      'object-type': subscriptionAgreementType,
      'object-data': '',
      'object-id': 0,
      'object-name': '',
      updated_at: submitedAtString,
      date: formattedDate,
      typeFormatted: FilerFormatter.capitalizeFirstLetter(subscriptionAgreementType),
      isNew: FilerFormatter.isRecent(submitedAtString),
      tagColor: FilerFormatter.getTagColorByType(subscriptionAgreementType),
      meta_data: {
        big: '',
        small: '',
        medium: '',
        size: 0,
      },
      mime: '',
      bucket_path: '',
      url: '',
      user_id: 0,
    }];
  });

  const filesWithSubscription = computed<IFilerItemFormatted[]>(() => [
    ...subscriptionAgreement.value,
    ...filesFormatted.value,
  ]);

  const loadingDocId = ref<number | undefined>();

  const onDocumentClick = async (doc: IFilerItemFormatted) => {
    const isSubscriptionAgreement = doc?.name === 'Subscription Agreement';
    if (!isSubscriptionAgreement || !investmentId) return;

    loadingDocId.value = doc.id;
    try {
      const provider = getInvestOneState.value.data?.signature_data?.provider?.toLowerCase();
      const entityId = getInvestOneState.value.data?.signature_data?.entity_id
        || getInvestOneState.value.data?.entity_id;
      const baseUrl = (env.DOCUSEAL_URL || '').replace(/\/$/, '');

      if (provider === 'docuseal' && entityId && baseUrl) {
        const url = `${baseUrl}/${entityId}`;
        window.open(url, '_blank');
        return;
      }

      // HelloSign or other: fetch document blob and trigger download
      const blob = await esignRepository.getDocument(investmentId);
      if (blob) {
        const blobUrl = URL.createObjectURL(blob);
        try {
          downloadURI(blobUrl, 'Subscription Agreement');
        } finally {
          URL.revokeObjectURL(blobUrl);
        }
      }
    } finally {
      loadingDocId.value = undefined;
    }
  };

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
    onDocumentClick,
  };
};
