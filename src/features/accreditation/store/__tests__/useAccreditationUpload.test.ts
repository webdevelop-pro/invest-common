import { describe, it, expect, vi, beforeEach } from 'vitest';
import { setActivePinia, createPinia } from 'pinia';
import { useAccreditationUpload } from '../useAccreditationUpload';
import { useUsersStore } from 'InvestCommon/store/useUsers';
import { useUserProfilesStore } from 'InvestCommon/store/useUserProfiles';
import { useRepositoryAccreditation } from 'InvestCommon/data/accreditation/accreditation.repository';
import { AccreditationTypes } from 'InvestCommon/types/api/invest';

// Mock the dependencies
vi.mock('InvestCommon/store/useUsers', () => ({
  useUsersStore: vi.fn(() => ({
    selectedUserProfileData: { value: { id: '123', user_id: '456', accreditation_status: 'new' } },
    selectedUserProfileId: { value: '123' },
    selectedUserProfileType: { value: 'individual' },
  })),
}));

vi.mock('InvestCommon/store/useUserProfiles', () => ({
  useUserProfilesStore: vi.fn(() => ({
    getProfileById: vi.fn(),
  })),
}));

vi.mock('InvestCommon/data/accreditation/accreditation.repository', () => ({
  useRepositoryAccreditation: vi.fn(() => ({
    uploadDocument: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    error: { value: null },
  })),
}));

vi.mock('vue-router', () => ({
  useRouter: () => ({
    push: vi.fn(),
  }),
}));

describe('useAccreditationUpload', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    vi.clearAllMocks();
  });

  describe('initial state', () => {
    it('should initialize with correct default values', () => {
      const store = useAccreditationUpload();
      
      expect(store.isLoading).toBe(false);
      expect(store.isDisabledButton).toBe(false);
      expect(store.accreditationFiles).toEqual([]);
      expect(store.accreditationNote).toBe('');
      expect(store.accreditationDescriptions).toEqual([]);
      expect(store.isFieldsValid).toBe(true);
      expect(store.validateTrigger).toBe(false);
      expect(store.filesUploadError).toBe('');
      expect(store.allFiles).toEqual([]);
    });

    it('should set correct breadcrumbs', () => {
      const store = useAccreditationUpload();
      
      expect(store.breadcrumbs).toHaveLength(2);
      expect(store.breadcrumbs[0].text).toBe('Dashboard');
      expect(store.breadcrumbs[1].text).toBe('Accreditation Verification');
    });
  });

  describe('file handling', () => {
    it('should update files when onFilesChange is called', () => {
      const store = useAccreditationUpload();
      const mockFiles = [new File([''], 'test1.pdf'), new File([''], 'test2.pdf')];
      
      store.onFilesChange(mockFiles);
      
      expect(store.allFiles).toEqual(mockFiles);
      expect(store.accreditationFiles).toEqual(mockFiles);
    });

    it('should remove file description when onFileRemove is called', () => {
      const store = useAccreditationUpload();
      store.model.description1 = 'Test description';
      
      store.onFileRemove(0);
      
      expect(store.model.description1).toBeUndefined();
    });
  });

  describe('validation', () => {
    it('should update model and descriptions when onModelChange is called', () => {
      const store = useAccreditationUpload();
      const mockModel = {
        note: 'Test note',
        description1: 'Test description 1',
        description2: 'Test description 2',
      };
      
      store.onModelChange(mockModel);
      
      expect(store.accreditationNote).toBe('Test note');
      expect(store.accreditationDescriptions).toEqual(['Test description 1', 'Test description 2']);
    });

    it('should update isFieldsValid when onValidChange is called', () => {
      const store = useAccreditationUpload();
      
      store.onValidChange(false);
      expect(store.isFieldsValid).toBe(false);
      
      store.onValidChange(true);
      expect(store.isFieldsValid).toBe(true);
    });
  });

  describe('accreditation status checks', () => {
    it('should return true for isCreateAccreditation when status is new', () => {
      const store = useAccreditationUpload();
      expect(store.isCreateAccreditation).toBe(true);
    });

    it('should return false for isAccreditationCanUpload when status is pending', () => {
      const usersStore = useUsersStore();
      usersStore.selectedUserProfileData.value.accreditation_status = AccreditationTypes.pending;
      
      const store = useAccreditationUpload();
      expect(store.isAccreditationCanUpload).toBe(false);
    });
  });

  describe('file upload', () => {
    it('should handle file upload successfully', async () => {
      const store = useAccreditationUpload();
      const mockFile = new File([''], 'test.pdf');
      store.accreditationFiles = [mockFile];
      store.accreditationDescriptions = ['Test description'];
      store.accreditationNote = 'Test note';

      const accreditationRepository = useRepositoryAccreditation();
      vi.mocked(accreditationRepository.uploadDocument).mockResolvedValueOnce({});
      vi.mocked(accreditationRepository.create).mockResolvedValueOnce({});

      await store.sendFiles();

      expect(accreditationRepository.uploadDocument).toHaveBeenCalled();
      expect(accreditationRepository.create).toHaveBeenCalled();
    });

    it('should handle file upload error', async () => {
      const store = useAccreditationUpload();
      const mockFile = new File([''], 'test.pdf');
      store.accreditationFiles = [mockFile];
      store.accreditationDescriptions = ['Test description'];
      store.accreditationNote = 'Test note';

      const accreditationRepository = useRepositoryAccreditation();
      vi.mocked(accreditationRepository.uploadDocument).mockRejectedValueOnce(new Error('Upload failed'));

      await store.sendFiles();

      expect(store.isLoading).toBe(false);
    });
  });

  describe('error handling', () => {
    it('should return error text for specific description index', () => {
      const store = useAccreditationUpload();
      const accreditationRepository = useRepositoryAccreditation();
      accreditationRepository.error.value = { description1: 'Error message' };

      expect(store.getErrorText(0)).toBe('Error message');
    });
  });
}); 