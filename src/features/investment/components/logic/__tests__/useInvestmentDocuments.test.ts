import {
  describe, it, expect, vi, beforeEach, afterEach,
} from 'vitest';
import { setActivePinia, createPinia } from 'pinia';
import { ref, nextTick } from 'vue';
import { IFilerItemFormatted } from 'InvestCommon/data/filer/filer.type';
import { useInvestmentDocuments } from '../useInvestmentDocuments';

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
    data: { id: '123', submited_at: '2024-01-10T10:00:00Z', offer: { id: 'offer-123' } },
  }),
};

const mockEsignRepository = {
  getDocument: vi.fn().mockResolvedValue(new Blob(['test'], { type: 'application/pdf' })),
  getDocumentState: ref({ loading: false, error: null, data: null as Blob | null }),
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

vi.mock('InvestCommon/data/esign/esign.repository', () => ({
  useRepositoryEsign: vi.fn(() => mockEsignRepository),
}));

vi.mock('InvestCommon/data/filer/filer.repository', () => ({
  useRepositoryFiler: vi.fn(() => mockFilerRepository),
}));

const mockWindowOpen = vi.fn();
const mockCreateObjectURL = vi.fn(() => 'blob:mock-url');
const mockRevokeObjectURL = vi.fn();

Object.defineProperty(window, 'open', { value: mockWindowOpen, writable: true });
Object.defineProperty(URL, 'createObjectURL', { value: mockCreateObjectURL, writable: true });
Object.defineProperty(URL, 'revokeObjectURL', { value: mockRevokeObjectURL, writable: true });

describe('useInvestmentDocuments', () => {
  let composable: ReturnType<typeof useInvestmentDocuments>;

  beforeEach(() => {
    setActivePinia(createPinia());
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Computed Properties', () => {
    beforeEach(() => {
      composable = useInvestmentDocuments({ investmentId: 'test-123' });
    });

    it('should return folders and files with subscription agreement', () => {
      expect(composable.folders.value).toEqual(['investment-agreements', 'financial-documents']);
      
      const files = composable.filesWithSubscription.value;
      expect(files.length).toBe(2);
      expect(files[0].name).toBe('Subscription Agreement');
      expect(files[1].name).toBe('Financial Report');
    });

    it('should reflect loading state', () => {
      expect(composable.loadingTable.value).toBe(false);
      
      mockFilerRepository.getFilesState.value.loading = true;
      expect(composable.loadingTable.value).toBe(true);
    });
  });

  describe('Document Click Handler', () => {
    beforeEach(() => {
      composable = useInvestmentDocuments({ investmentId: 'test-123' });
    });

    it('should handle subscription agreement click', async () => {
      const subscriptionDoc: IFilerItemFormatted = {
        id: 0,
        name: 'Subscription Agreement',
        filename: 'subscription-agreement',
        'object-type': 'investment-agreements',
        'object-data': '',
        'object-id': 0,
        'object-name': '',
        updated_at: '2024-01-10T10:00:00Z',
        date: '01/10/2024',
        typeFormatted: 'Investment Agreements',
        isNew: false,
        tagColor: 'green',
        meta_data: { big: '', small: '', medium: '', size: 0 },
        mime: '',
        bucket_path: '',
        url: '',
        user_id: 0,
      };

      mockEsignRepository.getDocumentState.value.data = new Blob(['test'], { type: 'application/pdf' });

      await composable.onDocumentClick(subscriptionDoc);

      expect(mockEsignRepository.getDocument).toHaveBeenCalledWith('test-123');
      expect(mockCreateObjectURL).toHaveBeenCalled();
      expect(mockWindowOpen).toHaveBeenCalledWith(expect.any(String), '_blank');
      expect(composable.loadingDocId.value).toBeUndefined();
    });

    it('should not handle non-subscription agreement clicks', async () => {
      const regularDoc: IFilerItemFormatted = {
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
      };

      await composable.onDocumentClick(regularDoc);

      expect(mockEsignRepository.getDocument).not.toHaveBeenCalled();
      expect(mockCreateObjectURL).not.toHaveBeenCalled();
      expect(mockWindowOpen).not.toHaveBeenCalled();
    });

    it('should handle document fetch error', async () => {
      mockEsignRepository.getDocument.mockRejectedValueOnce(new Error('Fetch failed'));

      const subscriptionDoc: IFilerItemFormatted = {
        id: 0,
        name: 'Subscription Agreement',
        filename: 'subscription-agreement',
        'object-type': 'investment-agreements',
        'object-data': '',
        'object-id': 0,
        'object-name': '',
        updated_at: '2024-01-10T10:00:00Z',
        date: '01/10/2024',
        typeFormatted: 'Investment Agreements',
        isNew: false,
        tagColor: 'green',
        meta_data: { big: '', small: '', medium: '', size: 0 },
        mime: '',
        bucket_path: '',
        url: '',
        user_id: 0,
      };

      await expect(composable.onDocumentClick(subscriptionDoc)).rejects.toThrow('Fetch failed');
      expect(composable.loadingDocId.value).toBe(0);
    });
  });

  describe('File Management', () => {
    beforeEach(() => {
      composable = useInvestmentDocuments({ investmentId: 'test-123' });
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
  });
});
