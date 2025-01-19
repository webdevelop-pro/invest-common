<script setup lang="ts">
import {
  watch, PropType, reactive, ref, computed,
} from 'vue';
import { useUserProfilesStore } from 'InvestCommon/store/useUserProfiles';
import FormRow from 'InvestCommon/components/VForm/VFormRow.vue';
import FormCol from 'InvestCommon/components/VForm/VFormCol.vue';
import VFormInput from 'UiKit/components/Base/VForm/VFormInput.vue';
import VFormSelect from 'UiKit/components/Base/VForm/VFormSelect.vue';
import { storeToRefs } from 'pinia';
import VFormGroup from 'UiKit/components/Base/VForm/VFormGroup.vue';
import { JSONSchemaType } from 'ajv';
import { errorMessageRule } from 'UiKit/helpers/validation/rules';
import { PrecompiledValidator } from 'UiKit/helpers/validation/PrecompiledValidator';
import { filterSchema, getFilteredObject } from 'UiKit/helpers/validation/general';
import { isEmpty } from 'UiKit/helpers/general';
import { createFormModel, getOptions } from 'UiKit/helpers/model';


interface FormModelPartialIdentification {
    type_of_identification: {
      type: string | undefined;
      state: string | undefined;
      id_number: string | undefined;
    };
}

const schema = {
  $schema: 'http://json-schema.org/draft-07/schema#',
  definitions: {
    Identification: {
      properties: {
        type: {},
        state: {},
        id_number: {},
      },
      type: 'object',
      additionalProperties: false,
      required: ['type', 'state', 'id_number'],
    },
    Entity: {
      properties: {
        type_of_identification: {
          type: 'object',
          $ref: '#/definitions/Identification',
        },
      },
      type: 'object',
      errorMessage: errorMessageRule,
    },
  },
  $ref: '#/definitions/Entity',
} as unknown as JSONSchemaType<FormModelPartialIdentification>;

const props = defineProps({
  modelData: Object as PropType<FormModelPartialIdentification>,
});

const userIdentityStore = useUserProfilesStore();
const {
  setProfileByIdErrorData, getProfileByIdOptionsData,
} = storeToRefs(userIdentityStore);

// const formModel = {
//   type_of_identification: {
//   },
// };
const formModel = createFormModel(schema);
const model = reactive({
  type_of_identification: {},
} as FormModelPartialIdentification);
let validator = new PrecompiledValidator<FormModelPartialIdentification>(
  // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
  filterSchema(getProfileByIdOptionsData.value, formModel),
  schema,
);
const validation = ref<unknown>();
const isValid = computed(() => isEmpty(validation.value || {}));

const onValidate = () => {
  validation.value = validator.getFormValidationErrors(model);
};

const schemaObject = computed(() => getFilteredObject(getProfileByIdOptionsData.value, formModel));
const optionsType = computed(() => getOptions('type_of_identification.type', schemaObject));
const optionsState = computed(() => getOptions('type_of_identification.state', schemaObject));

watch(() => model, () => {
  if (!isValid.value) onValidate();
}, { deep: true });

watch(() => getProfileByIdOptionsData.value, () => {
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  validator = new PrecompiledValidator<FormModelPartialIdentification>(
    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    filterSchema(getProfileByIdOptionsData.value, formModel),
    schema,
  );
});


defineExpose({
  model, validation, isValid, onValidate,
});

watch(() => props.modelData, () => {
  if (props.modelData?.type_of_identification?.type) {
    model.type_of_identification.type = props.modelData?.type_of_identification?.type;
  }
  if (props.modelData?.type_of_identification?.id_number) {
    // eslint-disable-next-line max-len
    model.type_of_identification.id_number = props.modelData?.type_of_identification?.id_number;
  }
  if (props.modelData?.type_of_identification?.state) {
    model.type_of_identification.state = props.modelData?.type_of_identification?.state;
  }
}, { deep: true, immediate: true });
</script>

<template>
  <div class="VFormPartialIdentification v-form-partial-identification">
    <FormRow>
      <FormCol col3>
        <VFormGroup
          v-slot="VFormGroupProps"
          :model="model"
          :validation="validation"
          :schema-back="getProfileByIdOptionsData"
          :schema-front="schema"
          :error-text="setProfileByIdErrorData?.type_of_identification.type"
          path="type_of_identification.type"
          label="Type of Identification"
          data-testid="identification-type-group"
        >
          <VFormSelect
            :model-value="model.type_of_identification?.type"
            :is-error="VFormGroupProps.isFieldError"
            name="type_of_identification.type"
            size="large"
            placeholder="Type of Identification"
            data-testid="identification-type"
            item-label="name"
            item-value="value"
            :options="optionsType"
            dropdown-absolute
            @update:model-value="model.type_of_identification.type = $event"
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
          :error-text="setProfileByIdErrorData?.type_of_identification?.id_number"
          path="type_of_identification.id_number"
          label="ID Number"
          data-testid="identification-number-group"
        >
          <VFormInput
            :model-value="model.type_of_identification?.id_number"
            :is-error="VFormGroupProps.isFieldError"
            placeholder="ID Number"
            name="identification-number"
            size="large"
            data-testid="identification-number"
            @update:model-value="model.type_of_identification.id_number = $event"
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
          :error-text="setProfileByIdErrorData?.type_of_identification.state"
          path="type_of_identification.state"
          label="State of Issue"
          data-testid="identification-state-group"
        >
          <VFormSelect
            :model-value="model.type_of_identification?.state"
            :is-error="VFormGroupProps.isFieldError"
            name="identification_state"
            size="large"
            placeholder="State of Issue"
            data-testid="identification-state"
            item-label="name"
            item-value="value"
            :options="optionsState"
            dropdown-absolute
            @update:model-value="model.type_of_identification.state = $event"
          />
        </VFormGroup>
      </FormCol>
    </FormRow>
  </div>
</template>

<style lang="scss">
.v-form-partial-identification {
  display: flex;
  flex-direction: column;
  width: 100%;

  &__subtitle {
    margin-bottom: 20px;
    margin-top: 12px;
  }
}
</style>
