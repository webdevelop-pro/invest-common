<script setup lang="ts">
import { useGlobalLoader } from 'UiKit/store/useGlobalLoader';
import VLayoutForm from 'InvestCommon/shared/layouts/VLayoutForm.vue';
import { useFormTrustedContact } from './store/useFormTrustedContact';
import FormRow from 'UiKit/components/Base/VForm/VFormRow.vue';
import FormCol from 'UiKit/components/Base/VForm/VFormCol.vue';
import VFormInput from 'UiKit/components/Base/VForm/VFormInput.vue';
import VFormGroup from 'UiKit/components/Base/VForm/VFormGroup.vue';

const globalLoader = useGlobalLoader();
globalLoader.hide();

const {
  backButtonText, breadcrumbs, isLoading, isDisabledButton,
  backButtonRoute,
  model, schemaBackend, errorData, validation, schemaFrontend,
  isLoadingFields, handleSave,
} = useFormTrustedContact();

</script>

<template>
  <div class="ViewDashboardTrustedContact view-dashboard-trusted-contact is--no-margin">
    <VLayoutForm
      :button-text="backButtonText"
      :breadcrumbs="breadcrumbs"
      :is-disabled-button="isDisabledButton"
      :is-loading="isLoading"
      :button-route="backButtonRoute"
      @save="handleSave"
    >
      <div class="view-dashboard-trusted-contact__header is--h1__title">
        Trusted Contact
      </div>
      <div class="view-dashboard-trusted-contact__content">
        <FormRow>
          <FormCol col3>
            <VFormGroup
              v-slot="VFormGroupProps"
              :model="model"
              :validation="validation"
              :schema-back="schemaBackend"
              :schema-front="schemaFrontend"
              :error-text="errorData?.beneficiary?.relationship_type"
              path="beneficiary.relationship_type"
              label="Relationship Type"
              data-testid="relationship-type-group"
            >
              <VFormInput
                :model-value="model.beneficiary?.relationship_type"
                :is-error="VFormGroupProps.isFieldError"
                placeholder="Relationship Type"
                name="relationship-type"
                size="large"
                :loading="isLoadingFields"
                data-testid="relationship-type"
                @update:model-value="model.beneficiary.relationship_type = $event"
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
              :error-text="errorData?.beneficiary?.first_name"
              path="beneficiary.first_name"
              label="First Name"
              data-testid="first-name-group"
            >
              <VFormInput
                :model-value="model.beneficiary?.first_name"
                :is-error="VFormGroupProps.isFieldError"
                placeholder="First Name"
                name="first-name"
                size="large"
                data-testid="first-name"
                :loading="isLoadingFields"
                @update:model-value="model.beneficiary.first_name = $event"
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
              :error-text="errorData?.beneficiary?.last_name"
              path="beneficiary.last_name"
              label="Last Name"
              data-testid="last-name-group"
            >
              <VFormInput
                :model-value="model.beneficiary?.last_name"
                :is-error="VFormGroupProps.isFieldError"
                placeholder="Last Name"
                name="last-name"
                size="large"
                data-testid="last-name"
                :loading="isLoadingFields"
                @update:model-value="model.beneficiary.last_name = $event"
              />
            </VFormGroup>
          </FormCol>
        </FormRow>
        <FormRow>
          <FormCol col3>
            <VFormGroup
              v-slot="VFormGroupProps"
              :model="model"
              :validation="validation"
              :schema-back="schemaBackend"
              :schema-front="schemaFrontend"
              :error-text="errorData?.beneficiary?.dob"
              path="beneficiary.dob"
              label="Date Of Birth"
              data-testid="dob-group"
            >
              <VFormInput
                :model-value="model.beneficiary?.dob"
                :is-error="VFormGroupProps.isFieldError"
                placeholder="Date Of Birth"
                name="dob"
                size="large"
                type="date"
                data-testid="dob"
                :loading="isLoadingFields"
                @update:model-value="model.beneficiary.dob = $event"
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
              :error-text="errorData?.beneficiary?.phone"
              path="beneficiary.phone"
              label="Phone number"
              data-testid="phone-group"
            >
              <VFormInput
                :model-value="model.beneficiary?.phone"
                :is-error="VFormGroupProps.isFieldError"
                placeholder="+1 (___) ___ - ____"
                name="phone"
                size="large"
                mask="+#(###)###-####"
                disallow-special-chars
                data-testid="phone"
                :loading="isLoadingFields"
                @update:model-value="model.beneficiary.phone = $event"
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
              :error-text="errorData?.beneficiary?.email"
              path="beneficiary.email"
              label="Email address"
              data-testid="email-group"
            >
              <VFormInput
                :model-value="model.beneficiary?.email"
                :is-error="VFormGroupProps.isFieldError"
                placeholder="Email address"
                name="email"
                size="large"
                data-testid="email"
                :loading="isLoadingFields"
                @update:model-value="model.beneficiary.email = $event"
              />
            </VFormGroup>
          </FormCol>
        </FormRow>
      </div>
    </VLayoutForm>
  </div>
</template>

<style lang="scss">
.view-dashboard-trusted-contact {
  width: 100%;

  &__header {
    margin-bottom: 40px;
    min-height: 75px;
  }
}
</style>
