import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ref } from 'vue';
import { setActivePinia, createPinia } from 'pinia';
import { useOffersDetailsContent, OfferTabTypes } from '../useOffersDetailsContent';

vi.mock('InvestCommon/domain/session/store/useSession', () => ({
  useSessionStore: vi.fn(() => ({ userLoggedIn: ref(true) })),
}));

vi.mock('InvestCommon/data/filer/filer.formatter', () => ({
  FilerFormatter: {
    getFormattedInvestmentDocuments: vi.fn(() => [{ id: 1, typeFormatted: 'Financial Documents' }]),
    getFolderedInvestmentDocuments: vi.fn(() => ['investment-agreements', 'financial-documents']),
  },
}));

vi.mock('InvestCommon/data/filer/filer.repository', () => ({
  useRepositoryFiler: vi.fn(() => ({
    getFilesState: ref({ loading: false, data: {} }),
    getPublicFilesState: ref({ loading: false, data: {} }),
  })),
}));

vi.mock('InvestCommon/data/offer/offer.repository', () => ({
  useRepositoryOffer: vi.fn(() => ({
    getOfferCommentsState: ref({ data: { count: 3 } }),
  })),
}));

describe('useOffersDetailsContent', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    vi.clearAllMocks();
  });

  it('computes files, folders, headers and loading state', () => {
    const offerRef = ref(undefined as any);
    const composable = useOffersDetailsContent(offerRef);
    expect(composable.filesFormatted.value.length).toBe(1);
    expect(composable.folders.value).toEqual(['investment-agreements', 'financial-documents']);
    expect(composable.tableHeader.length).toBe(3);
    expect(composable.isFilesLoading.value).toBe(false);
  });

  it('parses and cleans markdown for description and highlights', () => {
    const offerRef = ref({ description: 'desc', highlights: 'highl' } as any);
    const composable = useOffersDetailsContent(offerRef);
    expect(composable.parsedDescription.value).toMatch(/^<p>desc<\/p>\n?$/);
    expect(composable.parsedHighlights.value).toMatch(/^<p>highl<\/p>\n?$/);
  });

  it('builds tab options including comments count subtitle', () => {
    const offerRef = ref(undefined as any);
    const composable = useOffersDetailsContent(offerRef);
    const opts = composable.tabOptions.value;
    expect(opts.map(o => o.value)).toEqual([
      OfferTabTypes.description,
      OfferTabTypes.highlights,
      OfferTabTypes.documents,
      OfferTabTypes.comments,
    ]);
    const comments = opts.find(o => o.value === OfferTabTypes.comments);
    expect(comments?.subTitle).toBe(3);
  });
});


