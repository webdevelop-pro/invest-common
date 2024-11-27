<script setup lang="ts">
import {
  watch, PropType, computed, reactive,
  ref,
} from 'vue';
import { useUserProfilesStore } from 'InvestCommon/store/useUserProfiles';
import FormRow from 'InvestCommon/components/VForm/VFormRow.vue';
import FormCol from 'InvestCommon/components/VForm/VFormCol.vue';
import VFormInput from 'UiKit/components/VForm/VFormInput.vue';
import VFormSelect from 'UiKit/components/VForm/VFormSelect.vue';
import VFormCheckbox from 'UiKit/components/VForm/VFormCheckbox.vue';
import { storeToRefs } from 'pinia';
import VFormGroup from 'UiKit/components/VForm/VFormGroup.vue';
import { JSONSchemaType } from 'ajv';
import {
  address1Rule, address2Rule, cityRule, countryRuleObject,
  dobRule,
  emailRule, errorMessageRule, firstNameRule, lastNameRule,
  phoneRule, stateRule, zipRule,
} from 'UiKit/helpers/validation/rules';
import { filterSchema, getFilteredObject } from 'UiKit/helpers/validation/general';
import { createFormModel, getOptions } from 'UiKit/helpers/model';
import { PrecompiledValidator } from 'UiKit/helpers/validation/PrecompiledValidator';
import { isEmpty } from 'UiKit/helpers/general';
import { FormModelPersonalInformation } from 'InvestCommon/types/form';

interface FormModelBusinessController {
  business_controller: {
    first_name: string;
    last_name: string;
    address1: string;
    address2: string;
    city: string;
    state: string;
    zip_code: string;
    country: string;
    phone: string;
    email: string;
    dob: string;
  };
}

const props = defineProps({
  modelData: Object as PropType<FormModelBusinessController>,
  personalData: Object as PropType<FormModelPersonalInformation>,
});

const userProfilesStore = useUserProfilesStore();
const {
  setProfileByIdErrorData, getProfileByIdOptionsData,
} = storeToRefs(userProfilesStore);

const schema = {
  $schema: 'http://json-schema.org/draft-07/schema#',
  definitions: {
    BusinessController: {
      properties: {
        first_name: firstNameRule,
        last_name: lastNameRule,
        address1: address1Rule,
        address2: address2Rule,
        city: cityRule,
        state: stateRule,
        zip_code: zipRule,
        country: countryRuleObject,
        phone: phoneRule,
        email: emailRule,
        dob: dobRule,
      },
      required: ['first_name', 'dob', 'last_name', 'address1', 'phone', 'city', 'state', 'zip_code', 'country', 'email'],
    },
    Entity: {
      properties: {
        business_controller: {
          type: 'object',
          $ref: '#/definitions/BusinessController',
        },
      },
      type: 'object',
      errorMessage: errorMessageRule,
    },
  },
  $ref: '#/definitions/Entity',
} as unknown as JSONSchemaType<FormModelBusinessController>;

const model = reactive<FormModelBusinessController>({
  business_controller: {},
});
const sameData = ref(true);
const formModel = createFormModel(schema);
let validator = new PrecompiledValidator<FormModelBusinessController>(
  filterSchema(getProfileByIdOptionsData.value, formModel),
  schema,
);
const validation = ref<unknown>();
const isValid = computed(() => isEmpty(validation.value || {}));

const onValidate = () => {
  validation.value = validator.getFormValidationErrors(model);
};

const schemaObject = computed(() => getFilteredObject(getProfileByIdOptionsData.value, formModel));
const optionsCountry = computed(() => getOptions('business_controller.country', schemaObject));
const optionsState = computed(() => getOptions('business_controller.state', schemaObject));

defineExpose({
  model, validation, validator, isValid, onValidate,
});

watch(() => props.modelData?.business_controller, () => {
  if (props.modelData?.business_controller) model.business_controller = props.modelData?.business_controller;
}, { deep: true, immediate: true });

watch(() => [props.personalData, sameData.value], () => {
  if (!sameData.value) model.business_controller = {};
  if (props.personalData && sameData.value) {
    model.business_controller.first_name = props.personalData.first_name;
    model.business_controller.last_name = props.personalData.last_name;
    model.business_controller.address1 = props.personalData.address1;
    if (props.personalData.address2) model.business_controller.address2 = props.personalData.address2;
    model.business_controller.city = props.personalData.city;
    model.business_controller.state = props.personalData.state;
    model.business_controller.zip_code = props.personalData.zip_code;
    model.business_controller.country = props.personalData.country;
    model.business_controller.phone = props.personalData.phone;
    model.business_controller.email = props.personalData.email;
    model.business_controller.dob = props.personalData.dob;
  }
}, { deep: true, immediate: true });

watch(() => model, () => {
  if (!isValid.value) onValidate();
}, { deep: true });

watch(() => [getProfileByIdOptionsData.value, schema], () => {
  validator = new PrecompiledValidator<FormModelBusinessController>(
    filterSchema(getProfileByIdOptionsData.value, formModel),
    schema,
  );
});
</script>

