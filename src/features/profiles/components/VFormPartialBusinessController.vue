<script setup lang="ts">
import { PropType, computed } from 'vue';
import FormRow from 'UiKit/components/Base/VForm/VFormRow.vue';
import FormCol from 'UiKit/components/Base/VForm/VFormCol.vue';
import VFormInput from 'UiKit/components/Base/VForm/VFormInput.vue';
import VFormCheckbox from 'UiKit/components/Base/VForm/VFormCheckbox.vue';
import VFormGroup from 'UiKit/components/Base/VForm/VFormGroup.vue';
import VFormCombobox from 'UiKit/components/Base/VForm/VFormCombobox.vue';
import { JSONSchemaType } from 'ajv/dist/types/json-schema';
import { FormModelPersonalInformation } from 'InvestCommon/types/form';
import { useVFormPartialBusinessController, FormModelBusinessController } from './logic/useVFormPartialBusinessController';

const props = defineProps({
  modelData: Object as PropType<FormModelBusinessController>,
  personalData: Object as PropType<FormModelPersonalInformation>,
  errorData: Object,
  schemaBackend: Object as PropType<JSONSchemaType<FormModelBusinessController> | undefined>,
  loading: Boolean,
  trust: Boolean,
  isEditMode: Boolean,
});

// Create computed refs for reactive props
const modelDataComputed = computed(() => props.modelData);
const personalDataComputed = computed(() => props.personalData);
const schemaBackendComputed = computed(() => props.schemaBackend);
const errorDataComputed = computed(() => props.errorData);
const loadingComputed = computed(() => props.loading);
const trustComputed = computed(() => props.trust);

const {
  model,
  validation,
  isValid,
  onValidate,
  isFieldRequired,
  getErrorText,
  optionsCountry,
  optionsState,
  sameData,
  title,
  checkboxText,
} = useVFormPartialBusinessController(
  modelDataComputed,
  personalDataComputed,
  schemaBackendComputed,
  errorDataComputed,
  loadingComputed,
  trustComputed,
);

defineExpose({
  model, validation, isValid, onValidate,
});
</script>

