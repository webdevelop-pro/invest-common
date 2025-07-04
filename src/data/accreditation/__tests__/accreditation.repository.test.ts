import {
  describe, it, expect, beforeEach, vi,
} from 'vitest';
import { ApiClient } from 'InvestCommon/data/service/apiClient';
import { toasterErrorHandling } from 'InvestCommon/data/repository/error/toasterErrorHandling';
import { AccreditationTypes } from 'InvestCommon/types/api/invest';
import { useRepositoryAccreditation } from '../accreditation.repository';

// Mock ApiClient
vi.mock('InvestCommon/data/service/apiClient', () => ({
  ApiClient: vi.fn().mockImplementation(() => ({
    get: vi.fn().mockImplementation(() => Promise.resolve({ data: [] })),
    post: vi.fn().mockImplementation(() => Promise.resolve({ data: {} })),
  })),
}));

// Mock toaster error handling
vi.mock('InvestCommon/data/repository/error/toasterErrorHandling', () => ({
  toasterErrorHandling: vi.fn(),
}));

describe('Accreditation Repository', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should fetch accreditation data successfully', async () => {
    const mockAccreditation = [
      { id: 1, status: AccreditationTypes.pending, created_at: '2024-01-01' },
      { id: 2, status: AccreditationTypes.approved, created_at: '2024-01-02' },
    ];

    const mockGet = vi.fn().mockImplementation(() => Promise.resolve({ data: mockAccreditation }));
    vi.mocked(ApiClient).mockImplementation(() => ({
      get: mockGet,
      post: vi.fn().mockImplementation(() => Promise.resolve({ data: {} })),
    }));

    const repository = useRepositoryAccreditation();
    const result = await repository.getAll(123);

    expect(result).toEqual(mockAccreditation);
    expect(repository.getAllState.value.data).toEqual(mockAccreditation);
    expect(repository.getAllState.value.loading).toBe(false);
    expect(repository.getAllState.value.error).toBeNull();
    expect(toasterErrorHandling).not.toHaveBeenCalled();
  });

  it('should handle fetch error', async () => {
    const mockError = new Error('Network error');
    const mockGet = vi.fn().mockImplementation(() => Promise.reject(mockError));
    vi.mocked(ApiClient).mockImplementation(() => ({
      get: mockGet,
      post: vi.fn().mockImplementation(() => Promise.resolve({ data: {} })),
    }));

    const repository = useRepositoryAccreditation();

    await expect(repository.getAll(123)).rejects.toThrow(mockError);
    expect(repository.getAllState.value.error).toBe(mockError);
    expect(repository.getAllState.value.loading).toBe(false);
    expect(toasterErrorHandling).toHaveBeenCalledWith(expect.any(Object), 'Failed to fetch accreditation data');
  });

  it('should create accreditation successfully', async () => {
    const mockResponse = { id: 1, status: AccreditationTypes.pending };
    const mockPost = vi.fn().mockImplementation(() => Promise.resolve({ data: mockResponse }));
    vi.mocked(ApiClient).mockImplementation(() => ({
      get: vi.fn().mockImplementation(() => Promise.resolve({ data: [] })),
      post: mockPost,
    }));

    const repository = useRepositoryAccreditation();
    const result = await repository.create(123, 'Test note');

    expect(result).toEqual(mockResponse);
    expect(repository.createState.value.loading).toBe(false);
    expect(repository.createState.value.error).toBeNull();
    expect(toasterErrorHandling).not.toHaveBeenCalled();
  });

  it('should update accreditation successfully', async () => {
    const mockResponse = { id: 1, status: AccreditationTypes.pending };
    const mockPost = vi.fn().mockImplementation(() => Promise.resolve({ data: mockResponse }));
    vi.mocked(ApiClient).mockImplementation(() => ({
      get: vi.fn().mockImplementation(() => Promise.resolve({ data: [] })),
      post: mockPost,
    }));

    const repository = useRepositoryAccreditation();
    const result = await repository.update(123, 'Updated note');

    expect(result).toEqual(mockResponse);
    expect(repository.updateState.value.loading).toBe(false);
    expect(repository.updateState.value.error).toBeNull();
    expect(toasterErrorHandling).not.toHaveBeenCalled();
  });

  it('should upload document successfully', async () => {
    const mockResponse = { id: 1, status: 'success' };
    const mockPost = vi.fn().mockImplementation(() => Promise.resolve({ data: mockResponse }));
    vi.mocked(ApiClient).mockImplementation(() => ({
      get: vi.fn().mockImplementation(() => Promise.resolve({ data: [] })),
      post: mockPost,
    }));

    const repository = useRepositoryAccreditation();
    const formData = new FormData();
    const result = await repository.uploadDocument(123, 456, formData);

    expect(result).toEqual(mockResponse);
    expect(repository.uploadDocumentState.value.loading).toBe(false);
    expect(repository.uploadDocumentState.value.error).toBeNull();
    expect(toasterErrorHandling).not.toHaveBeenCalled();
  });

  it('should create escrow successfully', async () => {
    const mockResponse = { id: 1, status: 'success' };
    const mockPost = vi.fn().mockImplementation(() => Promise.resolve({ data: mockResponse }));
    vi.mocked(ApiClient).mockImplementation(() => ({
      get: vi.fn().mockImplementation(() => Promise.resolve({ data: [] })),
      post: mockPost,
    }));

    const repository = useRepositoryAccreditation();
    const result = await repository.createEscrow(123, 456);

    expect(result).toEqual(mockResponse);
    expect(repository.createEscrowState.value.loading).toBe(false);
    expect(repository.createEscrowState.value.error).toBeNull();
    expect(toasterErrorHandling).not.toHaveBeenCalled();
  });

  it('should handle create accreditation error', async () => {
    const mockError = new Error('Create failed');
    const mockPost = vi.fn().mockImplementation(() => Promise.reject(mockError));
    vi.mocked(ApiClient).mockImplementation(() => ({
      get: vi.fn().mockImplementation(() => Promise.resolve({ data: [] })),
      post: mockPost,
    }));

    const repository = useRepositoryAccreditation();

    await expect(repository.create(123, 'Test note')).rejects.toThrow(mockError);
    expect(repository.createState.value.error).toBe(mockError);
    expect(repository.createState.value.loading).toBe(false);
    expect(toasterErrorHandling).toHaveBeenCalledWith(expect.any(Object), 'Failed to create accreditation');
  });

  it('should handle update accreditation error', async () => {
    const mockError = new Error('Update failed');
    const mockPost = vi.fn().mockImplementation(() => Promise.reject(mockError));
    vi.mocked(ApiClient).mockImplementation(() => ({
      get: vi.fn().mockImplementation(() => Promise.resolve({ data: [] })),
      post: mockPost,
    }));

    const repository = useRepositoryAccreditation();

    await expect(repository.update(123, 'Updated note')).rejects.toThrow(mockError);
    expect(repository.updateState.value.error).toBe(mockError);
    expect(repository.updateState.value.loading).toBe(false);
    expect(toasterErrorHandling).toHaveBeenCalledWith(expect.any(Object), 'Failed to update accreditation');
  });

  it('should handle upload document error', async () => {
    const mockError = new Error('Upload failed');
    const mockPost = vi.fn().mockImplementation(() => Promise.reject(mockError));
    vi.mocked(ApiClient).mockImplementation(() => ({
      get: vi.fn().mockImplementation(() => Promise.resolve({ data: [] })),
      post: mockPost,
    }));

    const repository = useRepositoryAccreditation();
    const formData = new FormData();

    await expect(repository.uploadDocument(123, 456, formData)).rejects.toThrow(mockError);
    expect(repository.uploadDocumentState.value.error).toBe(mockError);
    expect(repository.uploadDocumentState.value.loading).toBe(false);
    expect(toasterErrorHandling).toHaveBeenCalledWith(expect.any(Object), 'Failed to upload accreditation document');
  });

  it('should handle create escrow error', async () => {
    const mockError = new Error('Escrow creation failed');
    const mockPost = vi.fn().mockImplementation(() => Promise.reject(mockError));
    vi.mocked(ApiClient).mockImplementation(() => ({
      get: vi.fn().mockImplementation(() => Promise.resolve({ data: [] })),
      post: mockPost,
    }));

    const repository = useRepositoryAccreditation();

    await expect(repository.createEscrow(123, 456)).rejects.toThrow(mockError);
    expect(repository.createEscrowState.value.error).toBe(mockError);
    expect(repository.createEscrowState.value.loading).toBe(false);
    expect(toasterErrorHandling).toHaveBeenCalledWith(mockError, 'Failed to create escrow');
  });

  it('should verify loading states during operations', async () => {
    const mockPost = vi.fn().mockImplementation(() => new Promise((resolve) => {
      setTimeout(() => resolve({ data: {} }), 100);
    }));
    vi.mocked(ApiClient).mockImplementation(() => ({
      get: vi.fn().mockImplementation(() => Promise.resolve({ data: [] })),
      post: mockPost,
    }));

    const repository = useRepositoryAccreditation();

    // Test create loading state
    const createPromise = repository.create(123, 'Test note');
    expect(repository.createState.value.loading).toBe(true);
    await createPromise;
    expect(repository.createState.value.loading).toBe(false);

    // Test update loading state
    const updatePromise = repository.update(123, 'Updated note');
    expect(repository.updateState.value.loading).toBe(true);
    await updatePromise;
    expect(repository.updateState.value.loading).toBe(false);

    // Test upload loading state
    const formData = new FormData();
    const uploadPromise = repository.uploadDocument(123, 456, formData);
    expect(repository.uploadDocumentState.value.loading).toBe(true);
    await uploadPromise;
    expect(repository.uploadDocumentState.value.loading).toBe(false);

    // Test escrow loading state
    const escrowPromise = repository.createEscrow(123, 456);
    expect(repository.createEscrowState.value.loading).toBe(true);
    await escrowPromise;
    expect(repository.createEscrowState.value.loading).toBe(false);
  });

  it('should handle empty or invalid inputs', async () => {
    const mockPost = vi.fn().mockImplementation(() => Promise.resolve({ data: {} }));
    vi.mocked(ApiClient).mockImplementation(() => ({
      get: vi.fn().mockImplementation(() => Promise.resolve({ data: [] })),
      post: mockPost,
    }));

    const repository = useRepositoryAccreditation();

    // Test with empty note
    await repository.create(123, '');
    expect(mockPost).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({ notes: '' }),
    );

    // Test with empty form data
    const emptyFormData = new FormData();
    await repository.uploadDocument(123, 456, emptyFormData);
    expect(mockPost).toHaveBeenCalledWith(
      expect.any(String),
      emptyFormData,
      expect.any(Object),
    );

    // Test with zero IDs
    await repository.createEscrow(0, 0);
    expect(mockPost).toHaveBeenCalledWith(
      expect.stringContaining('/0/0'),
      null,
      expect.any(Object),
    );
  });

  it('should reset all states correctly', () => {
    const repository = useRepositoryAccreditation();
    
    // Set some initial state
    repository.getAllState.value = { loading: true, error: new Error('test'), data: [] };
    repository.createState.value = { loading: true, error: new Error('test'), data: {} };
    repository.updateState.value = { loading: true, error: new Error('test'), data: {} };
    repository.uploadDocumentState.value = { loading: true, error: new Error('test'), data: {} };
    repository.createEscrowState.value = { loading: true, error: new Error('test'), data: {} };

    // Reset all states
    repository.resetAll();

    // Verify all states are reset
    expect(repository.getAllState.value).toEqual({ loading: false, error: null, data: undefined });
    expect(repository.createState.value).toEqual({ loading: false, error: null, data: undefined });
    expect(repository.updateState.value).toEqual({ loading: false, error: null, data: undefined });
    expect(repository.uploadDocumentState.value).toEqual({ loading: false, error: null, data: undefined });
    expect(repository.createEscrowState.value).toEqual({ loading: false, error: null, data: undefined });
  });
});
