<script setup lang="ts">
import { watch, PropType, computed } from 'vue';
import { useUserProfilesStore } from 'InvestCommon/store/useUserProfiles';
import FormRow from 'InvestCommon/components/VForm/VFormRow.vue';
import FormCol from 'InvestCommon/components/VForm/VFormCol.vue';
import VFormInput from 'UiKit/components/VForm/VFormInput.vue';
import VFormSelect from 'UiKit/components/VForm/VFormSelect.vue';
import { storeToRefs } from 'pinia';
import VFormGroup from 'UiKit/components/VForm/VFormGroup.vue';
import { JSONSchemaType } from 'ajv';
import {
  address1Rule, address2Rule, citizenshipRule, cityRule, countryRuleObject,
  dobRule, errorMessageRule, firstNameRule, lastNameRule,
  middleNameRule, phoneRule, ssnRule, stateRule, zipRule,
} from 'UiKit/helpers/validation/rules';
import { FormModelPersonalInformation } from 'InvestCommon/types/form';
import { getFilteredObject } from 'UiKit/helpers/validation/general';
import { useFormValidator } from 'InvestCommon/composable/useFormValidation';
import { getOptions } from 'UiKit/helpers/model';

const props = defineProps({
  modelData: Object as PropType<FormModelPersonalInformation>,
});

const userProfilesStore = useUserProfilesStore();
const {
  setProfileByIdErrorData, getProfileByIdOptionsData,
} = storeToRefs(userProfilesStore);

const schema = {
  $schema: 'http://json-schema.org/draft-07/schema#',
  definitions: {
    PatchIndividualProfile: {
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
      required: ['citizenship', 'address1', 'dob', 'phone', 'city', 'state', 'zip_code', 'country', 'ssn'],
    },
  },
  $ref: '#/definitions/PatchIndividualProfile',
} as unknown as JSONSchemaType<FormModelPersonalInformation>;

const {
  model, formModel, isValid, validator, validation, onValidate,
} = useFormValidator<FormModelPersonalInformation>(
  {},
  schema,
  getProfileByIdOptionsData.value,
);


const schemaObject = computed(() => getFilteredObject(getProfileByIdOptionsData.value, formModel));
const optionsCountry = computed(() => getOptions('country', schemaObject));
const optionsState = computed(() => getOptions('state', schemaObject));
const optionsCitizenship = computed(() => getOptions('citizenship', schemaObject));

defineExpose({
  model, validation, validator, isValid, onValidate,
});

watch(() => props.modelData, () => {
  if (props.modelData?.first_name) model.first_name = props.modelData?.first_name;
  if (props.modelData?.last_name) model.last_name = props.modelData?.last_name;
  if (props.modelData?.middle_name) model.middle_name = props.modelData?.middle_name;
  if (props.modelData?.dob) model.dob = props.modelData?.dob;
  if (props.modelData?.address1) model.address1 = props.modelData?.address1;
  if (props.modelData?.address2) model.address2 = props.modelData?.address2;
  if (props.modelData?.city) model.city = props.modelData?.city;
  if (props.modelData?.state) model.state = props.modelData?.state;
  if (props.modelData?.zip_code) model.zip_code = props.modelData?.zip_code;
  if (props.modelData?.country) model.country = props.modelData?.country;
  if (props.modelData?.phone) model.phone = props.modelData?.phone;
  if (props.modelData?.ssn) model.ssn = props.modelData?.ssn;
  if (props.modelData?.citizenship) model.citizenship = props.modelData?.citizenship;
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
          :schema-back="getProfileByIdOptionsData"
          :schema-front="schema"
          :error-text="setProfileByIdErrorData?.first_name"
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
            @update:model-value="model.first_name = $event"
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
          :error-text="setProfileByIdErrorData?.middle_name"
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
            @update:model-value="model.middle_name = $event"
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
          :error-text="setProfileByIdErrorData?.last_name"
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
          :schema-back="getProfileByIdOptionsData"
          :schema-front="schema"
          :error-text="setProfileByIdErrorData?.dob"
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
            @update:model-value="model.dob = $event"
          />
        </VFormGroup>
      </FormCol>

      <FormCol col-2>
        <VFormGroup
          v-slot="VFormGroupProps"
          :model="model"
          :validation="validation"
          :schema-back="getProfileByIdOptionsData"
          :schema-front="schema"
          :error-text="setProfileByIdErrorData?.phone"
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
          :schema-back="getProfileByIdOptionsData"
          :schema-front="schema"
          :error-text="setProfileByIdErrorData?.citizenship"
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
            @update:model-value="model.citizenship = $event"
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
          :error-text="setProfileByIdErrorData?.ssn"
          path="ssn"
          label="SSN"
          data-testid="ssn-group"
        >
          <VFormInput
            :model-value="model.ssn"
            :is-error="VFormGroupProps.isFieldError"
            placeholder="XXX-XXX-XXXX"
            name="ssn"
            size="large"
            data-testid="ssn"
            mask="###-##-####"
            disallow-special-chars
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
          :schema-back="getProfileByIdOptionsData"
          :schema-front="schema"
          :error-text="setProfileByIdErrorData?.address1"
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
            @update:model-value="model.address1 = $event"
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
          :error-text="setProfileByIdErrorData?.address2"
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
          :schema-back="getProfileByIdOptionsData"
          :schema-front="schema"
          :error-text="setProfileByIdErrorData?.city"
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
            @update:model-value="model.city = $event"
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
          :error-text="setProfileByIdErrorData?.state"
          path="state"
          label="State"
          data-testid="state-group"
        >
          <VFormSelect
            :model-value="model.state"
            :is-error="VFormGroupProps.isFieldError"
            name="state"
            size="large"
            placeholder="State"
            item-label="name"
            item-value="value"
            searchable
            :options="optionsState"
            dropdown-absolute
            data-testid="state"
            @update:model-value="model.state = $event"
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
          :schema-back="getProfileByIdOptionsData"
          :schema-front="schema"
          :error-text="setProfileByIdErrorData?.zip_code"
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
            @update:model-value="model.zip_code = $event"
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
          :error-text="setProfileByIdErrorData?.country"
          path="country"
          label="Country"
          data-testid="country-group"
        >
          <VFormSelect
            :model-value="model.country"
            :is-error="VFormGroupProps.isFieldError"
            name="country"
            size="large"
            placeholder="Country"
            item-label="name"
            item-value="value"
            searchable
            :options="optionsCountry"
            dropdown-absolute
            data-testid="country"
            @update:model-value="model.country = $event"
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
