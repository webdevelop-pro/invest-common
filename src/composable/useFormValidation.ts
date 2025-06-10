import {
  computed, reactive, ref, watch,
} from 'vue';
import { PrecompiledValidator } from 'UiKit/helpers/validation/PrecompiledValidator';
import { isEmpty } from 'InvestCommon/helpers/general';

export function useFormValidation<T extends object>(
  schema: any,
  schemaBackend: any,
  initialModel: T,
) {
  const model = reactive<T>({ ...initialModel });
  let validator = new PrecompiledValidator<T>(schemaBackend, schema);
  const validation = ref<unknown>();
  const isValid = computed(() => isEmpty(validation.value || {}));

  const onValidate = () => {
    validation.value = validator.getFormValidationErrors(model);
  };

  watch(() => schemaBackend, () => {
    validator = new PrecompiledValidator<T>(schemaBackend, schema);
  });

  watch(() => model, () => {
    if (!isValid.value) onValidate();
  }, { deep: true });

  return {
    model,
    validation,
    isValid,
    onValidate,
    validator,
  };
}
