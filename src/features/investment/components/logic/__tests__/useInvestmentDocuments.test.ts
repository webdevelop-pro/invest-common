import {
  describe, it, expect, vi, beforeEach, afterEach,
} from 'vitest';
import { setActivePinia, createPinia } from 'pinia';
import { ref, nextTick } from 'vue';
import { useInvestmentDocuments } from '../useInvestmentDocuments';

const { reportOfflineReadErrorMock } = vi.hoisted(() => ({
  reportOfflineReadErrorMock: vi.fn(),
}));

vi.mock('InvestCommon/data/filer/filer.formatter', () => ({
  FilerFormatter: {
    getFolderedInvestmentDocuments: vi.fn(() => ['investment-agreements', 'financial-documents']),
    getFormattedInvestmentDocuments: vi.fn(() => [
      {
        id: 1,
        name: 'Financial Report',
        filename: 'financial-report.pdf',
        'object-type': 'financial-documents',
        'object-data': '',
        'object-id': 1,
        'object-name': 'Financial Report',
        updated_at: '2024-01-15T10:00:00Z',
        date: '01/15/2024',
        typeFormatted: 'Financial Documents',
        isNew: false,
        tagColor: 'blue',
        meta_data: { big: '', small: '', medium: '', size: 1024 },
        mime: 'application/pdf',
        bucket_path: '/documents/financial-report.pdf',
        url: 'https://example.com/documents/financial-report.pdf',
        user_id: 1,
      },
    ]),
    formatToFullDate: vi.fn((date) => date ? '01/10/2024' : ''),
    capitalizeFirstLetter: vi.fn((input) => input ? 'Investment agreements' : ''),
    isRecent: vi.fn(() => false),
    getTagColorByType: vi.fn((type) => type === 'investment-agreements' ? 'green' : 'blue'),
  },
}));

const mockInvestmentRepository = {
  getInvestOneState: ref({
    loading: false,
    error: null,
    data: {
      id: '123',
      submited_at: '2024-01-10T10:00:00Z',
      offer: { id: 'offer-123' },
      signature_data: { provider: 'hellosign', entity_id: '', signature_id: '' },
    },
  }),
};

const mockFilerRepository = {
  getFiles: vi.fn().mockResolvedValue([]),
  getPublicFiles: vi.fn().mockResolvedValue([]),
  getFilesState: ref({ loading: false, error: null, data: [] }),
  getPublicFilesState: ref({ loading: false, error: null, data: [] }),
};

vi.mock('InvestCommon/data/investment/investment.repository', () => ({
  useRepositoryInvestment: vi.fn(() => mockInvestmentRepository),
}));

vi.mock('InvestCommon/data/filer/filer.repository', () => ({
  useRepositoryFiler: vi.fn(() => mockFilerRepository),
}));

vi.mock('InvestCommon/domain/error/errorReporting', () => ({
  reportOfflineReadError: reportOfflineReadErrorMock,
}));

describe('useInvestmentDocuments', () => {
  let composable: ReturnType<typeof useInvestmentDocuments>;

  beforeEach(() => {
    setActivePinia(createPinia());
    vi.clearAllMocks();
    reportOfflineReadErrorMock.mockReset();
    mockFilerRepository.getFiles.mockResolvedValue([]);
    mockFilerRepository.getPublicFiles.mockResolvedValue([]);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Computed Properties', () => {
    beforeEach(() => {
      composable = useInvestmentDocuments();
    });

    it('should return folders and files from formatter', () => {
      expect(composable.folders.value).toEqual(['investment-agreements', 'financial-documents']);

      const files = composable.filesWithSubscription.value;
      expect(files.length).toBe(1);
      expect(files[0].name).toBe('Financial Report');
    });

    it('should reflect loading state', () => {
      expect(composable.loadingTable.value).toBe(false);
      
      mockFilerRepository.getFilesState.value.loading = true;
      expect(composable.loadingTable.value).toBe(true);
    });
  });

  describe('File Management', () => {
    beforeEach(() => {
      composable = useInvestmentDocuments();
    });

    it('should fetch documents when offer ID changes', async () => {
      mockInvestmentRepository.getInvestOneState.value.data = {
        ...mockInvestmentRepository.getInvestOneState.value.data,
        offer: { id: 'new-offer-456' },
      };

      await nextTick();

      expect(mockFilerRepository.getFiles).toHaveBeenCalledWith('offer/new-offer-456', 'user');
      expect(mockFilerRepository.getPublicFiles).toHaveBeenCalledWith('new-offer-456', 'offer');
    });

    it('reports secondary read misses without throwing when filer requests fail offline', async () => {
      const offlineError = new Error('Failed to fetch');
      mockFilerRepository.getFiles.mockRejectedValueOnce(offlineError);
      mockFilerRepository.getPublicFiles.mockRejectedValueOnce(offlineError);

      useInvestmentDocuments();

      await nextTick();
      await Promise.resolve();

      expect(reportOfflineReadErrorMock).toHaveBeenCalledTimes(2);
      expect(reportOfflineReadErrorMock).toHaveBeenCalledWith(offlineError, 'Failed to load investment documents');
    });
  });
});
