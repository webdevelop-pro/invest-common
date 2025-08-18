import {
  computed, reactive, ref, watch, unref, type Ref, type ComputedRef, type Reactive,
} from 'vue';
import { PrecompiledValidator } from 'UiKit/helpers/validation/PrecompiledValidator';
import { isEmpty } from 'InvestCommon/helpers/general';
import { createFormModel } from 'UiKit/helpers/model';
import { getFilteredObject, filterSchema } from 'UiKit/helpers/validation/general';
import type { JSONSchemaType } from 'ajv/dist/types/json-schema';

export interface FormValidationReturn<T> {
  model: Reactive<T>;
  validation: Ref<unknown>;
  isValid: ComputedRef<boolean>;
  onValidate: () => void;
  validator: ComputedRef<PrecompiledValidator<T>>;
  schemaObject: Ref<unknown>;
  resetValidation: () => void;
}

export function useFormValidation<T extends object>(
  schema: JSONSchemaType<T> | Ref<JSONSchemaType<T>>,
  schemaBackend: JSONSchemaType<T> | Ref<JSONSchemaType<T>> | undefined,
  initialModel: T,
): FormValidationReturn<T> {
  const model = reactive<T>({ ...initialModel });
  const validation = ref<unknown>();
  // const schemaObject = ref<unknown>();

  // Memoize schema values to avoid unnecessary recalculations
  const currentSchema = computed(() => unref(schema));
  const currentSchemaBackend = computed(() => (
    schemaBackend ? unref(schemaBackend) : undefined));
  const formModel = computed(() => createFormModel(currentSchemaBackend.value || currentSchema.value) || {});
  const schemaObject = computed(() => (
    getFilteredObject(currentSchemaBackend.value || currentSchema.value, formModel.value) || {}));

  // Create validator with memoization
  const validator = computed(() => {
    if (!currentSchemaBackend.value) return new PrecompiledValidator<T>(currentSchema.value);
    return new PrecompiledValidator<T>(filterSchema(currentSchemaBackend.value, formModel.value), currentSchema.value);
  });

  const isValid = computed(() => isEmpty(validation.value || {}));

  const onValidate = () => {
    validation.value = validator.value.getFormValidationErrors(model);
    console.log('Validation result:', validation.value);
  };

  const resetValidation = () => {
    validation.value = undefined;
  };

  // Watch model changes and validate only when not valid
  watch(() => model, () => {
    if (!isValid.value) {
      onValidate();
    }
  }, { deep: true });

  return {
    model,
    validation,
    isValid,
    onValidate,
    validator,
    schemaObject,
    resetValidation,
  };
}
