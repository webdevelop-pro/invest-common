/* eslint-disable @typescript-eslint/no-unused-vars */
import {
  describe, it, expect, vi, beforeEach, afterEach,
} from 'vitest';
import { setActivePinia, createPinia } from 'pinia';
import { ref } from 'vue';
import { useRepositoryProfiles } from 'InvestCommon/data/profiles/profiles.repository';
import { useAccountForm } from '../useAccountForm';

const mockSetUserState = ref<any>({
  data: null,
  loading: false,
  error: null,
});

const mockSetUserOptionsState = ref<any>({
  data: null,
  loading: false,
  error: null,
});

const mockRepositoryProfiles = {
  setUserState: mockSetUserState,
  setUserOptionsState: mockSetUserOptionsState,
};

vi.mock('InvestCommon/data/profiles/profiles.repository', () => ({
  useRepositoryProfiles: vi.fn(() => mockRepositoryProfiles),
}));

vi.mock('InvestCommon/components/dialogs/VDialogContactUs.vue', () => ({
  default: {
    name: 'VDialogContactUs',
    template: '<div>Mock Dialog</div>',
  },
}));

describe('useAccountForm', () => {
  let composable: ReturnType<typeof useAccountForm>;
  let mockRepositoryProfilesInstance: any;

  beforeEach(() => {
    setActivePinia(createPinia());

    mockRepositoryProfilesInstance = vi.mocked(useRepositoryProfiles)();

    vi.clearAllMocks();

    // Reset mock values
    mockSetUserState.value = {
      data: null,
      loading: false,
      error: null,
    };
    mockSetUserOptionsState.value = {
      data: null,
      loading: false,
      error: null,
    };
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Initialization', () => {
    it('should initialize with default values when no props are provided', () => {
      composable = useAccountForm({});

      expect(composable.model).toBeDefined();
      expect(composable.isValid).toBeDefined();
      expect(composable.errorData.value).toBeUndefined();
      expect(composable.schemaBackend.value).toBeNull();
      expect(composable.isDialogContactUsOpen.value).toBe(false);
    });

    it('should initialize with provided model data', () => {
      const testData = {
        first_name: 'John',
        last_name: 'Doe',
        email: 'john.doe@example.com',
        phone: '+1234567890',
      };

      composable = useAccountForm({ modelData: testData });

      expect(composable.model.first_name).toBe('John');
      expect(composable.model.last_name).toBe('Doe');
      expect(composable.model.email).toBe('john.doe@example.com');
      expect(composable.model.phone).toBe('+1234567890');
    });
    
  });

  describe('Schema generation', () => {
    it('should generate correct JSON schema structure', () => {
      composable = useAccountForm({});

      expect(composable.schema.value.$schema).toBe('http://json-schema.org/draft-07/schema#');
      expect(composable.schema.value.$ref).toBe('#/definitions/UserUpdate');
      expect(composable.schema.value.definitions?.UserUpdate).toBeDefined();
      expect(composable.schema.value.definitions?.UserUpdate.type).toBe('object');
      expect(composable.schema.value.definitions?.UserUpdate.required).toEqual(['first_name', 'last_name', 'email']);
    });

    it('should include validation rules for all form fields', () => {
      composable = useAccountForm({});

      const userSchema = composable.schema.value.definitions?.UserUpdate;
      expect(userSchema).toBeDefined();
      
      if (userSchema) {
        expect(userSchema.properties.first_name).toBeDefined();
        expect(userSchema.properties.last_name).toBeDefined();
        expect(userSchema.properties.email).toBeDefined();
        expect(userSchema.properties.phone).toBeDefined();
      }
    });

    it('should have correct required fields', () => {
      composable = useAccountForm({});

      const userSchema = composable.schema.value.definitions?.UserUpdate;
      expect(userSchema?.required).toContain('first_name');
      expect(userSchema?.required).toContain('last_name');
      expect(userSchema?.required).toContain('email');
      expect(userSchema?.required).not.toContain('phone'); // phone is optional
    });
  });

  describe('Error handling', () => {
    it('should handle API errors correctly', () => {
      const mockError = {
        data: {
          responseJson: {
            message: 'Validation failed',
            errors: ['Invalid email format'],
          },
        },
      };

      mockSetUserState.value.error = mockError;
      composable = useAccountForm({});

      expect(composable.errorData.value).toEqual(mockError.data.responseJson);
    });
  });

  describe('Schema backend integration', () => {
    it('should handle schema backend data', () => {
      const mockBackendData = {
        properties: {
          first_name: { type: 'string' },
          last_name: { type: 'string' },
        },
      };

      mockSetUserOptionsState.value.data = mockBackendData;
      composable = useAccountForm({});

      expect(composable.schemaBackend.value).toEqual(mockBackendData);
    });

    it('should handle null schema backend data', () => {
      mockSetUserOptionsState.value.data = null;
      composable = useAccountForm({});

      expect(composable.schemaBackend.value).toBeNull();
    });
  });

  describe('Dialog management', () => {
    it('should provide VDialogContactUs component', () => {
      composable = useAccountForm({});

      expect(composable.VDialogContactUs).toBeDefined();
    });

    it('should manage dialog state correctly', () => {
      composable = useAccountForm({});

      expect(composable.isDialogContactUsOpen.value).toBe(false);
      
      // Test dialog state changes
      composable.isDialogContactUsOpen.value = true;
      expect(composable.isDialogContactUsOpen.value).toBe(true);
    });
  });

  describe('Repository integration', () => {
    it('should provide repository state', () => {
      composable = useAccountForm({});

      expect(composable.setUserState).toBeDefined();
      expect(composable.setUserState.value).toEqual(mockSetUserState.value);
    });

    it('should handle repository loading states', () => {
      mockSetUserState.value.loading = true;
      composable = useAccountForm({});

      expect(composable.setUserState.value.loading).toBe(true);
    });
  });

  describe('Model synchronization', () => {
    it('should update model when props change', () => {
      composable = useAccountForm({});

      const newData = {
        first_name: 'Updated',
        last_name: 'Name',
        email: 'updated@example.com',
        phone: '+9876543210',
      };

      // Simulate props change by calling useAccountForm again
      const newComposable = useAccountForm({ modelData: newData });

      expect(newComposable.model.first_name).toBe('Updated');
      expect(newComposable.model.last_name).toBe('Name');
      expect(newComposable.model.email).toBe('updated@example.com');
      expect(newComposable.model.phone).toBe('+9876543210');
    });

  });

  describe('Integration workflow', () => {
    it('should handle complete form initialization workflow', () => {
      const testData = {
        first_name: 'John',
        last_name: 'Doe',
        email: 'john@example.com',
        phone: '+1234567890',
      };

      mockSetUserState.value = {
        data: { id: '123' },
        loading: false,
        error: null,
      };

      mockSetUserOptionsState.value = {
        data: { properties: {} },
        loading: false,
        error: null,
      };

      composable = useAccountForm({ modelData: testData, readOnly: false });

      expect(composable.model).toEqual(testData);
      expect(composable.isValid).toBeDefined();
      expect(composable.errorData.value).toBeUndefined();
      expect(composable.schemaBackend.value).toEqual({ properties: {} });
      expect(composable.isDialogContactUsOpen.value).toBe(false);
    });

    it('should handle error state workflow', () => {
      const mockError = {
        data: {
          responseJson: {
            message: 'Server error',
            code: 'INTERNAL_ERROR',
          },
        },
      };

      mockSetUserState.value.error = mockError;

      composable = useAccountForm({});

      expect(composable.errorData.value).toEqual(mockError.data.responseJson);
    });
  });
});
