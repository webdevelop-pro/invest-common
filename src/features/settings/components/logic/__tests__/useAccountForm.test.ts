import { describe, it, expect, beforeEach, vi } from 'vitest';
import { setActivePinia, createPinia } from 'pinia';
import { ref } from 'vue';
import { useAccountForm } from '../useAccountForm';

vi.mock('InvestCommon/data/profiles/profiles.repository', () => ({
  useRepositoryProfiles: vi.fn(() => ({
    setUserState: ref({
      data: null,
      loading: false,
      error: null,
    }),
    setUserOptionsState: ref({
      data: null,
      loading: false,
      error: null,
    }),
  })),
}));

vi.mock('InvestCommon/composable/useFormValidation', () => ({
  useFormValidation: vi.fn(() => ({
    model: {
      first_name: '',
      last_name: '',
      middle_name: '',
      email: '',
      phone: '',
    },
    validation: null,
    isValid: true,
    onValidate: vi.fn(),
    validator: {
      value: {
        getFormValidationErrors: vi.fn(() => ({})),
      },
    },
  })),
}));

vi.mock('InvestCommon/components/dialogs/VDialogContactUs.vue', () => ({
  default: {
    name: 'VDialogContactUs',
    template: '<div>Mock Dialog</div>',
  },
}));

describe('useAccountForm', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    vi.clearAllMocks();
  });

  it('should initialize with default values when no props are provided', () => {
    const { model, isValid, errorData, schemaBackend } = useAccountForm({});

    expect(model).toBeDefined();
    expect(isValid).toBe(true);
    expect(errorData.value).toBeUndefined();
    expect(schemaBackend.value).toBeNull();
  });

  it('should populate form with provided model data', () => {
    const testData = {
      first_name: 'John',
      last_name: 'Doe',
      middle_name: 'M',
      email: 'john.doe@example.com',
      phone: '+1234567890',
    };

    const { model } = useAccountForm({ modelData: testData });

    expect(model.first_name).toBe('John');
    expect(model.last_name).toBe('Doe');
    expect(model.middle_name).toBe('M');
    expect(model.email).toBe('john.doe@example.com');
    expect(model.phone).toBe('+1234567890');
  });

  it('should handle partial model data', () => {
    const partialData = {
      first_name: 'Jane',
      last_name: 'Smith',
      email: 'jane@example.com',
    };

    const { model } = useAccountForm({ modelData: partialData });

    expect(model.first_name).toBe('Jane');
    expect(model.last_name).toBe('Smith');
    expect(model.email).toBe('jane@example.com');
    expect(model.middle_name).toBe('');
    expect(model.phone).toBe('');
  });

  it('should generate correct JSON schema structure', () => {
    const { schema } = useAccountForm({});

    expect(schema.value.$schema).toBe('http://json-schema.org/draft-07/schema#');
    expect(schema.value.$ref).toBe('#/definitions/UserUpdate');
    expect(schema.value.definitions?.UserUpdate).toBeDefined();
    expect(schema.value.definitions?.UserUpdate.type).toBe('object');
    expect(schema.value.definitions?.UserUpdate.required).toEqual(['first_name', 'last_name', 'email']);
  });

  it('should include validation rules for all form fields', () => {
    const { schema } = useAccountForm({});

    const userSchema = schema.value.definitions?.UserUpdate;
    expect(userSchema).toBeDefined();
    
    if (userSchema) {
      expect(userSchema.properties.first_name).toBeDefined();
      expect(userSchema.properties.last_name).toBeDefined();
      expect(userSchema.properties.email).toBeDefined();
      expect(userSchema.properties.middle_name).toBeDefined();
      expect(userSchema.properties.phone).toBeDefined();
    }
  });

  it('should provide form validation methods and state', () => {
    const { validation, isValid, onValidate, validator } = useAccountForm({});

    expect(validation).toBeDefined();
    expect(isValid).toBeDefined();
    expect(onValidate).toBeDefined();
    expect(validator).toBeDefined();
  });

  it('should provide VDialogContactUs component and manage dialog state', () => {
    const { VDialogContactUs, isDialogContactUsOpen } = useAccountForm({});

    expect(VDialogContactUs).toBeDefined();
    expect(isDialogContactUsOpen.value).toBe(false);
  });

  it('should pass correct parameters to useFormValidation', async () => {
    const { useFormValidation } = await vi.importMock('InvestCommon/composable/useFormValidation');
    const mockUseFormValidation = vi.mocked(useFormValidation) as any;
    
    useAccountForm({});

    expect(mockUseFormValidation).toHaveBeenCalled();
    
    const callArgs = mockUseFormValidation.mock.calls[0];
    expect(callArgs[0]).toBeDefined();
    expect(callArgs[1]).toBeDefined();
    expect(callArgs[2]).toEqual({} as any);
  });
});
