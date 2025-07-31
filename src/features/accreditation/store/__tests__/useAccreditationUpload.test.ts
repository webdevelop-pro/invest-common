import {
  describe, it, expect, vi, beforeEach, afterEach,
} from 'vitest';
import { setActivePinia, createPinia } from 'pinia';
import { ref } from 'vue';
import { useRepositoryAccreditation } from '../../../../data/accreditation/accreditation.repository';
import { useRepositoryProfiles } from '../../../../data/profiles/profiles.repository';
import { AccreditationTypes } from '../../../../types/api/invest';
import { useProfilesStore } from '../../../../domain/profiles/store/useProfiles';
import { useAccreditationUpload } from '../useAccreditationUpload';

vi.mock('../../../../domain/profiles/store/useProfiles', () => ({
  useProfilesStore: vi.fn(() => ({
    getProfileById: vi.fn(),
  })),
}));

vi.mock('../../../../data/profiles/profiles.repository', () => ({
  useRepositoryProfiles: vi.fn(() => ({
    getProfileById: vi.fn(),
    getProfileByIdState: ref({ loading: false, error: null, data: { id: '123', user_id: '456', accreditation_status: 'new' } }),
    getUserState: ref({ loading: false, error: null, data: { profiles: [] } }),
  })),
}));

vi.mock('../../../../data/accreditation/accreditation.repository', () => ({
  useRepositoryAccreditation: vi.fn(() => ({
    uploadDocument: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    createState: ref({ loading: false, error: null, data: undefined }),
    updateState: ref({ loading: false, error: null, data: undefined }),
  })),
}));

vi.mock('vue-router', () => ({
  useRouter: vi.fn(() => ({
    push: vi.fn(),
  })),
  useRoute: vi.fn(() => ({
    params: { profileId: '123' },
    name: 'test-route',
  })),
}));

