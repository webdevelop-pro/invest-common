import {
  computed, reactive, ref, watch,
} from 'vue';
import { PrecompiledValidator } from 'UiKit/helpers/validation/PrecompiledValidator';
import { JSONSchemaType } from 'ajv';
import { filterSchema } from 'UiKit/helpers/validation/general';
import { isEmpty } from 'UiKit/helpers/general';
import { createFormModel } from 'UiKit/helpers/model';

export function useFormValidator<T extends object>(
  initialValues: T,
  schema: JSONSchemaType<T>,
  optionsData?: JSONSchemaType<T>,
) {
  const model = reactive<T>({ ...initialValues });

  const formModel = createFormModel(schema);

  const schema1 = optionsData ? filterSchema(optionsData, formModel) : {};
  let validator = new PrecompiledValidator<T>(
    schema1,
    schema,
  );

  const validation = ref<unknown>();
  const isValid = computed(() => isEmpty(validation.value || {}));

  const onValidate = () => {
    validation.value = validator.getFormValidationErrors(model);
  };


  watch(() => model, () => {
    if (!isValid.value) onValidate();
  }, { deep: true });

  watch(() => optionsData, () => {
    validator = new PrecompiledValidator<T>(
      schema1,
      schema,
    );
  });

  return {
    model,
    formModel,
    validator,
    validation,
    isValid,
    onValidate,
  };
}