<template>
  <div class="VFormPartialBusinessController v-form-partial-business-controller">
    <div class="v-form-partial-business-controller__subtitle is--h3__title">
      Business Controller Contact Information
    </div>
    <FormRow>
      <FormCol>
        <VFormCheckbox
          v-model="sameData"
          data-testid="V-checkbox"
          class="signup-form__checkbox"
        >
          Business Controller contact information is the same as my personal address/phone number.
        </VFormCheckbox>
      </FormCol>
    </FormRow>
    <template v-if="!sameData">
      <FormRow>
        <FormCol col2>
          <VFormGroup
            v-slot="VFormGroupProps"
            :model="model"
            :validation="validation"
            :schema-back="getProfileByIdOptionsData"
            :schema-front="schema"
            :error-text="setProfileByIdErrorData?.business_controller.first_name"
            path="business_controller.first_name"
            label="First Name"
            data-testid="first-name-group"
          >
            <VFormInput
              :model-value="model.business_controller.first_name"
              :is-error="VFormGroupProps.isFieldError"
              placeholder="First Name"
              name="first-name"
              size="large"
              data-testid="first-name"
              @update:model-value="model.business_controller.first_name = $event"
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
            :error-text="setProfileByIdErrorData?.business_controller.last_name"
            path="business_controller.last_name"
            label="Last Name"
            data-testid="last-name-group"
          >
            <VFormInput
              :model-value="model.business_controller.last_name"
              :is-error="VFormGroupProps.isFieldError"
              placeholder="Last Name"
              name="last-name"
              size="large"
              data-testid="last-name"
              @update:model-value="model.business_controller.last_name = $event"
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
            :error-text="setProfileByIdErrorData?.business_controller.phone"
            path="business_controller.phone"
            label="Phone number"
            data-testid="phone-group"
          >
            <VFormInput
              :model-value="model.business_controller.phone"
              :is-error="VFormGroupProps.isFieldError"
              placeholder="+1 (___) ___ - ____"
              mask="+#(###)###-####"
              disallow-special-chars
              name="phone"
              size="large"
              data-testid="phone"
              @update:model-value="model.business_controller.phone = $event"
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
            :error-text="setProfileByIdErrorData?.business_controller.dob"
            path="business_controller.dob"
            label="Date of Birth"
            data-testid="dob-group"
          >
            <VFormInput
              :model-value="model.business_controller.dob"
              :is-error="VFormGroupProps.isFieldError"
              placeholder="MM/DD/YYYY"
              name="date-of-birth"
              size="large"
              data-testid="date-of-birth"
              type="date"
              @update:model-value="model.business_controller.dob = $event"
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
            :error-text="setProfileByIdErrorData?.business_controller.address1"
            path="business_controller.address1"
            label="Address 1"
            data-testid="address-1-group"
          >
            <VFormInput
              :model-value="model.business_controller.address1"
              :is-error="VFormGroupProps.isFieldError"
              placeholder="Address 1"
              name="address-1"
              size="large"
              data-testid="address-1"
              @update:model-value="model.business_controller.address1 = $event"
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
            :error-text="setProfileByIdErrorData?.business_controller.address2"
            path="business_controller.address2"
            label="Address 2"
            data-testid="address-2-group"
          >
            <VFormInput
              :model-value="model.business_controller.address2"
              :is-error="VFormGroupProps.isFieldError"
              placeholder="Address 2"
              name="address-2"
              size="large"
              data-testid="address-2"
              @update:model-value="model.business_controller.address2 = $event"
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
            :error-text="setProfileByIdErrorData?.business_controller.city"
            path="business_controller.city"
            label="City"
            data-testid="city-group"
          >
            <VFormInput
              :model-value="model.business_controller.city"
              :is-error="VFormGroupProps.isFieldError"
              name="city"
              size="large"
              placeholder="City"
              data-testid="city"
              disallow-special-chars
              disallow-numbers
              @update:model-value="model.business_controller.city = $event"
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
            :error-text="setProfileByIdErrorData?.business_controller.state"
            path="business_controller.state"
            label="State"
            data-testid="state-group"
          >
            <VFormSelect
              :model-value="model.business_controller.state"
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
              @update:model-value="model.business_controller.state = $event"
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
            :error-text="setProfileByIdErrorData?.business_controller.zip_code"
            path="business_controller.zip_code"
            label="Zip Code"
            data-testid="zip-group"
          >
            <VFormInput
              :model-value="model.business_controller.zip_code"
              :is-error="VFormGroupProps.isFieldError"
              name="zip"
              size="large"
              data-testid="zip"
              placeholder="Zip Code"
              mask="#####-####"
              return-masked-value
              disallow-special-chars
              @update:model-value="model.business_controller.zip_code = $event"
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
            :error-text="setProfileByIdErrorData?.business_controller.country"
            path="business_controller.country"
            label="Country"
            data-testid="country-group"
          >
            <VFormSelect
              :model-value="model.business_controller.country"
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
              @update:model-value="model.business_controller.country = $event"
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
            :error-text="setProfileByIdErrorData?.business_controller.email"
            path="business_controller.email"
            label="Email"
            data-testid="email-group"
          >
            <VFormInput
              :is-error="VFormGroupProps.isFieldError"
              :model-value="model.business_controller.email"
              placeholder="Email Address"
              name="email"
              text
              type="email"
              size="large"
              @update:model-value="model.business_controller.email = $event"
            />
          </VFormGroup>
        </FormCol>
      </FormRow>
    </template>
  </div>
</template>

<style lang="scss">
.v-form-partial-business-controller {
  display: flex;
  flex-direction: column;
  width: 100%;

  &__subtitle {
    margin-bottom: 20px;
    margin-top: 12px;
  }
}
</style>
