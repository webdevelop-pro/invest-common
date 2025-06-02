import {
  describe, it, expect, beforeEach, vi,
} from 'vitest';
import { ApiClient } from 'UiKit/helpers/api/apiClient';
import { toasterErrorHandling } from 'UiKit/helpers/api/toasterErrorHandling';
import { AccreditationTypes } from 'InvestCommon/types/api/invest';
import { useRepositoryAccreditation } from '../accreditation.repository';

// Mock ApiClient
vi.mock('UiKit/helpers/api/apiClient', () => ({
  ApiClient: vi.fn().mockImplementation(() => ({
    get: vi.fn().mockImplementation(() => Promise.resolve({ data: [] })),
    post: vi.fn().mockImplementation(() => Promise.resolve({ data: {} })),
  })),
}));

// Mock toaster error handling
vi.mock('UiKit/helpers/api/toasterErrorHandling', () => ({
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
    expect(repository.accreditation.value).toEqual(mockAccreditation);
    expect(repository.isLoadingGetAll.value).toBe(false);
    expect(repository.error.value).toBeNull();
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
    expect(repository.error.value).toBe(mockError);
    expect(repository.isLoadingGetAll.value).toBe(false);
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
    expect(repository.isLoadingCreate.value).toBe(false);
    expect(repository.error.value).toBeNull();
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
    expect(repository.isLoadingUpdate.value).toBe(false);
    expect(repository.error.value).toBeNull();
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
    expect(repository.isLoadingUpload.value).toBe(false);
    expect(repository.error.value).toBeNull();
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
    expect(repository.isLoadingCreateEscrow.value).toBe(false);
    expect(repository.error.value).toBeNull();
    expect(toasterErrorHandling).not.toHaveBeenCalled();
  });
});
