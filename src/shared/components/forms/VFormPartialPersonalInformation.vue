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
  dobRule, errorMessageRule, phoneRule, ssnRule, stateRule, zipRule,
} from 'UiKit/helpers/validation/rules';
import VFormCombobox from 'UiKit/components/Base/VForm/VFormCombobox.vue';
import { useFormValidation } from 'UiKit/helpers/validation/useFormValidation';
import { IUserDataIndividual } from '@/data/profiles/profiles.types';

interface FormModelPersonalInformation {
  first_name: string;
  last_name: string;
  middle_name?: string;
  dob: string;
  address1: string;
  address2: string;
  city: string;
  state: string;
  zip_code: string;
  country: string;
  phone: string;
  citizenship: string;
  ssn?: string;
  ein?: string;
}

const props = defineProps({
  modelData: Object as PropType<IUserDataIndividual>,
  readOnly: Boolean,
  errorData: Object,
  schemaBackend: Object,
  loading: Boolean,
  showSSN: Boolean,
});

const isSsnHidden = computed(() => (props.modelData?.is_full_ssn_provided === true) && !props.showSSN);

const schemaFrontend = computed(() => {
  const properties = {
    first_name: {},
    last_name: {},
    middle_name: {},
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
  };

  const required = [
    'citizenship', 'address1', 'dob', 'phone', 'city', 'state', 
    'zip_code', 'country', 'first_name', 'last_name',
    ...(isSsnHidden.value ? [] : ['ssn'])
  ];

  // Use helper function to get reference type
  const referenceType = getReferenceType(props.schemaBackend);

  return {
    $schema: 'http://json-schema.org/draft-07/schema#',
    definitions: {
      [referenceType]: {
        properties,
        type: 'object',
        errorMessage: errorMessageRule,
        required,
      },
    },
    $ref: `#/definitions/${referenceType}`,
  } as unknown as JSONSchemaType<FormModelPersonalInformation>;
});

const schemaBackendLocal = computed(() => (props.schemaBackend ? structuredClone(toRaw(props.schemaBackend)) : null));
const fieldsPaths = ['first_name', 'last_name', 'middle_name', 'dob', 'address1', 'address2', 'city', 'state', 'zip_code', 'country', 'phone', 'citizenship', 'ssn'];

const {
  model, validation, onValidate,
  formErrors, isFieldRequired, getErrorText,
  scrollToError, getOptions, isValid,
  getReferenceType,
} = useFormValidation<FormModelPersonalInformation>(
  schemaFrontend,
  schemaBackendLocal,
  {} as FormModelPersonalInformation,
  fieldsPaths,
);

const optionsCountry = computed(() => getOptions('country'));
const optionsState = computed(() => getOptions('state'));
const optionsCitizenship = computed(() => getOptions('citizenship'));

defineExpose({
  model, validation, isValid, onValidate,
  scrollToError, formErrors,
});

watch(() => props.modelData, (newModelData) => {
  if (!newModelData) return;

  // Update model with new data, only if the value exists
  fieldsPaths.forEach((field) => {
    if (newModelData[field] !== undefined && newModelData[field] !== null) {
      model[field] = newModelData[field];
    }
  });

  // Handle SSN field conditionally
  if (isSsnHidden.value) {
    // Remove SSN from model if it's hidden
    delete model.ssn;
  } else if (newModelData.ssn !== undefined && newModelData.ssn !== null) {
    // Only set SSN if it's not hidden and has a value
    model.ssn = newModelData.ssn;
  }
}, { deep: true, immediate: true });
</script>

<template>
  <div class="VFormPartialPersonalInformation v-form-partial-personal-information">
    <FormRow>
      <FormCol col3>
        <VFormGroup
          v-slot="VFormGroupProps"
          :required="isFieldRequired('first_name')"
          :error-text="getErrorText('first_name', errorData as any)"
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
          :required="isFieldRequired('middle_name')"
          :error-text="getErrorText('middle_name', errorData as any)"
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
          :required="isFieldRequired('last_name')"
          :error-text="getErrorText('last_name', errorData as any)"
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
          :required="isFieldRequired('dob')"
          :error-text="getErrorText('dob', errorData as any)"
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
          :required="isFieldRequired('phone')"
          :error-text="getErrorText('phone', errorData as any)"
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
          :required="isFieldRequired('citizenship')"
          :error-text="getErrorText('citizenship', errorData as any)"
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
          :required="isFieldRequired('ssn')"
          :error-text="getErrorText('ssn', errorData as any)"
          label="SSN"
          data-testid="ssn-group"
        >
          <VFormInput
            v-if="!isSsnHidden"
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
          <VFormInput
            v-else
            model-value="********"
            readonly
            size="large"
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
          :required="isFieldRequired('address1')"
          :error-text="getErrorText('address1', errorData as any)"
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
          :required="isFieldRequired('address2')"
          :error-text="getErrorText('address2', errorData as any)"
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
          :required="isFieldRequired('city')"
          :error-text="getErrorText('city', errorData as any)"
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
          :required="isFieldRequired('state')"
          :error-text="getErrorText('state', errorData as any)"
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
          :required="isFieldRequired('zip_code')"
          :error-text="getErrorText('zip_code', errorData as any)"
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
          :required="isFieldRequired('country')"
          :error-text="getErrorText('country', errorData as any)"
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