describe('useAccreditationUpload', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    vi.clearAllMocks();

    // Ensure the store is properly initialized with all required refs
    const mockStore = {
      selectedUserProfileData: ref({ id: '123', user_id: '456', accreditation_status: 'new' }),
      selectedUserProfileId: ref('123'),
      selectedUserProfileType: ref('individual'),
    };
    vi.mocked(useProfilesStore).mockReturnValue(mockStore);
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

    it('should handle multiple file uploads with descriptions', () => {
      const store = useAccreditationUpload();
      const mockFiles = [
        new File([''], 'test1.pdf'),
        new File([''], 'test2.pdf'),
        new File([''], 'test3.pdf'),
      ];

      store.onFilesChange(mockFiles);
      store.onModelChange({
        note: 'Test note',
        description1: 'Description 1',
        description2: 'Description 2',
        description3: 'Description 3',
      });

      expect(store.accreditationFiles).toEqual(mockFiles);
      expect(store.accreditationDescriptions).toEqual(['Description 1', 'Description 2', 'Description 3']);
      expect(store.accreditationNote).toBe('Test note');
    });
  });

  describe('validation', () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
    });

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

    it('should handle validation with multiple files', () => {
      const store = useAccreditationUpload();
      const mockFiles = [
        new File([''], 'test1.pdf'),
        new File([''], 'test2.pdf'),
      ];

      store.onFilesChange(mockFiles);
      store.onModelChange({
        note: 'Test note',
        description1: 'Description 1',
        description2: 'Description 2',
      });

      expect(store.isFieldsValid).toBe(true);
    });

    it('should handle validation when files are removed', () => {
      const store = useAccreditationUpload();
      const mockFiles = [
        new File([''], 'test1.pdf'),
        new File([''], 'test2.pdf'),
      ];

      // Set up initial state
      store.onFilesChange(mockFiles);

      // Set up model and trigger model change
      const model = {
        note: 'Test note',
        description1: 'Description 1',
        description2: 'Description 2',
      };
      store.onModelChange(model);

      // Verify initial state
      expect(store.accreditationDescriptions).toEqual(['Description 1', 'Description 2']);
      expect(store.accreditationFiles).toEqual(mockFiles);

      // Remove second file and update model
      store.onFileRemove(1);
      const updatedModel = {
        note: 'Test note',
        description1: 'Description 1',
      };
      store.onModelChange(updatedModel);

      // Update files after removal
      store.onFilesChange([mockFiles[0]]);

      // Verify state after removal
      expect(store.accreditationDescriptions).toEqual(['Description 1']);
      expect(store.model.description2).toBeUndefined();
      expect(store.accreditationFiles).toEqual([mockFiles[0]]);
    });
  });

  describe('accreditation status checks', () => {
    it('should return false for isAccreditationCanUpload when status is pending', () => {
      // Reset the mock before the test
      vi.clearAllMocks();

      // Create a new mock with the pending status
      const mockStore = {
        selectedUserProfileData: ref({
          id: '123',
          user_id: '456',
          accreditation_status: AccreditationTypes.pending,
          isAccreditationPending: true,
          isAccreditationApproved: false,
          isAccreditationNew: false,
        }),
        selectedUserProfileId: ref('123'),
        selectedUserProfileType: ref('individual'),
      };

      // Override the mock implementation for this test
      vi.mocked(useProfilesStore).mockReturnValue(mockStore as any);

      const store = useAccreditationUpload();
      // With the new logic, isAccreditationCanUpload should be false when isAccreditationApproved is false
      expect(store.isAccreditationCanUpload).toBe(false);
    });

    it('should set isFieldsValid to true when model is valid and validateTrigger is set', () => {
      const store = useAccreditationUpload();
      store.model = {
        note: 'Valid note',
        description1: 'Valid description',
      };
      store.validateTrigger = true;
      expect(store.isFieldsValid).toBe(true);
    });

    it('should update accreditationDescriptions when model changes deeply', () => {
      const store = useAccreditationUpload();
      store.onModelChange({
        note: 'Initial note',
        description1: 'Initial description',
      });
      expect(store.accreditationDescriptions).toEqual(['Initial description']);

      store.onModelChange({
        note: 'Initial note',
        description1: 'Initial description',
        description2: 'Second description',
      });
      expect(store.accreditationDescriptions).toEqual(['Initial description', 'Second description']);
    });

    it('should re-instantiate validator when schema changes', () => {
      const store = useAccreditationUpload();
      const oldValidator = store.schemaAccreditationFileInput;
      // Simulate schema change by adding files
      store.onFilesChange([
        new File([''], 'test1.pdf'),
        new File([''], 'test2.pdf'),
        new File([''], 'test3.pdf'),
      ]);
      expect(store.schemaAccreditationFileInput).not.toBe(oldValidator);
    });
  });

  describe('file upload', () => {
    beforeEach(() => {
      setActivePinia(createPinia());
      vi.clearAllMocks();

      // Ensure the store is properly initialized with all required refs
      const mockStore = {
        selectedUserProfileData: ref({ 
          id: '123', 
          user_id: '456', 
          accreditation_status: 'new',
          isAccreditationPending: false,
          isAccreditationApproved: false,
          isAccreditationNew: true
        }),
        selectedUserProfileId: ref('123'),
        selectedUserProfileType: ref('individual'),
      };
      vi.mocked(useProfilesStore).mockReturnValue(mockStore as any);
    });

    it('should handle upload error gracefully', async () => {
      // Set up the mock repository first
      const uploadDocumentSpy = vi.fn().mockRejectedValue(new Error('Upload failed'));
      vi.mocked(useRepositoryAccreditation).mockReturnValue({
        uploadDocument: uploadDocumentSpy,
        create: vi.fn(),
        update: vi.fn(),
        createState: ref({ loading: false, error: null, data: undefined }),
        updateState: ref({ loading: false, error: null, data: undefined }),
      });

      // Set up the mock profiles repository
      vi.mocked(useRepositoryProfiles).mockReturnValue({
        getProfileById: vi.fn(),
        getProfileByIdState: ref({
          loading: false,
          error: null,
          data: { id: '123', user_id: '456', accreditation_status: 'new' },
        }),
        getUserState: ref({ loading: false, error: null, data: { profiles: [] } }),
      });

      const store = useAccreditationUpload();
      const mockFile = new File([''], 'test.pdf');

      // Set up the required store values
      store.accreditationFiles = [mockFile];
      store.accreditationDescriptions = ['Test description'];

      await store.sendFiles();

      expect(store.isLoading).toBe(false);
    });

    it('should handle successful file upload and create accreditation', async () => {
      // Clear previous mocks
      vi.clearAllMocks();

      // Set up the mock repository first
      const uploadDocumentSpy = vi.fn().mockResolvedValue({});
      const createSpy = vi.fn().mockResolvedValue({});
      vi.mocked(useRepositoryAccreditation).mockReturnValue({
        uploadDocument: uploadDocumentSpy,
        create: createSpy,
        update: vi.fn(),
        createState: ref({ loading: false, error: null, data: undefined }),
        updateState: ref({ loading: false, error: null, data: undefined }),
      } as any);

      // Set up the mock profiles repository
      vi.mocked(useRepositoryProfiles).mockReturnValue({
        getProfileById: vi.fn(),
        getProfileByIdState: ref({
          loading: false,
          error: null,
          data: { id: '123', user_id: '456', accreditation_status: AccreditationTypes.new },
        }),
        getUserState: ref({ loading: false, error: null, data: { profiles: [] } }),
      } as any);

      // Set up the mock profiles store with new status
      const mockStore = {
        selectedUserProfileData: ref({
          id: '123',
          user_id: '456',
          accreditation_status: AccreditationTypes.new,
          isAccreditationNew: true,
        }),
        selectedUserProfileId: ref('123'),
        selectedUserProfileType: ref('individual'),
      };
      vi.mocked(useProfilesStore).mockReturnValue(mockStore as any);

      const store = useAccreditationUpload();
      const mockFile = new File([''], 'test.pdf');
      const mockNote = 'Test note';

      // Set up the store state
      store.accreditationFiles = [mockFile];
      store.accreditationDescriptions = ['Test description'];
      store.accreditationNote = mockNote;

      await store.sendFiles();

      expect(uploadDocumentSpy).toHaveBeenCalled();
      expect(createSpy).toHaveBeenCalledWith('123', mockNote);
      expect(store.isLoading).toBe(false);
    });

    it('should handle successful file upload and update accreditation', async () => {
      // Clear previous mocks
      vi.clearAllMocks();

      // Set up the mock repository first
      const uploadDocumentSpy = vi.fn().mockResolvedValue({});
      const updateSpy = vi.fn().mockResolvedValue({});
      vi.mocked(useRepositoryAccreditation).mockReturnValue({
        uploadDocument: uploadDocumentSpy,
        create: vi.fn(),
        update: updateSpy,
        createState: ref({ loading: false, error: null, data: undefined }),
        updateState: ref({ loading: false, error: null, data: undefined }),
      });

      // Set up the mock profiles repository
      vi.mocked(useRepositoryProfiles).mockReturnValue({
        getProfileById: vi.fn(),
        getProfileByIdState: ref({
          loading: false,
          error: null,
          data: { id: '123', user_id: '456', accreditation_status: AccreditationTypes.declined },
        }),
        getUserState: ref({ loading: false, error: null, data: { profiles: [] } }),
      });

      // Set up the mock profiles store with declined status
      const mockStore = {
        selectedUserProfileData: ref({
          id: '123',
          user_id: '456',
          accreditation_status: AccreditationTypes.declined,
        }),
        selectedUserProfileId: ref('123'),
        selectedUserProfileType: ref('individual'),
      };
      vi.mocked(useProfilesStore).mockReturnValue(mockStore);

      const store = useAccreditationUpload();
      const mockFile = new File([''], 'test.pdf');
      const mockNote = 'Test note';

      // Set up the store state
      store.accreditationFiles = [mockFile];
      store.accreditationDescriptions = ['Test description'];
      store.accreditationNote = mockNote;

      await store.sendFiles();

      expect(uploadDocumentSpy).toHaveBeenCalled();
      expect(updateSpy).toHaveBeenCalledWith('123', mockNote);
      expect(store.isLoading).toBe(false);
    });

    it('should handle multiple file uploads successfully', async () => {
      // Clear previous mocks
      vi.clearAllMocks();

      // Set up the mock repository first
      const uploadDocumentSpy = vi.fn().mockResolvedValue({});
      const createSpy = vi.fn().mockResolvedValue({});
      vi.mocked(useRepositoryAccreditation).mockReturnValue({
        uploadDocument: uploadDocumentSpy,
        create: createSpy,
        update: vi.fn(),
        createState: ref({ loading: false, error: null, data: undefined }),
        updateState: ref({ loading: false, error: null, data: undefined }),
      } as any);

      // Set up the mock profiles repository
      vi.mocked(useRepositoryProfiles).mockReturnValue({
        getProfileById: vi.fn(),
        getProfileByIdState: ref({
          loading: false,
          error: null,
          data: { id: '123', user_id: '456', accreditation_status: 'new' },
        }),
        getUserState: ref({ loading: false, error: null, data: { profiles: [] } }),
      } as any);

      // Set up the mock profiles store with new status
      const mockStore = {
        selectedUserProfileData: ref({
          id: '123',
          user_id: '456',
          accreditation_status: 'new',
          isAccreditationNew: true,
        }),
        selectedUserProfileId: ref('123'),
        selectedUserProfileType: ref('individual'),
      };
      vi.mocked(useProfilesStore).mockReturnValue(mockStore as any);

      const store = useAccreditationUpload();
      const mockFiles = [
        new File([''], 'test1.pdf'),
        new File([''], 'test2.pdf'),
      ];
      const mockDescriptions = ['Description 1', 'Description 2'];
      const mockNote = 'Test note';

      // Set up the store state
      store.accreditationFiles = mockFiles;
      store.accreditationDescriptions = mockDescriptions;
      store.accreditationNote = mockNote;

      await store.sendFiles();

      expect(uploadDocumentSpy).toHaveBeenCalledTimes(2);
      expect(createSpy).toHaveBeenCalledWith('123', mockNote);
      expect(store.isLoading).toBe(false);
    });

    it('should not proceed with upload if no files are selected', async () => {
      // Set up the mock repository first
      const uploadDocumentSpy = vi.fn();
      vi.mocked(useRepositoryAccreditation).mockReturnValue({
        uploadDocument: uploadDocumentSpy,
        create: vi.fn(),
        update: vi.fn(),
        createState: ref({ loading: false, error: null, data: undefined }),
        updateState: ref({ loading: false, error: null, data: undefined }),
      });

      // Set up the mock profiles repository
      vi.mocked(useRepositoryProfiles).mockReturnValue({
        getProfileById: vi.fn(),
        getProfileByIdState: ref({
          loading: false,
          error: null,
          data: { id: '123', user_id: '456', accreditation_status: 'new' },
        }),
        getUserState: ref({ loading: false, error: null, data: { profiles: [] } }),
      });

      const store = useAccreditationUpload();
      store.accreditationFiles = [];
      store.accreditationNote = 'Test note';

      await store.sendFiles();

      expect(uploadDocumentSpy).not.toHaveBeenCalled();
      expect(store.isLoading).toBe(false);
    });
  });

  describe('error handling', () => {
    it('should return error tex', () => {
      // Reset the mock before the test
      vi.clearAllMocks();

      // Create a new mock with required refs
      const mockStore = {
        selectedUserProfileData: ref({
          id: '123',
          user_id: '456',
          accreditation_status: 'new',
        }),
        selectedUserProfileId: ref('123'),
        selectedUserProfileType: ref('individual'),
      };

      // Override the mock implementation for this test
      vi.mocked(useProfilesStore).mockReturnValue(mockStore);

      const mockError = { description1: 'Error message' };
      vi.mocked(useRepositoryAccreditation).mockReturnValue({
        uploadDocument: vi.fn(),
        create: vi.fn(),
        update: vi.fn(),
        createState: ref({ loading: false, error: mockError, data: undefined }),
        updateState: ref({ loading: false, error: null, data: undefined }),
      });

      const store = useAccreditationUpload();
      expect(store.getErrorText(1)).toBe('Error message');
    });

    it('should handle multiple error messages', () => {
      const mockError = {
        description1: 'Error in description 1',
        description2: 'Error in description 2',
      };

      vi.mocked(useRepositoryAccreditation).mockReturnValue({
        uploadDocument: vi.fn(),
        create: vi.fn(),
        update: vi.fn(),
        createState: ref({ loading: false, error: mockError, data: undefined }),
        updateState: ref({ loading: false, error: null, data: undefined }),
      });

      const store = useAccreditationUpload();
      expect(store.getErrorText(1)).toBe('Error in description 1');
      expect(store.getErrorText(2)).toBe('Error in description 2');
    });

    it('should handle undefined error values', () => {
      // Clear previous mocks
      vi.clearAllMocks();

      // Set up the mock with undefined error before creating the store
      const mockError = undefined;
      vi.mocked(useRepositoryAccreditation).mockReturnValue({
        uploadDocument: vi.fn(),
        create: vi.fn(),
        update: vi.fn(),
        createState: ref({ loading: false, error: mockError, data: undefined }),
        updateState: ref({ loading: false, error: null, data: undefined }),
      });

      const store = useAccreditationUpload();
      expect(store.getErrorText(1)).toBeUndefined();
    });

    it('should handle empty error object', () => {
      // Clear previous mocks
      vi.clearAllMocks();

      // Set up the mock with empty error object before creating the store
      const mockError = {};
      vi.mocked(useRepositoryAccreditation).mockReturnValue({
        uploadDocument: vi.fn(),
        create: vi.fn(),
        update: vi.fn(),
        createState: ref({ loading: false, error: mockError, data: undefined }),
        updateState: ref({ loading: false, error: null, data: undefined }),
      });

      const store = useAccreditationUpload();
      expect(store.getErrorText(1)).toBeUndefined();
    });

    it('should handle non-existent error keys', () => {
      // Clear previous mocks
      vi.clearAllMocks();

      // Set up the mock with specific error before creating the store
      const mockError = {
        description1: 'Error in description 1',
      };
      vi.mocked(useRepositoryAccreditation).mockReturnValue({
        uploadDocument: vi.fn(),
        create: vi.fn(),
        update: vi.fn(),
        createState: ref({ loading: false, error: mockError, data: undefined }),
        updateState: ref({ loading: false, error: null, data: undefined }),
      });

      const store = useAccreditationUpload();
      expect(store.getErrorText(2)).toBeUndefined();
    });
  });
});
