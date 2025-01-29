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
import VFormSelect from 'UiKit/components/Base/VForm/VFormSelect.vue';
import VFormInput from 'UiKit/components/Base/VForm/VFormInput.vue';
import { JSONSchemaType } from 'ajv/dist/types/json-schema';
import { errorMessageRule } from 'UiKit/helpers/validation/rules';
import { PrecompiledValidator } from 'UiKit/helpers/validation/PrecompiledValidator';
import { filterSchema, getFilteredObject } from 'UiKit/helpers/validation/general';
import { isEmpty } from 'UiKit/helpers/general';
import { createFormModel, getOptions } from 'UiKit/helpers/model';


const yesNoOptions = [
  { value: 'Yes', text: 'Yes' },
  { value: 'No', text: 'No' },
];
interface FormModelEntityInformation {
  is_use_ein: string | undefined;
  ein?: string;
  type: string | undefined;
  owner_title: string | undefined;
  name: string | undefined;
}

const props = defineProps({
  modelData: Object as PropType<FormModelEntityInformation>,
});

const userIdentityStore = useUserProfilesStore();
const {
  setProfileByIdErrorData, getProfileByIdOptionsData, isGetProfileByIdLoading,
} = storeToRefs(userIdentityStore);

const model = reactive<FormModelEntityInformation>({
  ein: props.modelData?.ein,
  is_use_ein: props.modelData?.is_use_ein,
  type: props.modelData?.type,
  owner_title: props.modelData?.owner_title,
  name: props.modelData?.name,
});

const required = computed(() => {
  if (model.is_use_ein && model.is_use_ein === 'Yes') {
    return ['type', 'owner_title', 'name', 'is_use_ein', 'ein'];
  }
  return ['type', 'owner_title', 'name', 'is_use_ein'];
});

const schema = computed(() => ({
  $schema: 'http://json-schema.org/draft-07/schema#',
  definitions: {
    Entity: {
      properties: {
        type: {},
        is_use_ein: {},
        ein: {},
        name: {},
        owner_title: {},
      },
      type: 'object',
      errorMessage: errorMessageRule,
      required: required.value,
    },
  },
  $ref: '#/definitions/Entity',
} as unknown as JSONSchemaType<FormModelEntityInformation>));

const formModel = createFormModel(schema.value);
let validator = new PrecompiledValidator<FormModelEntityInformation>(
  filterSchema(getProfileByIdOptionsData.value, formModel),
  schema.value,
);
const validation = ref<unknown>();
const isValid = computed(() => isEmpty(validation.value || {}));

const onValidate = () => {
  validation.value = validator.getFormValidationErrors(model);
};

const schemaObject = computed(() => getFilteredObject(getProfileByIdOptionsData.value, formModel));
const optionsType = computed(() => getOptions('type', schemaObject));


const modelExpose = computed(() => {
  const temp = { ...model };
  delete temp.is_use_ein;
  return temp;
});

defineExpose({
  model: modelExpose, validation, validator, isValid, onValidate,
});


watch(() => props.modelData, () => {
  if (props.modelData?.ein) {
    model.ein = props.modelData?.ein;
    model.is_use_ein = 'Yes';
  }
  if (props.modelData?.type) {
    model.type = props.modelData?.type;
  }
  if (props.modelData?.owner_title) {
    model.owner_title = props.modelData?.owner_title;
  }
  if (props.modelData?.name) {
    model.name = props.modelData?.name;
  }
}, { deep: true });


watch(() => model, () => {
  if (!isValid.value) onValidate();
}, { deep: true });

watch(() => [getProfileByIdOptionsData.value, schema.value], () => {
  validator = new PrecompiledValidator<FormModelEntityInformation>(
    filterSchema(getProfileByIdOptionsData.value, formModel),
    schema.value,
  );
});
</script>

<template>
  <div class="VFormPartialTrustInformation v-form-partial-trust-information">
    <div class="v-form-partial-trust-information__subtitle is--h3__title">
      Trust Information
    </div>
    <FormRow>
      <FormCol col3>
        <VFormGroup
          v-slot="VFormGroupProps"
          :model="model"
          :validation="validation"
          :schema-back="getProfileByIdOptionsData"
          :schema-front="schema"
          :error-text="setProfileByIdErrorData?.type"
          path="type"
          label="Type of Trust"
          data-testid="type-group"
        >
          <VFormSelect
            v-model="model.type"
            :is-error="VFormGroupProps.isFieldError"
            name="type"
            size="large"
            placeholder="Type"
            item-label="name"
            item-value="value"
            searchable
            :options="optionsType"
            :loading="isGetProfileByIdLoading || (optionsType?.length === 0)"
            data-testid="type"
          />
        </VFormGroup>
      </FormCol>
      <FormCol col3>
        <VFormGroup
          v-slot="VFormGroupProps"
          :model="model"
          :validation="validation"
          :schema-back="getProfileByIdOptionsData"
          :schema-front="schema"
          :error-text="setProfileByIdErrorData?.name"
          path="name"
          label="Name of Trust"
          data-testid="name-group"
        >
          <VFormInput
            :model-value="model.name"
            :is-error="VFormGroupProps.isFieldError"
            placeholder="Name"
            name="name"
            size="large"
            data-testid="name"
            :loading="isGetProfileByIdLoading"
            @update:model-value="model.name = $event"
          />
        </VFormGroup>
      </FormCol>
      <FormCol col3>
        <VFormGroup
          v-slot="VFormGroupProps"
          :model="model"
          :validation="validation"
          :schema-back="getProfileByIdOptionsData"
          :schema-front="schema"
          :error-text="setProfileByIdErrorData?.owner_title"
          path="owner_title"
          label="Your Title within Trust"
          data-testid="owner-title-group"
        >
          <VFormInput
            :model-value="model.owner_title"
            :is-error="VFormGroupProps.isFieldError"
            placeholder="Title"
            name="owner_title"
            size="large"
            data-testid="owner-title"
            :loading="isGetProfileByIdLoading"
            @update:model-value="model.owner_title = $event"
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
          label="Does this Trust have an EIN"
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
.v-form-partial-trust-information {
  display: flex;
  flex-direction: column;
  width: 100%;

  &__subtitle {
    margin-bottom: 20px;
    margin-top: 12px;
  }
}
</style>
