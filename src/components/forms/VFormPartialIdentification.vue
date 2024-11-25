<script setup lang="ts">
import { watch, PropType, reactive, ref, computed } from 'vue';
import { useUserProfilesStore } from 'InvestCommon/store/useUserProfiles';
import FormRow from 'InvestCommon/components/VForm/VFormRow.vue';
import FormCol from 'InvestCommon/components/VForm/VFormCol.vue';
import VFormInput from 'UiKit/components/VForm/VFormInput.vue';
import VFormSelect from 'UiKit/components/VForm/VFormSelect.vue';
import { storeToRefs } from 'pinia';
import VFormGroup from 'UiKit/components/VForm/VFormGroup.vue';
import { SELECT_IDENTIFICATION_OPTIONS } from 'InvestCommon/utils';
import { USA_STATES_FULL } from 'InvestCommon/global/usaStates.json';
import { JSONSchemaType } from 'ajv';
import {
  errorMessageRule, identificationNumberRule, identificationTypeRule,
  stateRule,
} from 'UiKit/helpers/validation/rules';
import { FormModelPartialIdentification } from 'InvestCommon/types/form';
import { PrecompiledValidator } from 'UiKit/helpers/validation/PrecompiledValidator';
import { filterSchema } from 'UiKit/helpers/validation/general';
import { isEmpty } from 'UiKit/helpers/general';

const schema = {
  $schema: 'http://json-schema.org/draft-07/schema#',
  definitions: {
    PatchIndividualProfile: {
      properties: {
        identification_type: identificationTypeRule,
        identification_number: identificationNumberRule,
        identification_state: stateRule,
      },
      type: 'object',
      errorMessage: errorMessageRule,
      required: ['identification_type', 'identification_number', 'identification_state'],
    },
  },
  $ref: '#/definitions/PatchIndividualProfile',
} as unknown as JSONSchemaType<FormModelPartialIdentification>;

const props = defineProps({
  modelData: Object as PropType<FormModelPartialIdentification>,
});

const userIdentityStore = useUserProfilesStore();
const {
  setProfileByIdErrorData, getProfileByIdOptionsData,
} = storeToRefs(userIdentityStore);

const formModel = {
  identification_type: {},
  identification_number: {},
  identification_state: {},
};
const model = reactive({} as FormModelPartialIdentification);
let validator = new PrecompiledValidator<FormModelPartialIdentification>(
  // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
  filterSchema({ ...getProfileByIdOptionsData.value }, formModel),
  { ...schema },
);
const validation = ref<unknown>();
const isValid = computed(() => isEmpty(validation.value || {}));

const onValidate = () => {
  validation.value = validator.getFormValidationErrors(model);
};

watch(() => model, () => {
  if (!isValid.value) onValidate();
}, { deep: true });

watch(() => getProfileByIdOptionsData.value, () => {
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  validator = new PrecompiledValidator<FormModelPartialIdentification>(
    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    filterSchema({ ...getProfileByIdOptionsData.value }, formModel),
    { ...schema },
  );
});


defineExpose({
  model, validation, isValid, onValidate,
});

watch(() => props.modelData, () => {
  if (props.modelData?.identification_type) model.identification_type = props.modelData?.identification_type;
  if (props.modelData?.identification_number) model.identification_number = props.modelData?.identification_number;
  if (props.modelData?.identification_state) model.identification_state = props.modelData?.identification_state;
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
          :error-text="setProfileByIdErrorData?.identification_type"
          path="identification_type"
          label="Type of Identification"
          data-testid="identification-type-group"
        >
          <VFormSelect
            :model-value="model.identification_type"
            :is-error="VFormGroupProps.isFieldError"
            name="identification_type"
            size="large"
            placeholder="Type of Identification"
            data-testid="identification-type"
            item-label="text"
            item-value="value"
            :options="SELECT_IDENTIFICATION_OPTIONS"
            dropdown-absolute
            @update:model-value="model.identification_type = $event"
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
          :error-text="setProfileByIdErrorData?.identification_number"
          path="identification_number"
          label="ID Number"
          data-testid="identification-number-group"
        >
          <VFormInput
            :model-value="model.identification_number"
            :is-error="VFormGroupProps.isFieldError"
            placeholder="ID Number"
            name="identification-number"
            size="large"
            data-testid="identification-number"
            @update:model-value="model.identification_number = $event"
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
          :error-text="setProfileByIdErrorData?.identification_state"
          path="identification_state"
          label="State of Issue"
          data-testid="identification-state-group"
        >
          <VFormSelect
            :model-value="model.identification_state"
            :is-error="VFormGroupProps.isFieldError"
            name="identification_state"
            size="large"
            placeholder="State of Issue"
            data-testid="identification-state"
            item-label="text"
            item-value="value"
            :options="USA_STATES_FULL"
            dropdown-absolute
            @update:model-value="model.identification_state = $event"
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
