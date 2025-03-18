<script setup lang="ts">
import {
  watch, PropType, reactive, ref, computed,
} from 'vue';
import { useUserProfilesStore } from 'InvestCommon/store/useUserProfiles';
import FormRow from 'UiKit/components/Base/VForm/VFormRow.vue';
import FormCol from 'UiKit/components/Base/VForm/VFormCol.vue';
import { storeToRefs } from 'pinia';
import VFormGroup from 'UiKit/components/Base/VForm/VFormGroup.vue';
import VFormSelect from 'UiKit/components/Base/VForm/VFormSelect.vue';
import VFormInput from 'UiKit/components/Base/VForm/VFormInput.vue';
import { JSONSchemaType } from 'ajv/dist/types/json-schema';
import { errorMessageRule } from 'UiKit/helpers/validation/rules';
import { PrecompiledValidator } from 'UiKit/helpers/validation/PrecompiledValidator';
import { filterSchema, getFilteredObject } from 'UiKit/helpers/validation/general';
import { isEmpty } from 'UiKit/helpers/general';
import { createFormModel, getOptions } from 'UiKit/helpers/model';

interface FormModelSdira {
  full_account_name: string | undefined;
  type: string | undefined;
  account_number: string | undefined;
}

const props = defineProps({
  modelData: Object as PropType<FormModelSdira>,
});

const userIdentityStore = useUserProfilesStore();
const {
  setProfileByIdErrorData, getProfileByIdOptionsData, isGetProfileByIdLoading,
} = storeToRefs(userIdentityStore);

const schema = {
  $schema: 'http://json-schema.org/draft-07/schema#',
  definitions: {
    Sdira: {
      properties: {
        full_account_name: {},
        type: {},
        account_number: {},
      },
      type: 'object',
      errorMessage: errorMessageRule,
      required: ['full_account_name', 'type', 'account_number'],
    },
  },
  $ref: '#/definitions/Sdira',
} as unknown as JSONSchemaType<FormModelSdira>;

const model = reactive<FormModelSdira>({
  full_account_name: props.modelData?.full_account_name,
  type: props.modelData?.type,
  account_number: props.modelData?.account_number,
});
const formModel = createFormModel(schema);
let validator = new PrecompiledValidator<FormModelSdira>(
  filterSchema(getProfileByIdOptionsData.value, formModel),
  schema,
);
const validation = ref<unknown>();
const isValid = computed(() => isEmpty(validation.value || {}));

const onValidate = () => {
  validation.value = validator.getFormValidationErrors(model);
};

const schemaObject = computed(() => getFilteredObject(getProfileByIdOptionsData.value, formModel));
const optionsCustodian = computed(() => getOptions('type', schemaObject));

defineExpose({
  model, validation, validator, isValid, onValidate,
});

watch(() => props.modelData, () => {
  if (props.modelData?.full_account_name) {
    model.full_account_name = props.modelData?.full_account_name;
  }
  if (props.modelData?.type) {
    model.type = props.modelData?.type;
  }
  if (props.modelData?.account_number) {
    model.account_number = props.modelData?.account_number;
  }
}, { deep: true });

watch(() => model, () => {
  if (!isValid.value) onValidate();
}, { deep: true });

watch(() => [getProfileByIdOptionsData.value, schema], () => {
  validator = new PrecompiledValidator<FormModelSdira>(
    filterSchema(getProfileByIdOptionsData.value, formModel),
    schema,
  );
});
</script>

<template>
  <div class="VFormPartialCustodian v-form-partial-custodian">
    <div class="v-form-partial-custodian__subtitle is--h3__title">
      Custodian Information
    </div>
    <FormRow>
      <FormCol col2>
        <VFormGroup
          v-slot="VFormGroupProps"
          :model="model"
          :validation="validation"
          :schema-back="getProfileByIdOptionsData"
          :schema-front="schema"
          :error-text="setProfileByIdErrorData?.type"
          path="type"
          label="Custodian"
          data-testid="type-group"
        >
          <VFormSelect
            v-model="model.type"
            :is-error="VFormGroupProps.isFieldError"
            name="type"
            size="large"
            placeholder="Custodian"
            item-label="name"
            item-value="value"
            searchable
            :options="optionsCustodian"
            data-testid="type"
            :loading="isGetProfileByIdLoading || (optionsCustodian?.length === 0)"
          />
        </VFormGroup>
      </FormCol>
      <FormCol col2>
        <VFormGroup
          v-slot="VFormGroupProps"
          :model="model"
          :validation="validation"
          :schema-back="getProfileByIdOptionsData"
          :schema-front="schema"
          :error-text="setProfileByIdErrorData?.account_number"
          path="account_number"
          label="Account Number"
          data-testid="account_number-group"
        >
          <VFormInput
            :model-value="model.account_number"
            :is-error="VFormGroupProps.isFieldError"
            placeholder="Account Number"
            name="account_number"
            size="large"
            data-testid="account_number"
            :loading="isGetProfileByIdLoading"
            @update:model-value="model.account_number = $event"
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
          :error-text="setProfileByIdErrorData?.full_account_name"
          path="full_account_name"
          label="Full Account Name"
          data-testid="full-account-name-group"
        >
          <VFormInput
            :model-value="model.full_account_name"
            :is-error="VFormGroupProps.isFieldError"
            placeholder="Full Account Name"
            name="full_account_name"
            size="large"
            data-testid="full-account-name"
            :loading="isGetProfileByIdLoading"
            @update:model-value="model.full_account_name = $event"
          />
        </VFormGroup>
      </FormCol>
    </FormRow>
  </div>
</template>

<style lang="scss">
.v-form-partial-custodian {
  display: flex;
  flex-direction: column;
  width: 100%;

  &__subtitle {
    margin-bottom: 20px;
    margin-top: 12px;
  }
}
</style>
