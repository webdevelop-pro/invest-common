<script setup lang="ts">
import {
  watch, PropType, reactive, ref, computed,
} from 'vue';
import { useUserProfilesStore } from 'InvestCommon/store/useUserProfiles';
import FormRow from 'UiKit/components/Base/VForm/VFormRow.vue';
import FormCol from 'UiKit/components/Base/VForm/VFormCol.vue';
import { storeToRefs } from 'pinia';
import VFormGroup from 'UiKit/components/Base/VForm/VFormGroup.vue';
import VFormRadio from 'UiKit/components/Base/VForm/VFormRadio.vue';
import VFormInput from 'UiKit/components/Base/VForm/VFormInput.vue';
import { JSONSchemaType } from 'ajv/dist/types/json-schema';
import { errorMessageRule } from 'UiKit/helpers/validation/rules';
import { PrecompiledValidator } from 'UiKit/helpers/validation/PrecompiledValidator';
import { filterSchema } from 'UiKit/helpers/validation/general';
import { isEmpty } from 'UiKit/helpers/general';
import { createFormModel } from 'UiKit/helpers/model';

const yesNoOptions = [
  { value: 'Yes', text: 'Yes' },
  { value: 'No', text: 'No' },
];
interface FormModelPlanInformation {
  name: string | undefined;
  is_use_ein: string | undefined;
  ein?: string | undefined;
}

const props = defineProps({
  modelData: Object as PropType<FormModelPlanInformation>,
});

const userIdentityStore = useUserProfilesStore();
const {
  setProfileByIdErrorData, getProfileByIdOptionsData, isGetProfileByIdLoading,
} = storeToRefs(userIdentityStore);

const model = reactive<FormModelPlanInformation>({
  name: props.modelData?.name,
  is_use_ein: props.modelData?.is_use_ein || props.modelData?.ein ? 'Yes' : 'No',
  ein: props.modelData?.ein,
});

const required = computed(() => {
  if (model.is_use_ein && model.is_use_ein === 'Yes') {
    return ['name', 'is_use_ein', 'ein'];
  }
  return ['name', 'is_use_ein'];
});

const schema = computed(() => ({
  $schema: 'http://json-schema.org/draft-07/schema#',
  definitions: {
    Solo401k: {
      properties: {
        name: {},
        is_use_ein: {},
        ein: {},
      },
      type: 'object',
      errorMessage: errorMessageRule,
      required: required.value,
    },
  },
  $ref: '#/definitions/Solo401k',
} as unknown as JSONSchemaType<FormModelPlanInformation>));
const formModel = createFormModel(schema.value);
let validator = new PrecompiledValidator<FormModelPlanInformation>(
  filterSchema(getProfileByIdOptionsData.value, formModel),
  schema.value,
);
const validation = ref<unknown>();
const isValid = computed(() => isEmpty(validation.value || {}));

const onValidate = () => {
  validation.value = validator.getFormValidationErrors(model);
};

const modelExpose = computed(() => {
  const temp = { ...model };
  delete temp.is_use_ein;
  return temp;
});

defineExpose({
  model: modelExpose, validation, validator, isValid, onValidate,
});

watch(() => props.modelData, () => {
  if (props.modelData?.name) {
    model.name = props.modelData?.name;
  }
  if (props.modelData?.ein) {
    model.ein = props.modelData?.ein;
    model.is_use_ein = 'Yes';
  }
}, { deep: true });

watch(() => model, () => {
  if (!isValid.value) onValidate();
}, { deep: true });

watch(() => [getProfileByIdOptionsData.value, schema.value], () => {
  validator = new PrecompiledValidator<FormModelPlanInformation>(
    filterSchema(getProfileByIdOptionsData.value, formModel),
    schema.value,
  );
});
</script>

<template>
  <div class="VFormPartialPlanInformation v-form-partial-plan-information">
    <div class="v-form-partial-plan-information__subtitle is--h3__title">
      Plan Information
    </div>
    <FormRow>
      <FormCol>
        <VFormGroup
          v-slot="VFormGroupProps"
          :model="model"
          :validation="validation"
          :schema-back="getProfileByIdOptionsData"
          :schema-front="schema"
          :error-text="setProfileByIdErrorData?.name"
          path="name"
          label="Name of the Solo 401(k)"
          data-testid="name-group"
        >
          <VFormInput
            :model-value="model.name"
            :is-error="VFormGroupProps.isFieldError"
            placeholder="Name of the Solo 401(k)"
            name="name"
            size="large"
            data-testid="name"
            :loading="isGetProfileByIdLoading"
            @update:model-value="model.name = $event"
          />
        </VFormGroup>
      </FormCol>
    </FormRow>
    <FormRow>
      <FormCol>
        <VFormGroup
          v-slot="VFormGroupProps"
          :model="model"
          :validation="validation"
          :schema-back="getProfileByIdOptionsData"
          :schema-front="schema"
          :error-text="setProfileByIdErrorData?.is_use_ein"
          path="is_use_ein"
          data-testid="is-use-ein-group"
          label="Does this Solo 401K use an EIN for tax filing?"
        >
          <VFormRadio
            v-model="model.is_use_ein"
            :is-error="VFormGroupProps.isFieldError"
            :options="yesNoOptions"
            row
          />
        </VFormGroup>
      </FormCol>
    </FormRow>
    <FormRow v-if="model.is_use_ein === 'Yes'">
      <FormCol>
        <VFormGroup
          v-slot="VFormGroupProps"
          :model="model"
          :validation="validation"
          :schema-back="getProfileByIdOptionsData"
          :schema-front="schema"
          :error-text="setProfileByIdErrorData?.ein"
          path="ein"
          label="EIN"
          data-testid="ein-group"
        >
          <VFormInput
            :model-value="model.ein"
            :is-error="VFormGroupProps.isFieldError"
            placeholder="XX-XXXXXXX"
            name="ein"
            size="large"
            mask="##-#######"
            disallow-special-chars
            data-testid="ein"
            :loading="isGetProfileByIdLoading"
            @update:model-value="model.ein = $event"
          />
        </VFormGroup>
      </FormCol>
    </FormRow>
  </div>
</template>

<style lang="scss">
.v-form-partial-plan-information {
  display: flex;
  flex-direction: column;
  width: 100%;

  &__subtitle {
    margin-bottom: 20px;
    margin-top: 12px;
  }
}
</style>
