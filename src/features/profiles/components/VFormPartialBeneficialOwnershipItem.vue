<script setup lang="ts">
import { PropType, watch, onMounted } from 'vue';
import FormRow from 'UiKit/components/Base/VForm/VFormRow.vue';
import FormCol from 'UiKit/components/Base/VForm/VFormCol.vue';
import VFormInput from 'UiKit/components/Base/VForm/VFormInput.vue';
import VFormGroup from 'UiKit/components/Base/VForm/VFormGroup.vue';
import VFormCheckbox from 'UiKit/components/Base/VForm/VFormCheckbox.vue';
import { JSONSchemaType } from 'ajv/dist/types/json-schema';
import VFormCombobox from 'UiKit/components/Base/VForm/VFormCombobox.vue';
import { useVFormPartialBeneficialOwnershipItem, FormPartialBeneficialOwnershipItem } from './logic/useVFormPartialBeneficialOwnershipItem';
import { Ref } from 'vue';

const props = defineProps<{
  itemIndex: number;
  validation: object;
  schema: JSONSchemaType<FormPartialBeneficialOwnershipItem>;
  optionsCountry: Array<any>;
  optionsState: Array<any>;
  trust: boolean;
  errorData: any;
  schemaBackend: object;
  loading: boolean;
}>();

const model = defineModel<FormPartialBeneficialOwnershipItem>();

const { title } = useVFormPartialBeneficialOwnershipItem(model.value, props.trust);

onMounted(() => {
  if (model.value && !model.value.type_of_identification) {
    model.value.type_of_identification = { id_number: '', country: '' };
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
          :model="model"
          :validation="validation"
          :schema-back="schemaBackend"
          :schema-front="schema"
          :error-text="errorData?.beneficials[itemIndex].first_name"
          :path="`beneficials.${itemIndex}.first_name`"
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
          :model="model"
          :validation="validation"
          :schema-back="schemaBackend"
          :schema-front="schema"
          :error-text="errorData?.beneficials[itemIndex].last_name"
          :path="`beneficials.${itemIndex}.last_name`"
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
          :model="model"
          :validation="validation"
          :schema-back="schemaBackend"
          :schema-front="schema"
          :error-text="errorData?.beneficials[itemIndex].dob"
          :path="`beneficials.${itemIndex}.dob`"
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
            :model="model"
            :validation="validation"
            :schema-back="schemaBackend"
            :schema-front="schema"
            :error-text="errorData?.beneficials[itemIndex].ssn"
            :path="`beneficials.${itemIndex}.ssn`"
            label="SSN"
            :required="!model.non_us"
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
            :model="model"
            :validation="validation"
            :schema-back="schemaBackend"
            :schema-front="schema"
            :error-text="errorData?.beneficials[itemIndex].type_of_identification?.id_number"
            :path="`beneficials.${itemIndex}.type_of_identification.id_number`"
            label="Passport Series and Number"
            :required="model.non_us"
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
            :model="model"
            :validation="validation"
            :schema-back="schemaBackend"
            :schema-front="schema"
            :error-text="errorData?.beneficials[itemIndex].type_of_identification?.country"
            :path="`beneficials.${itemIndex}.type_of_identification.country`"
            label="Country of Issue"
            :required="model.non_us"
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
          v-slot="VFormGroupProps"
          :model="model"
          :validation="validation"
          :schema-back="schemaBackend"
          :schema-front="schema"
          :error-text="errorData?.beneficials[itemIndex].email"
          :path="`beneficials.${itemIndex}.email`"
          label="Email"
          data-testid="email-group"
        >
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
        </VFormGroup>
      </FormCol>

      <FormCol col-2>
        <VFormGroup
          v-slot="VFormGroupProps"
          :model="model"
          :validation="validation"
          :schema-back="schemaBackend"
          :schema-front="schema"
          :error-text="errorData?.beneficials[itemIndex].phone"
          :path="`beneficials.${itemIndex}.phone`"
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
          :model="model"
          :validation="validation"
          :schema-back="schemaBackend"
          :schema-front="schema"
          :error-text="errorData?.beneficials[itemIndex].address1"
          :path="`beneficials.${itemIndex}.address1`"
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
          :model="model"
          :validation="validation"
          :schema-back="schemaBackend"
          :schema-front="schema"
          :error-text="errorData?.beneficials[itemIndex].address2"
          :path="`beneficials.${itemIndex}.address2`"
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
          :model="model"
          :validation="validation"
          :schema-back="schemaBackend"
          :schema-front="schema"
          :error-text="errorData?.beneficials[itemIndex].city"
          :path="`beneficials.${itemIndex}.city`"
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
          :model="model"
          :validation="validation"
          :schema-back="schemaBackend"
          :schema-front="schema"
          :error-text="errorData?.beneficials[itemIndex].state"
          :path="`beneficials.${itemIndex}.state`"
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
            searchable
            :options="optionsState"
            :loading="loading || (optionsState.length === 0)"
            data-testid="state"
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
          :schema-front="schema"
          :error-text="errorData?.beneficials[itemIndex].zip_code"
          :path="`beneficials.${itemIndex}.zip_code`"
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
            mask="#####-####"
            return-masked-value
            disallow-special-chars
            :loading="loading"
          />
        </VFormGroup>
      </FormCol>

      <FormCol col2>
        <VFormGroup
          v-slot="VFormGroupProps"
          :model="model"
          :validation="validation"
          :schema-back="schemaBackend"
          :schema-front="schema"
          :error-text="errorData?.beneficials[itemIndex].country"
          :path="`beneficials.${itemIndex}.country`"
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
