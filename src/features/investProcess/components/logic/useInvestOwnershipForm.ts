import { computed, watch } from 'vue';
import { JSONSchemaType } from 'ajv/dist/types/json-schema';
import { useFormValidation } from 'UiKit/helpers/validation/useFormValidation';
import { useForm } from 'UiKit/composables/useForm';

export type FormModelInvestOwnership = {
  profile_id: number;
}

export interface UseInvestOwnershipFormProps {
  modelValue?: any;
  errorData?: any;
  data: any;
  backendSchema: any;
  isLoading: boolean;
}

export interface UseInvestOwnershipFormEmits {
  (e: 'update:modelValue', value: any): void;
}

export function useInvesOwnershipForm(
  props: UseInvestOwnershipFormProps,
  emit: UseInvestOwnershipFormEmits
) {

  // Dynamic schema with computed validation rules
  const schemaFrontend = computed(() => ({
    $schema: 'http://json-schema.org/draft-07/schema#',
    definitions: {
      AmountStep: {
        properties: {
          profile_id: {
            type: 'number',
          },
        },
        required: ['profile_id'],
        type: 'object',
      },
    },
    $ref: '#/definitions/AmountStep',
  } as unknown as JSONSchemaType<FormModelInvestOwnership>));

  const fieldsPaths = ['profile_id'];

  // Use form validation composable
  const {
    model,
    validation,
    isValid,
    onValidate,
    scrollToError,
    formErrors,
    isFieldRequired,
    getErrorText,
    getOptions,
    getReferenceType,
  } = useFormValidation<FormModelInvestOwnership>(
    schemaFrontend,
    props.backendSchema,
    {} as FormModelInvestOwnership,
    fieldsPaths
  );

  const isBtnDisabled = computed(() => !isValid.value);

  // Emit form updates
  const emitFormUpdate = () => {
    emit('update:modelValue', {
      ...(props.modelValue || {}),
      profile_id: model.profile_id,
    });
  };

  // Watch for validation and model changes
  // immediate: true ensures initial backend/profile value is pushed into parent modelValue on mount
  watch(model, emitFormUpdate, { deep: true, immediate: true });

  // Watch for external model value changes
  watch(() => props.modelValue, (newValue) => {
    if (newValue?.profile_id !== undefined && newValue.profile_id !== model.profile_id) {
      model.profile_id = newValue.profile_id;
    }
  }, { immediate: true });

  // Watch for number of shares changes from offer data
  watch(() => props.data?.profile_id, () => {
    if (props.data?.profile_id) {
      model.profile_id = props.data?.profile_id;
    }
  }, { immediate: true });

  // Track dirty state based on backend profile_id
  const { isDirty } = useForm<FormModelInvestOwnership>({
    initialValues: computed(() => ({
      profile_id: props.data?.profile_id as number | undefined,
    })),
    currentValues: model,
  });

  return {
    model,
    validation,
    isValid,
    onValidate,
    schemaFrontend,
    isBtnDisabled,
    // Form validation helpers
    formErrors,
    isFieldRequired,
    getErrorText,
    getOptions,
    getReferenceType,
    scrollToError,

    // Dirty state
    isDirty,
  };
}

