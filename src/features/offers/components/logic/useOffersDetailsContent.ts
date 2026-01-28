import { computed, type Ref } from 'vue';
import MarkdownIt from 'markdown-it';
import tableWrap from '../../../../../../ui-kit/src/markdown/plugins/table-wrap';
import type { IOfferFormatted } from 'InvestCommon/data/offer/offer.types';
import { storeToRefs } from 'pinia';
import { useSessionStore } from 'InvestCommon/domain/session/store/useSession';
import { useRepositoryFiler } from 'InvestCommon/data/filer/filer.repository';
import { FilerFormatter } from 'InvestCommon/data/filer/filer.formatter';
import { useRepositoryOffer } from 'InvestCommon/data/offer/offer.repository';
import { useBreakpoints } from 'UiKit/composables/useBreakpoints';

export enum OfferTabTypes {
  description = 'description',
  highlights = 'highlights',
  documents = 'documents',
  comments = 'comments',
}

export function useOffersDetailsContent(offerRef: Ref<IOfferFormatted | undefined>) {
  const userSessionStore = useSessionStore();
  const { userLoggedIn } = storeToRefs(userSessionStore);
  const filerRepository = useRepositoryFiler();
  const { getFilesState, getPublicFilesState } = storeToRefs(filerRepository);
  const offerRepository = useRepositoryOffer();
  const { getOfferCommentsState } = storeToRefs(offerRepository);
  const { isTablet } = storeToRefs(useBreakpoints());

  const commentsLength = computed(() => (
    getOfferCommentsState.value.data?.count || null
  ));

  const filesFormatted = computed(() => (
    FilerFormatter.getFormattedInvestmentDocuments(getFilesState.value.data, getPublicFilesState.value.data)));

  const folders = computed(() => (
    FilerFormatter.getFolderedInvestmentDocuments(getFilesState.value.data, getPublicFilesState.value.data)));

  const tableHeader = [
    { text: 'Document Name', class: '' },
    { text: 'Type', class: '' },
    { text: 'Date Added', class: 'offer-details-content__date-header' },
  ];

  const isFilesLoading = computed(() => (
    userLoggedIn.value ? getFilesState.value.loading : getPublicFilesState.value.loading));

  // Create markdown-it instance matching VitePress configuration
  const md = new MarkdownIt();
  md.use(tableWrap);

  function cleanImageUrls(htmlContent: string): string {
    const regex = /(<img\s[^>]*src="[^"]+)(\?X-Goog-Algorithm[^"]*)(")/g;
    return htmlContent?.replace(regex, '$1$3');
  }

  function parseAndClean(markdownText?: string | null) {
    if (!markdownText) return null as unknown as string | null;
    return cleanImageUrls(md.render(markdownText));
  }

  const parsedDescription = computed(() => parseAndClean(offerRef.value?.description));
  const parsedHighlights = computed(() => parseAndClean(offerRef.value?.highlights));

  const tabOptions = computed(() => ([
    {
      value: OfferTabTypes.description,
      label: 'Description',
    },
    {
      value: OfferTabTypes.highlights,
      label: 'Highlights',
    },
    {
      value: OfferTabTypes.documents,
      label: isTablet.value ? 'Docs' : 'Financial Documents',
    },
    {
      value: OfferTabTypes.comments,
      label: isTablet.value ? 'Question' : 'Ask a Question',
      subTitle: commentsLength.value,
    },
  ]));

  return {
    OfferTabTypes,
    userLoggedIn,
    filesFormatted,
    folders,
    tableHeader,
    isFilesLoading,
    parsedDescription,
    parsedHighlights,
    tabOptions,
  };
}


