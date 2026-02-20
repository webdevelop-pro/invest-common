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
    data: {
      id: '123',
      submited_at: '2024-01-10T10:00:00Z',
      offer: { id: 'offer-123' },
      signature_data: { provider: 'hellosign', entity_id: '', signature_id: '' },
    },
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

vi.mock('InvestCommon/domain/config/env', () => ({
  default: { DOCUSEAL_URL: 'https://docuseal-web.webdevelop.biz/s' },
}));

const mockCreateObjectURL = vi.fn(() => 'blob:mock-url');
const mockRevokeObjectURL = vi.fn();
const mockDownloadURI = vi.fn();

Object.defineProperty(URL, 'createObjectURL', { value: mockCreateObjectURL, writable: true });
Object.defineProperty(URL, 'revokeObjectURL', { value: mockRevokeObjectURL, writable: true });

vi.mock('UiKit/helpers/url', () => ({
  downloadURI: (...args: unknown[]) => mockDownloadURI(...args),
}));

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

    it('should open DocuSeal URL when provider is docuseal', async () => {
      mockInvestmentRepository.getInvestOneState.value.data = {
        ...mockInvestmentRepository.getInvestOneState.value.data,
        signature_data: { provider: 'docuseal', entity_id: 'abc123', signature_id: '' },
      };

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

      const openSpy = vi.spyOn(window, 'open').mockImplementation(() => null);

      await composable.onDocumentClick(subscriptionDoc);

      expect(openSpy).toHaveBeenCalledWith('https://docuseal-web.webdevelop.biz/s/abc123', '_blank');
      expect(mockEsignRepository.getDocument).not.toHaveBeenCalled();
      expect(composable.loadingDocId.value).toBeUndefined();
      openSpy.mockRestore();
    });

    it('should fetch and download document when provider is hellosign', async () => {
      mockInvestmentRepository.getInvestOneState.value.data = {
        ...mockInvestmentRepository.getInvestOneState.value.data,
        signature_data: { provider: 'hellosign', entity_id: '', signature_id: '' },
      };

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

      await composable.onDocumentClick(subscriptionDoc);

      expect(mockEsignRepository.getDocument).toHaveBeenCalledWith('test-123');
      expect(mockCreateObjectURL).toHaveBeenCalled();
      expect(mockDownloadURI).toHaveBeenCalledWith('blob:mock-url', 'Subscription Agreement');
      expect(composable.loadingDocId.value).toBeUndefined();
    });

    it('should fetch and download when provider is docuseal but entity_id is missing', async () => {
      mockInvestmentRepository.getInvestOneState.value.data = {
        ...mockInvestmentRepository.getInvestOneState.value.data,
        signature_data: { provider: 'docuseal', entity_id: '', signature_id: '' },
      };

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

      await composable.onDocumentClick(subscriptionDoc);

      expect(mockEsignRepository.getDocument).toHaveBeenCalledWith('test-123');
      expect(mockCreateObjectURL).toHaveBeenCalled();
      expect(mockDownloadURI).toHaveBeenCalledWith('blob:mock-url', 'Subscription Agreement');
    });

    it('should fetch and download when provider is missing (fallback to hellosign path)', async () => {
      mockInvestmentRepository.getInvestOneState.value.data = {
        ...mockInvestmentRepository.getInvestOneState.value.data,
        signature_data: { provider: '', entity_id: '', signature_id: '' },
      };

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

      await composable.onDocumentClick(subscriptionDoc);

      expect(mockEsignRepository.getDocument).toHaveBeenCalledWith('test-123');
      expect(mockDownloadURI).toHaveBeenCalledWith('blob:mock-url', 'Subscription Agreement');
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
      expect(mockDownloadURI).not.toHaveBeenCalled();
    });

    it('should handle document fetch error (hellosign path)', async () => {
      mockInvestmentRepository.getInvestOneState.value.data = {
        ...mockInvestmentRepository.getInvestOneState.value.data,
        signature_data: { provider: 'hellosign', entity_id: '', signature_id: '' },
      };
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
      expect(composable.loadingDocId.value).toBeUndefined();
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
