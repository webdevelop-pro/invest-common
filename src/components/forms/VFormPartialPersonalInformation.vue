<script setup lang="ts">
import {
  watch, PropType, computed, toRaw,
} from 'vue';
import FormRow from 'UiKit/components/Base/VForm/VFormRow.vue';
import FormCol from 'UiKit/components/Base/VForm/VFormCol.vue';
import VFormInput from 'UiKit/components/Base/VForm/VFormInput.vue';
import VFormSelect from 'UiKit/components/Base/VForm/VFormSelect.vue';
import VFormGroup from 'UiKit/components/Base/VForm/VFormGroup.vue';
import { JSONSchemaType } from 'ajv/dist/types/json-schema';
import {
  address1Rule, address2Rule, citizenshipRule, cityRule, countryRuleObject,
  dobRule, errorMessageRule, firstNameRule, lastNameRule,
  middleNameRule, phoneRule, ssnRule, stateRule, zipRule,
} from 'UiKit/helpers/validation/rules';
import { FormModelPersonalInformation } from 'InvestCommon/types/form';
import { getOptions } from 'UiKit/helpers/model';
import VFormCombobox from 'UiKit/components/Base/VForm/VFormCombobox.vue';
import { useFormValidation } from 'InvestCommon/composable/useFormValidation';

const props = defineProps({
  modelData: Object as PropType<FormModelPersonalInformation>,
  readOnly: Boolean,
  errorData: Object,
  schemaBackend: Object,
  loading: Boolean,
});

const schemaFrontend = {
  $schema: 'http://json-schema.org/draft-07/schema#',
  definitions: {
    Individual: {
      properties: {
        first_name: firstNameRule,
        last_name: lastNameRule,
        middle_name: middleNameRule,
        dob: dobRule,
        address1: address1Rule,
        address2: address2Rule,
        city: cityRule,
        state: stateRule,
        zip_code: zipRule,
        country: countryRuleObject,
        phone: phoneRule,
        citizenship: citizenshipRule,
        ssn: ssnRule,
      },
      type: 'object',
      errorMessage: errorMessageRule,
      required: ['citizenship', 'address1', 'dob', 'phone', 'city', 'state', 'zip_code', 'country', 'ssn', 'first_name', 'last_name'],
    },
  },
  $ref: '#/definitions/Individual',
} as unknown as JSONSchemaType<FormModelPersonalInformation>;

const schemaBackendLocal = computed(() => (props.schemaBackend ? structuredClone(toRaw(props.schemaBackend)) : null));

const {
  model, validation, isValid, onValidate, schemaObject,
} = useFormValidation<FormModelPersonalInformation>(
  schemaFrontend,
  schemaBackendLocal,
  {} as FormModelPersonalInformation,
);

const optionsCountry = computed(() => getOptions('country', schemaObject));
const optionsState = computed(() => getOptions('state', schemaObject));
const optionsCitizenship = computed(() => getOptions('citizenship', schemaObject));

defineExpose({
  model, validation, isValid, onValidate,
});

watch(() => props.modelData, (newModelData) => {
  if (!newModelData) return;

  // Define the fields to sync
  const fields = [
    'first_name', 'last_name', 'middle_name', 'dob', 'address1', 'address2',
    'city', 'state', 'zip_code', 'country', 'phone', 'ssn', 'citizenship',
  ] as const;

  // Update model with new data, only if the value exists
  fields.forEach((field) => {
    if (newModelData[field] !== undefined && newModelData[field] !== null) {
      model[field] = newModelData[field];
    }
  });
}, { deep: true, immediate: true });
</script>

