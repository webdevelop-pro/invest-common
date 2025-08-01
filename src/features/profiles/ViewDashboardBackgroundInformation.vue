<script setup lang="ts">
import { useGlobalLoader } from 'UiKit/store/useGlobalLoader';
import { useFormBackgroundInformation } from './store/useFormBackgroundInformation';
import VLayoutForm from 'InvestCommon/shared/layouts/VLayoutForm.vue';
import FormRow from 'UiKit/components/Base/VForm/VFormRow.vue';
import FormCol from 'UiKit/components/Base/VForm/VFormCol.vue';
import VFormInput from 'UiKit/components/Base/VForm/VFormInput.vue';
import VFormSelect from 'UiKit/components/Base/VForm/VFormSelect.vue';
import VFormGroup from 'UiKit/components/Base/VForm/VFormGroup.vue';
import VFormCheckbox from 'UiKit/components/Base/VForm/VFormCheckbox.vue';

const globalLoader = useGlobalLoader();
globalLoader.hide();

const {
  backButtonText, breadcrumbs, isLoading, isDisabledButton,
  model, schemaBackend, errorData, validation, schemaFrontend,
  isLoadingFields, optionsEmployment, isAdditionalFields, handleSave,
} = useFormBackgroundInformation();


</script>

<template>
  <div class="ViewDashboardBackgroundInformation view-dashboard-background-information is--no-margin">
    <VLayoutForm
      :button-text="backButtonText"
      :breadcrumbs="breadcrumbs"
      :is-disabled-button="isDisabledButton"
      :is-loading="isLoading"
      @save="handleSave"
    >
      <div class="form-background-information__header is--h1__title">
        Your Background Information
      </div>
      <div class="form-background-information__content">
        <FormRow>
          <FormCol>
            <VFormGroup
              v-slot="VFormGroupProps"
              :model="model"
              :validation="validation"
              :schema-back="schemaBackend"
              :schema-front="schemaFrontend"
              :error-text="errorData?.employment.type"
              path="employment.type"
              label="Employment"
            >
              <VFormSelect
                v-model="model.employment.type"
                item-label="name"
                item-value="value"
                :is-error="VFormGroupProps.isFieldError"
                name="employment-type"
                size="large"
                :options="optionsEmployment"
                :loading="isLoadingFields || (optionsEmployment.length === 0)"
              />
            </VFormGroup>
          </FormCol>
        </FormRow>
        <template v-if="isAdditionalFields">
          <FormRow v-if="!model.employment.type.includes('self')">
            <FormCol col2>
              <VFormGroup
                v-slot="VFormGroupProps"
                :model="model"
                :validation="validation"
                :schema-back="schemaBackend"
                :schema-front="schemaFrontend"
                :error-text="errorData?.employment.employer_name"
                path="employment.employer_name"
                label="Employer Name"
              >
                <VFormInput
                  :model-value="model.employment.employer_name"
                  :is-error="VFormGroupProps.isFieldError"
                  placeholder="Employer Name"
                  name="employer-name"
                  size="large"
                  data-testid="employer-name"
                  :loading="isLoadingFields"
                  @update:model-value="model.employment.employer_name = $event"
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
                :error-text="errorData?.employment.title"
                path="employment.title"
                label="Your Title/Role"
              >
                <VFormInput
                  :model-value="model.employment.title"
                  :is-error="VFormGroupProps.isFieldError"
                  placeholder="Your Title/Role"
                  name="title"
                  size="large"
                  :loading="isLoadingFields"
                  @update:model-value="model.employment.title = $event"
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
                :error-text="errorData?.employment.address1"
                path="employment.address1"
                label="Address 1"
              >
                <VFormInput
                  :model-value="model.employment.address1"
                  :is-error="VFormGroupProps.isFieldError"
                  placeholder="Address 1"
                  name="address-1"
                  size="large"
                  :loading="isLoadingFields"
                  @update:model-value="model.employment.address1 = $event"
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
                :error-text="errorData?.employment.address2"
                path="employment.address2"
                label="Address 2"
              >
                <VFormInput
                  :model-value="model.employment.address2"
                  :is-error="VFormGroupProps.isFieldError"
                  placeholder="Address 2"
                  name="address-2"
                  size="large"
                  :loading="isLoadingFields"
                  @update:model-value="model.employment.address2 = $event"
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
                :error-text="errorData?.employment.city"
                path="employment.city"
                label="City"
              >
                <VFormInput
                  :model-value="model.employment.city"
                  :is-error="VFormGroupProps.isFieldError"
                  placeholder="City"
                  name="city"
                  size="large"
                  disallow-special-chars
                  disallow-numbers
                  :loading="isLoadingFields"
                  @update:model-value="model.employment.city = $event"
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
                :error-text="errorData?.employment.zip_code"
                path="employment.zip_code"
                label="Zip Code"
              >
                <VFormInput
                  :model-value="model.employment.zip_code"
                  :is-error="VFormGroupProps.isFieldError"
                  placeholder="Zip Code"
                  size="large"
                  name="zip"
                  mask="#####-####"
                  return-masked-value
                  disallow-special-chars
                  :loading="isLoadingFields"
                  @update:model-value="model.employment.zip_code = $event"
                />
              </VFormGroup>
            </FormCol>
          </FormRow>
        </template>
        <FormRow>
          <FormCol>
            <VFormGroup
              v-slot="VFormGroupProps"
              :model="model"
              :validation="validation"
              :schema-back="schemaBackend"
              :schema-front="schemaFrontend"
              :error-text="errorData?.finra_affiliated.member_association"
              path="finra_affiliated.member_association"
              label="FINRA/SEC Affiliated"
            >
              <VFormCheckbox
                v-model="model.finra_affiliated.member_association"
                :is-error="VFormGroupProps.isFieldError"
              >
                Member Association
              </VFormCheckbox>
            </VFormGroup>
          </FormCol>
        </FormRow>

        <template v-if="model.finra_affiliated.member_association">
          <FormRow>
            <FormCol>
              <VFormGroup
                v-slot="VFormGroupProps"
                :model="model"
                :validation="validation"
                :schema-back="schemaBackend"
                :schema-front="schemaFrontend"
                :error-text="errorData?.finra_affiliated.correspondence"
                path="finra_affiliated.correspondence"
              >
                <VFormCheckbox
                  v-model="model.finra_affiliated.correspondence"
                  :is-error="VFormGroupProps.isFieldError"
                >
                  Correspondence
                </VFormCheckbox>
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
                :error-text="errorData?.finra_affiliated.member_firm_name"
                path="finra_affiliated.member_firm_name"
                label="Member Firm Name"
              >
                <VFormInput
                  :model-value="model.finra_affiliated.member_firm_name"
                  :is-error="VFormGroupProps.isFieldError"
                  placeholder="Member Firm Name"
                  size="large"
                  name="firm-name"
                  :loading="isLoadingFields"
                  @update:model-value="model.finra_affiliated.member_firm_name = $event"
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
                :error-text="errorData?.finra_affiliated.compliance_contact_name"
                path="finra_affiliated.compliance_contact_name"
                label="Compliance Contact Name"
              >
                <VFormInput
                  :model-value="model.finra_affiliated.compliance_contact_name"
                  :is-error="VFormGroupProps.isFieldError"
                  placeholder="Compliance Contact Name"
                  name="contact-name"
                  size="large"
                  :loading="isLoadingFields"
                  @update:model-value="model.finra_affiliated.compliance_contact_name = $event"
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
                :error-text="errorData?.finra_affiliated.compliance_contant_email"
                path="finra_affiliated.compliance_contant_email"
                label="Compliance contact email"
              >
                <VFormInput
                  :model-value="model.finra_affiliated.compliance_contant_email"
                  :is-error="VFormGroupProps.isFieldError"
                  placeholder="Compliance contact email"
                  name="contact-email"
                  size="large"
                  :loading="isLoadingFields"
                  @update:model-value="model.finra_affiliated.compliance_contant_email = $event"
                />
              </VFormGroup>
            </FormCol>
          </FormRow>
        </template>
        <FormRow>
          <FormCol>
            <VFormGroup
              v-slot="VFormGroupProps"
              :model="model"
              :validation="validation"
              :schema-back="schemaBackend"
              :schema-front="schemaFrontend"
              :error-text="errorData?.ten_percent_shareholder.shareholder_association"
              path="ten_percent_shareholder.shareholder_association"
              label="10% Shareholder"
            >
              <VFormCheckbox
                v-model="model.ten_percent_shareholder.shareholder_association"
                :is-error="VFormGroupProps.isFieldError"
              >
                Shareholder Association
              </VFormCheckbox>
            </VFormGroup>
          </FormCol>
        </FormRow>
        <template v-if="model.ten_percent_shareholder?.shareholder_association">
          <FormRow>
            <FormCol>
              <VFormGroup
                v-slot="VFormGroupProps"
                :model="model"
                :validation="validation"
                :schema-back="schemaBackend"
                :schema-front="schemaFrontend"
                :error-text="errorData?.ten_percent_shareholder?.ticker_symbol_list"
                path="ten_percent_shareholder.ticker_symbol_list"
                label="Ticker symbol list"
              >
                <VFormInput
                  :model-value="model.ten_percent_shareholder?.ticker_symbol_list"
                  :is-error="VFormGroupProps.isFieldError"
                  placeholder="Ticker symbol list"
                  name="ticker-symbol"
                  size="large"
                  :loading="isLoadingFields"
                  @update:model-value="model.ten_percent_shareholder.ticker_symbol_list = $event"
                />
              </VFormGroup>
            </FormCol>
          </FormRow>
        </template>
        <FormRow>
          <FormCol>
            <VFormGroup
              v-slot="VFormGroupProps"
              :model="model"
              :validation="validation"
              :schema-back="schemaBackend"
              :schema-front="schemaFrontend"
              :error-text="errorData?.irs_backup_withholdingn"
              path="irs_backup_withholding"
              label="IRS Backup Withholding"
            >
              <VFormCheckbox
                v-model="model.irs_backup_withholding"
                :is-error="VFormGroupProps.isFieldError"
              >
                IRS Backup Withholding
              </VFormCheckbox>
            </VFormGroup>
          </FormCol>
        </FormRow>
      </div>
    </VLayoutForm>
  </div>
</template>

<style lang="scss">
.view-dashboard-background-information {
  width: 100%;

  &__header {
    margin-bottom: 40px;
    min-height: 75px;
  }
}
</style>
