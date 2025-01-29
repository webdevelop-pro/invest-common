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
  solely_for_investing: string;
  tax_exempts: string;
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

const schema = {
  $schema: 'http://json-schema.org/draft-07/schema#',
  definitions: {
    Entity: {
      properties: {
        type: {},
        solely_for_investing: {},
        tax_exempts: {},
        name: {},
        owner_title: {},
      },
      type: 'object',
      errorMessage: errorMessageRule,
      required: ['type', 'solely_for_investing', 'tax_exempts', 'name', 'owner_title'],
    },
  },
  $ref: '#/definitions/Entity',
} as unknown as JSONSchemaType<FormModelEntityInformation>;

const model = reactive<FormModelEntityInformation>({
  solely_for_investing: props.modelData?.solely_for_investing || 'No',
  tax_exempts: props.modelData?.tax_exempts || 'No',
  type: props.modelData?.type,
  owner_title: props.modelData?.owner_title,
  name: props.modelData?.name,
});
const formModel = createFormModel(schema);
let validator = new PrecompiledValidator<FormModelEntityInformation>(
  filterSchema(getProfileByIdOptionsData.value, formModel),
  schema,
);
const validation = ref<unknown>();
const isValid = computed(() => isEmpty(validation.value || {}));

const onValidate = () => {
  validation.value = validator.getFormValidationErrors(model);
};

const schemaObject = computed(() => getFilteredObject(getProfileByIdOptionsData.value, formModel));
const optionsType = computed(() => getOptions('type', schemaObject));

defineExpose({
  model, validation, validator, isValid, onValidate,
});


watch(() => props.modelData, () => {
  if (props.modelData?.solely_for_investing) {
    model.solely_for_investing = props.modelData?.solely_for_investing;
  }
  if (props.modelData?.tax_exempts) {
    model.tax_exempts = props.modelData?.tax_exempts;
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

watch(() => [getProfileByIdOptionsData.value, schema], () => {
  validator = new PrecompiledValidator<FormModelEntityInformation>(
    filterSchema(getProfileByIdOptionsData.value, formModel),
    schema,
  );
});
</script>

<template>
  <div class="VFormPartialEntityInformation v-form-partial-entity-information">
    <div class="v-form-partial-entity-information__subtitle is--h3__title">
      Entity Information
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
          label="Type of Entity"
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
          label="Name of Entity"
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
          label="Your Title within Entity"
          data-testid="owner-title-group"
        >
          <VFormInput
            :model-value="model.owner_title"
            :is-error="VFormGroupProps.isFieldError"
            placeholder="Owner Title"
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
          :error-text="setProfileByIdErrorData?.solely_for_investing"
          path="solely_for_investing"
          data-testid="solely-for-investing"
          label="Was this Entity created solely for investing on our platform?"
        >
          <VFormRadio
            v-model="model.solely_for_investing"
            :is-error="VFormGroupProps.isFieldError"
            :options="yesNoOptions"
            row
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
          :error-text="setProfileByIdErrorData?.tax_exempts"
          path="tax_exempts"
          data-testid="tax-exempts"
          label="Does your entity have Tax Exempt Status?"
        >
          <VFormRadio
            v-model="model.tax_exempts"
            :is-error="VFormGroupProps.isFieldError"
            :options="yesNoOptions"
            row
          />
        </VFormGroup>
      </FormCol>
    </FormRow>
  </div>
</template>

<style lang="scss">
.v-form-partial-entity-information {
  display: flex;
  flex-direction: column;
  width: 100%;

  &__subtitle {
    margin-bottom: 20px;
    margin-top: 12px;
  }
}
</style>