<template>
  <div class="VFormPartialPersonalInformation v-form-partial-personal-information">
    <FormRow>
      <FormCol col3>
        <VFormGroup
          v-slot="VFormGroupProps"
          :model="model"
          :validation="validation"
          :schema-back="schemaBackend"
          :schema-front="schemaFrontend"
          :error-text="errorData?.first_name"
          path="first_name"
          label="First Name"
          data-testid="first-name-group"
        >
          <VFormInput
            :model-value="model.first_name"
            :is-error="VFormGroupProps.isFieldError"
            placeholder="First Name"
            name="first-name"
            size="large"
            data-testid="first-name"
            :readonly="readOnly"
            :loading="loading"
            @update:model-value="model.first_name = $event"
          />
        </VFormGroup>
      </FormCol>

      <FormCol col3>
        <VFormGroup
          v-slot="VFormGroupProps"
          :model="model"
          :validation="validation"
          :schema-back="schemaBackend"
          :schema-front="schemaFrontend"
          :error-text="errorData?.middle_name"
          path="middle_name"
          label="Middle Name"
          data-testid="middle-name-group"
        >
          <VFormInput
            :model-value="model.middle_name"
            :is-error="VFormGroupProps.isFieldError"
            placeholder="Middle Name"
            name="middle-name"
            size="large"
            data-testid="middle-name"
            :readonly="readOnly"
            :loading="loading"
            @update:model-value="model.middle_name = $event"
          />
        </VFormGroup>
      </FormCol>

      <FormCol col3>
        <VFormGroup
          v-slot="VFormGroupProps"
          :model="model"
          :validation="validation"
          :schema-back="schemaBackend"
          :schema-front="schemaFrontend"
          :error-text="errorData?.last_name"
          path="last_name"
          label="Last Name"
          data-testid="last-name-group"
        >
          <VFormInput
            :model-value="model.last_name"
            :is-error="VFormGroupProps.isFieldError"
            placeholder="Last Name"
            name="last-name"
            size="large"
            data-testid="last-name"
            :readonly="readOnly"
            :loading="loading"
            @update:model-value="model.last_name = $event"
          />
        </VFormGroup>
      </FormCol>
    </FormRow>
    <FormRow>
      <FormCol col-2>
        <VFormGroup
          v-slot="VFormGroupProps"
          :model="model"
          :validation="validation"
          :schema-back="schemaBackend"
          :schema-front="schemaFrontend"
          :error-text="errorData?.dob"
          path="dob"
          label="Date of Birth"
          data-testid="dob-group"
        >
          <VFormInput
            :model-value="model.dob"
            :is-error="VFormGroupProps.isFieldError"
            placeholder="MM/DD/YYYY"
            name="date-of-birth"
            size="large"
            data-testid="date-of-birth"
            type="date"
            :readonly="readOnly"
            :loading="loading"
            @update:model-value="model.dob = $event"
          />
        </VFormGroup>
      </FormCol>

      <FormCol col-2>
        <VFormGroup
          v-slot="VFormGroupProps"
          :model="model"
          :validation="validation"
          :schema-back="schemaBackend"
          :schema-front="schemaFrontend"
          :error-text="errorData?.phone"
          path="phone"
          label="Phone number"
          data-testid="phone-group"
        >
          <VFormInput
            :model-value="model.phone"
            :is-error="VFormGroupProps.isFieldError"
            placeholder="+1 (___) ___ - ____"
            mask="+#(###)###-####"
            disallow-special-chars
            name="phone"
            size="large"
            data-testid="phone"
            :readonly="readOnly"
            :loading="loading"
            @update:model-value="model.phone = $event"
          />
        </VFormGroup>
      </FormCol>
    </FormRow>
    <FormRow>
      <FormCol col2>
        <VFormGroup
          v-slot="VFormGroupProps"
          :model="model"
          :validation="validation"
          :schema-back="schemaBackend"
          :schema-front="schemaFrontend"
          :error-text="errorData?.citizenship"
          path="citizenship"
          label="Citizenship"
          data-testid="citizenship-group"
        >
          <VFormSelect
            :model-value="model.citizenship"
            :is-error="VFormGroupProps.isFieldError"
            name="citizenship"
            size="large"
            placeholder="Please choose an option"
            data-testid="citizenship"
            item-label="name"
            item-value="value"
            :options="optionsCitizenship"
            dropdown-absolute
            :readonly="readOnly"
            :loading="loading || (optionsCitizenship.length === 0)"
            @update:model-value="model.citizenship = $event"
          />
        </VFormGroup>
      </FormCol>
      <FormCol col2>
        <VFormGroup
          v-slot="VFormGroupProps"
          :model="model"
          :validation="validation"
          :schema-back="schemaBackend"
          :schema-front="schemaFrontend"
          :error-text="errorData?.ssn"
          path="ssn"
          label="SSN"
          data-testid="ssn-group"
        >
          <VFormInput
            :model-value="model.ssn"
            :is-error="VFormGroupProps.isFieldError"
            placeholder="XXX-XX-XXXX"
            name="ssn"
            size="large"
            data-testid="ssn"
            mask="###-##-####"
            disallow-special-chars
            :readonly="readOnly"
            :loading="loading"
            @update:model-value="model.ssn = $event"
          />
        </VFormGroup>
      </FormCol>
    </FormRow>
    <div class="v-form-partial-personal-information__subtitle is--h3__title">
      Residence Address
    </div>
    <FormRow>
      <FormCol col2>
        <VFormGroup
          v-slot="VFormGroupProps"
          :model="model"
          :validation="validation"
          :schema-back="schemaBackend"
          :schema-front="schemaFrontend"
          :error-text="errorData?.address1"
          path="address1"
          label="Address 1"
          data-testid="address-1-group"
        >
          <VFormInput
            :model-value="model.address1"
            :is-error="VFormGroupProps.isFieldError"
            placeholder="Address 1"
            name="address-1"
            size="large"
            data-testid="address-1"
            :readonly="readOnly"
            :loading="loading"
            @update:model-value="model.address1 = $event"
          />
        </VFormGroup>
      </FormCol>

      <FormCol col2>
        <VFormGroup
          v-slot="VFormGroupProps"
          :model="model"
          :validation="validation"
          :schema-back="schemaBackend"
          :schema-front="schemaFrontend"
          :error-text="errorData?.address2"
          path="address2"
          label="Address 2"
          data-testid="address-2-group"
        >
          <VFormInput
            :model-value="model.address2"
            :is-error="VFormGroupProps.isFieldError"
            placeholder="Address 2"
            name="address-2"
            size="large"
            data-testid="address-2"
            :readonly="readOnly"
            :loading="loading"
            @update:model-value="model.address2 = $event"
          />
        </VFormGroup>
      </FormCol>
    </FormRow>

    <FormRow>
      <FormCol col2>
        <VFormGroup
          v-slot="VFormGroupProps"
          :model="model"
          :validation="validation"
          :schema-back="schemaBackend"
          :schema-front="schemaFrontend"
          :error-text="errorData?.city"
          path="city"
          label="City"
          data-testid="city-group"
        >
          <VFormInput
            :model-value="model.city"
            :is-error="VFormGroupProps.isFieldError"
            name="city"
            size="large"
            placeholder="City"
            data-testid="city"
            disallow-special-chars
            disallow-numbers
            :readonly="readOnly"
            :loading="loading"
            @update:model-value="model.city = $event"
          />
        </VFormGroup>
      </FormCol>
      <FormCol col2>
        <VFormGroup
          v-slot="VFormGroupProps"
          :model="model"
          :validation="validation"
          :schema-back="schemaBackend"
          :schema-front="schemaFrontend"
          :error-text="errorData?.state"
          path="state"
          label="State"
          data-testid="state-group"
        >
          <VFormCombobox
            v-model="model.state"
            :is-error="VFormGroupProps.isFieldError"
            name="state"
            size="large"
            placeholder="State"
            item-label="name"
            item-value="value"
            :options="optionsState"
            data-testid="state"
            :readonly="readOnly"
            :loading="loading || (optionsState.length === 0)"
          />
        </VFormGroup>
      </FormCol>
    </FormRow>

    <FormRow>
      <FormCol col2>
        <VFormGroup
          v-slot="VFormGroupProps"
          :model="model"
          :validation="validation"
          :schema-back="schemaBackend"
          :schema-front="schemaFrontend"
          :error-text="errorData?.zip_code"
          path="zip_code"
          label="Zip Code"
          data-testid="zip-group"
        >
          <VFormInput
            :model-value="model.zip_code"
            :is-error="VFormGroupProps.isFieldError"
            name="zip"
            size="large"
            data-testid="zip"
            placeholder="Zip Code"
            mask="#####-####"
            return-masked-value
            disallow-special-chars
            :readonly="readOnly"
            :loading="loading"
            @update:model-value="model.zip_code = $event"
          />
        </VFormGroup>
      </FormCol>

      <FormCol col2>
        <VFormGroup
          v-slot="VFormGroupProps"
          :model="model"
          :validation="validation"
          :schema-back="schemaBackend"
          :schema-front="schemaFrontend"
          :error-text="errorData?.country"
          path="country"
          label="Country"
          data-testid="country-group"
        >
          <VFormCombobox
            v-model="model.country"
            :is-error="VFormGroupProps.isFieldError"
            name="country"
            size="large"
            placeholder="Country"
            item-label="name"
            item-value="value"
            :options="optionsCountry"
            data-testid="country"
            :readonly="readOnly"
            :loading="loading || (optionsCountry?.length === 0)"
          />
        </VFormGroup>
      </FormCol>
    </FormRow>
  </div>
</template>

<style lang="scss">
.v-form-partial-personal-information {
  display: flex;
  flex-direction: column;
  width: 100%;

  &__subtitle {
    margin-bottom: 20px;
    margin-top: 12px;
  }
}
</style>
