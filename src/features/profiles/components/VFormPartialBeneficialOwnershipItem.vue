<script setup lang="ts">
import { PropType, watch } from 'vue';
import FormRow from 'UiKit/components/Base/VForm/VFormRow.vue';
import FormCol from 'UiKit/components/Base/VForm/VFormCol.vue';
import VFormInput from 'UiKit/components/Base/VForm/VFormInput.vue';
import VFormGroup from 'UiKit/components/Base/VForm/VFormGroup.vue';
import VFormCheckbox from 'UiKit/components/Base/VForm/VFormCheckbox.vue';
import { JSONSchemaType } from 'ajv/dist/types/json-schema';
import VFormCombobox from 'UiKit/components/Base/VForm/VFormCombobox.vue';
import { IFormPartialBeneficialOwnershipItem } from 'InvestCommon/data/profiles/profiles.types';


const model = defineModel<IFormPartialBeneficialOwnershipItem>();
const props = defineProps({
  itemIndex: Number,
  validation: Object,
  schema: Object as PropType<JSONSchemaType<IFormPartialBeneficialOwnershipItem>>,
  optionsCountry: Array,
  optionsState: Array,
  trust: Boolean,
  errorData: Object,
  schemaBackend: Object,
  loading: Boolean,
  isFieldRequired: Function as PropType<(fieldPath: string) => boolean>,
  getErrorText: Function as PropType<(fieldPath: string, errorData: unknown) => string[]>,
});

const title = props.trust ? 'Trustee or Protector' : 'Beneficial Owner';

watch(() => model.value?.non_us, () => {
  if (model.value?.non_us) {
    model.value.type_of_identification = {};
  } else {
    delete model.value?.type_of_identification;
  }
});
</script>