<template>
  <div class="VFormPartialBusinessController v-form-partial-business-controller">
    <div class="v-form-partial-business-controller__subtitle is--h3__title">
      {{ title }}
    </div>
    <FormRow>
      <FormCol>
        <VFormCheckbox
          v-model="sameData"
          :readonly="isEditMode"
          data-testid="V-checkbox"
          class="signup-form__checkbox"
        >
          {{ checkboxText }}
        </VFormCheckbox>
      </FormCol>
    </FormRow>
    <template v-if="!sameData">
      <FormRow>
        <FormCol col2>
          <VFormGroup
            v-slot="VFormGroupProps"
            :required="isFieldRequired('business_controller.first_name')"
            :error-text="getErrorText('business_controller.first_name', errorDataComputed as any)"
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
              :loading="loadingComputed"
              @update:model-value="model.business_controller.first_name = $event"
            />
          </VFormGroup>
        </FormCol>

        <FormCol col2>
          <VFormGroup
            v-slot="VFormGroupProps"
            :required="isFieldRequired('business_controller.last_name')"
            :error-text="getErrorText('business_controller.last_name', errorDataComputed as any)"
            label="Last Name"
            data-testid="last-name-group"
          >
            <VFormInput
              :model-value="model.business_controller.last_name"
              :is-error="VFormGroupProps.isFieldError"
              placeholder="Last Name"
              name="last-name"
              size="large"
              :loading="loadingComputed"
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
            :required="isFieldRequired('business_controller.phone')"
            :error-text="getErrorText('business_controller.phone', errorDataComputed as any)"
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
              :loading="loadingComputed"
              data-testid="phone"
              @update:model-value="model.business_controller.phone = $event"
            />
          </VFormGroup>
        </FormCol>
        <FormCol col-2>
          <VFormGroup
            v-slot="VFormGroupProps"
            :required="isFieldRequired('business_controller.dob')"
            :error-text="getErrorText('business_controller.dob', errorDataComputed as any)"
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
              :loading="loadingComputed"
              @update:model-value="model.business_controller.dob = $event"
            />
          </VFormGroup>
        </FormCol>
      </FormRow>
      <FormRow>
        <FormCol col2>
          <VFormGroup
            v-slot="VFormGroupProps"
            :required="isFieldRequired('business_controller.address1')"
            :error-text="getErrorText('business_controller.address1', errorDataComputed as any)"
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
              :loading="loadingComputed"
              @update:model-value="model.business_controller.address1 = $event"
            />
          </VFormGroup>
        </FormCol>

        <FormCol col2>
          <VFormGroup
            v-slot="VFormGroupProps"
            :required="isFieldRequired('business_controller.address2')"
            :error-text="getErrorText('business_controller.address2', errorDataComputed as any)"
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
              :loading="loadingComputed"
              @update:model-value="model.business_controller.address2 = $event"
            />
          </VFormGroup>
        </FormCol>
      </FormRow>

      <FormRow>
        <FormCol col2>
          <VFormGroup
            v-slot="VFormGroupProps"
            :required="isFieldRequired('business_controller.city')"
            :error-text="getErrorText('business_controller.city', errorDataComputed as any)"
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
              :loading="loadingComputed"
              @update:model-value="model.business_controller.city = $event"
            />
          </VFormGroup>
        </FormCol>
        <FormCol col2>
          <VFormGroup
            v-slot="VFormGroupProps"
            :required="isFieldRequired('business_controller.state')"
            :error-text="getErrorText('business_controller.state', errorDataComputed as any)"
            label="State"
            data-testid="state-group"
          >
            <VFormCombobox
              v-model="model.business_controller.state"
              :is-error="VFormGroupProps.isFieldError"
              name="state"
              size="large"
              placeholder="State"
              item-label="name"
              item-value="value"
              searchable
              :options="optionsState"
              data-testid="state"
              :loading="loadingComputed || (optionsState.length === 0)"
            />
          </VFormGroup>
        </FormCol>
      </FormRow>

      <FormRow>
        <FormCol col2>
          <VFormGroup
            v-slot="VFormGroupProps"
            :required="isFieldRequired('business_controller.zip_code')"
            :error-text="getErrorText('business_controller.zip_code', errorDataComputed as any)"
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
              :loading="loadingComputed"
              @update:model-value="model.business_controller.zip_code = $event"
            />
          </VFormGroup>
        </FormCol>

        <FormCol col2>
          <VFormGroup
            v-slot="VFormGroupProps"
            :required="isFieldRequired('business_controller.country')"
            :error-text="getErrorText('business_controller.country', errorDataComputed as any)"
            label="Country"
            data-testid="country-group"
          >
            <VFormCombobox
              v-model="model.business_controller.country"
              :is-error="VFormGroupProps.isFieldError"
              name="country"
              size="large"
              placeholder="Country"
              item-label="name"
              item-value="value"
              searchable
              :options="optionsCountry"
              data-testid="country"
              :loading="loadingComputed || (optionsCountry.length === 0)"
            />
          </VFormGroup>
        </FormCol>
      </FormRow>
      <FormRow>
        <FormCol col2>
          <VFormGroup
            :required="isFieldRequired('business_controller.email')"
            :error-text="getErrorText('business_controller.email', errorDataComputed as any)"
            label="Email"
            data-testid="email-group"
          >
            <template #default="VFormGroupProps">
              <VFormInput
                :is-error="VFormGroupProps.isFieldError"
                :model-value="model.business_controller.email"
                placeholder="Email Address"
                name="email"
                text
                type="email"
                size="large"
                :loading="loadingComputed"
                @update:model-value="model.business_controller.email = $event"
              />
            </template>
            <template #tooltip>
              Email address will be used to send identity verification links to trust/entity associates.
            </template>
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