<template>
  <div class="VFormPartialBeneficialOwnershipItem v-form-partial-beneficial-ownership-item">
    <div class="v-form-partial-beneficial-ownership-item__subtitle is--h3__title">
      {{ title }} {{ itemIndex + 1 }}
    </div>
    <FormRow>
      <FormCol col3>
        <VFormGroup
          v-slot="VFormGroupProps"
          :required="isFieldRequired(`beneficials.${itemIndex}.first_name`)"
          :error-text="getErrorText(`beneficials.${itemIndex}.first_name`, errorData)"
          label="First Name"
          data-testid="first-name-group"
        >
          <VFormInput
            v-model="model.first_name"
            :is-error="VFormGroupProps.isFieldError"
            placeholder="First Name"
            name="first-name"
            size="large"
            data-testid="first-name"
            :loading="loading"
          />
        </VFormGroup>
      </FormCol>

      <FormCol col3>
        <VFormGroup
          v-slot="VFormGroupProps"
          :required="isFieldRequired?.(`beneficials.${itemIndex}.last_name`)"
          :error-text="getErrorText?.(`beneficials.${itemIndex}.last_name`, errorData)"
          label="Last Name"
          data-testid="last-name-group"
        >
          <VFormInput
            v-model="model.last_name"
            :is-error="VFormGroupProps.isFieldError"
            placeholder="Last Name"
            name="last-name"
            size="large"
            data-testid="last-name"
            :loading="loading"
          />
        </VFormGroup>
      </FormCol>
      <FormCol col-3>
        <VFormGroup
          v-slot="VFormGroupProps"
          :required="isFieldRequired?.(`beneficials.${itemIndex}.dob`)"
          :error-text="getErrorText?.(`beneficials.${itemIndex}.dob`, errorData)"
          label="Date of Birth"
          data-testid="dob-group"
        >
          <VFormInput
            v-model="model.dob"
            :is-error="VFormGroupProps.isFieldError"
            placeholder="MM/DD/YYYY"
            name="date-of-birth"
            size="large"
            data-testid="date-of-birth"
            type="date"
            :loading="loading"
          />
        </VFormGroup>
      </FormCol>
    </FormRow>
    <FormRow>
      <FormCol col3>
        <VFormCheckbox v-model="model.non_us">
          Not US Citizen
        </VFormCheckbox>
      </FormCol>
      <template v-if="!model.non_us">
        <FormCol col3>
          <VFormGroup
            v-slot="VFormGroupProps"
            required
            :error-text="getErrorText?.(`beneficials.${itemIndex}.ssn`, errorData)"
            label="SSN"
            data-testid="ssn-group"
          >
            <VFormInput
              v-model="model.ssn"
              :is-error="VFormGroupProps.isFieldError"
              placeholder="XXX-XX-XXXX"
              name="ssn"
              size="large"
              data-testid="ssn"
              mask="###-##-####"
              disallow-special-chars
              :loading="loading"
            />
          </VFormGroup>
        </FormCol>
        <FormCol col3 />
      </template>
      <template v-else>
        <FormCol col3>
          <VFormGroup
            v-slot="VFormGroupProps"
            required
            :error-text="getErrorText?.(`beneficials.${itemIndex}.type_of_identification.id_number`, errorData)"
            label="Passport Series and Number"
            data-testid="id-number-group"
          >
            <VFormInput
              v-model="model.type_of_identification.id_number"
              :is-error="VFormGroupProps.isFieldError"
              placeholder="First Name"
              name="is_number"
              size="large"
              data-testid="id-number"
              :loading="loading"
            />
          </VFormGroup>
        </FormCol>
        <FormCol col3>
          <VFormGroup
            v-slot="VFormGroupProps"
            required
            :error-text="getErrorText?.(`beneficials.${itemIndex}.type_of_identification.country`, errorData)"
            label="Country of Issue"
            data-testid="passport-country-group"
          >
            <VFormCombobox
              v-model="model.type_of_identification.country"
              :is-error="VFormGroupProps.isFieldError"
              name="country"
              size="large"
              placeholder="Country"
              item-label="name"
              item-value="value"
              searchable
              :options="optionsCountry"
              dropdown-absolute
              data-testid="passport-country"
              :loading="loading || (optionsCountry.length === 0)"
            />
          </VFormGroup>
        </FormCol>
      </template>
    </FormRow>
    <FormRow>
      <FormCol col2>
        <VFormGroup
          :required="isFieldRequired?.(`beneficials.${itemIndex}.email`)"
          :error-text="getErrorText?.(`beneficials.${itemIndex}.email`, errorData)"
          data-testid="email-group"
          label="Email"
        >
          <template #default="VFormGroupProps">
            <VFormInput
              v-model="model.email"
              :is-error="VFormGroupProps.isFieldError"
              placeholder="Email Address"
              name="email"
              text
              type="email"
              size="large"
              :loading="loading"
            />
          </template>
          <template #tooltip>
            Email address will be used to send identity verification links to trust/entity associates.
          </template>
        </VFormGroup>
      </FormCol>

      <FormCol col-2>
        <VFormGroup
          v-slot="VFormGroupProps"
          :required="isFieldRequired?.(`beneficials.${itemIndex}.phone`)"
          :error-text="getErrorText?.(`beneficials.${itemIndex}.phone`, errorData)"
          label="Phone number"
          data-testid="phone-group"
        >
          <VFormInput
            v-model="model.phone"
            :is-error="VFormGroupProps.isFieldError"
            placeholder="+1 (___) ___ - ____"
            mask="+#(###)###-####"
            disallow-special-chars
            name="phone"
            size="large"
            data-testid="phone"
            :loading="loading"
          />
        </VFormGroup>
      </FormCol>
    </FormRow>
    <FormRow>
      <FormCol col2>
        <VFormGroup
          v-slot="VFormGroupProps"
          :required="isFieldRequired?.(`beneficials.${itemIndex}.address1`)"
          :error-text="getErrorText?.(`beneficials.${itemIndex}.address1`, errorData)"
          label="Address 1"
          data-testid="address-1-group"
        >
          <VFormInput
            v-model="model.address1"
            :is-error="VFormGroupProps.isFieldError"
            placeholder="Address 1"
            name="address-1"
            size="large"
            data-testid="address-1"
            :loading="loading"
          />
        </VFormGroup>
      </FormCol>

      <FormCol col2>
        <VFormGroup
          v-slot="VFormGroupProps"
          :required="isFieldRequired?.(`beneficials.${itemIndex}.address2`)"
          :error-text="getErrorText?.(`beneficials.${itemIndex}.address2`, errorData)"
          label="Address 2"
          data-testid="address-2-group"
        >
          <VFormInput
            v-model="model.address2"
            :is-error="VFormGroupProps.isFieldError"
            placeholder="Address 2"
            name="address-2"
            size="large"
            data-testid="address-2"
            :loading="loading"
          />
        </VFormGroup>
      </FormCol>
    </FormRow>

    <FormRow>
      <FormCol col2>
        <VFormGroup
          v-slot="VFormGroupProps"
          :required="isFieldRequired?.(`beneficials.${itemIndex}.city`)"
          :error-text="getErrorText?.(`beneficials.${itemIndex}.city`, errorData)"
          label="City"
          data-testid="city-group"
        >
          <VFormInput
            v-model="model.city"
            :is-error="VFormGroupProps.isFieldError"
            name="city"
            size="large"
            placeholder="City"
            data-testid="city"
            disallow-special-chars
            disallow-numbers
            :loading="loading"
          />
        </VFormGroup>
      </FormCol>
      <FormCol col2>
        <VFormGroup
          v-slot="VFormGroupProps"
          :required="isFieldRequired?.(`beneficials.${itemIndex}.state`)"
          :error-text="getErrorText?.(`beneficials.${itemIndex}.state`, errorData)"
          label="State"
          data-testid="state-group"
        >
          <template v-if="optionsState?.length">
            <VFormCombobox
              v-model="model.state"
              :is-error="VFormGroupProps.isFieldError"
              name="state"
              size="large"
              placeholder="State"
              item-label="name"
              item-value="value"
              searchable
              :options="optionsState"
              :loading="loading || (optionsState.length === 0)"
              data-testid="state"
            />
          </template>
          <template v-else>
            <VFormInput
              v-model="model.state"
              :is-error="VFormGroupProps.isFieldError"
              name="state"
              size="large"
              :placeholder="model.non_us ? 'State / Province / Region' : 'State'"
              data-testid="state"
              :loading="loading"
            />
          </template>
        </VFormGroup>
      </FormCol>
    </FormRow>

    <FormRow>
      <FormCol col2>
        <VFormGroup
          v-slot="VFormGroupProps"
          :required="isFieldRequired?.(`beneficials.${itemIndex}.zip_code`)"
          :error-text="getErrorText?.(`beneficials.${itemIndex}.zip_code`, errorData)"
          label="Zip Code"
          data-testid="zip-group"
        >
          <VFormInput
            v-model="model.zip_code"
            :is-error="VFormGroupProps.isFieldError"
            name="zip"
            size="large"
            data-testid="zip"
            placeholder="Zip Code"
            :mask="model.non_us ? undefined : '#####-####'"
            return-masked-value
            disallow-special-chars
            :loading="loading"
          />
        </VFormGroup>
      </FormCol>

      <FormCol col2>
        <VFormGroup
          v-slot="VFormGroupProps"
          :required="isFieldRequired?.(`beneficials.${itemIndex}.country`)"
          :error-text="getErrorText?.(`beneficials.${itemIndex}.country`, errorData)"
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
            searchable
            :options="optionsCountry"
            :loading="loading || (optionsCountry?.length === 0)"
            data-testid="country"
          />
        </VFormGroup>
      </FormCol>
    </FormRow>
  </div>
</template>

<style lang="scss">
.v-form-partial-beneficial-ownership-item {
  display: flex;
  flex-direction: column;
  width: 100%;

  &__subtitle {
    margin-bottom: 20px;
    margin-top: 12px;
  }
}
</style>
