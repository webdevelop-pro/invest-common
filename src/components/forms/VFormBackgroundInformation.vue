<!-- eslint-disable @typescript-eslint/no-unsafe-assignment -->
<script setup lang="ts">
import {
  ref, computed, watch, reactive, nextTick,
} from 'vue';
import { useUserProfilesStore } from 'InvestCommon/store/useUserProfiles';
import { useUsersStore } from 'InvestCommon/store/useUsers';
import { useHubspotForm } from 'InvestCommon/composable/useHubspotForm';
import FormRow from 'InvestCommon/components/VForm/VFormRow.vue';
import FormCol from 'InvestCommon/components/VForm/VFormCol.vue';
import VFormInput from 'UiKit/components/Base/VForm/VFormInput.vue';
import VButton from 'UiKit/components/Base/VButton/VButton.vue';
import VFormSelect from 'UiKit/components/Base/VForm/VFormSelect.vue';
import { storeToRefs } from 'pinia';
import { PrecompiledValidator } from 'UiKit/helpers/validation/PrecompiledValidator';
import { checkObjectAndDeleteNotRequiredFields, isEmpty } from 'InvestCommon/helpers/general';
import VFormGroup from 'UiKit/components/Base/VForm/VFormGroup.vue';
import { filterSchema, getFilteredObject, scrollToError } from 'UiKit/helpers/validation/general';
import VFormCheckbox from 'UiKit/components/Base/VForm/VFormCheckbox.vue';
import {
  address1Rule, address2Rule, cityRule, emailRule, errorMessageRule, zipRule,
} from 'UiKit/helpers/validation/rules';
import { JSONSchemaType } from 'ajv';
import { ROUTE_DASHBOARD_ACCOUNT } from 'InvestCommon/helpers/enums/routes';
import { useRouter } from 'vue-router';
import { getOptions } from 'UiKit/helpers/model';
import { FormModelBackgroundInformation } from 'InvestCommon/types/form';
import env from 'InvestCommon/global';


const router = useRouter();
const userProfilesStore = useUserProfilesStore();
const {
  isSetProfileByIdLoading, setProfileByIdErrorData, getProfileByIdOptionsData,
} = storeToRefs(userProfilesStore);
const usersStore = useUsersStore();
const {
  selectedUserProfileData, selectedUserProfileId, userAccountData,
  selectedUserProfileType,
} = storeToRefs(usersStore);

const { submitFormToHubspot } = useHubspotForm(env.HUBSPOT_FORM_ID_BACKGROUND_INFORMATION);

const isLoading = ref(false);
const dataEmploymentData = computed(() => selectedUserProfileData.value?.data?.employment);
const dataFinraData = computed(() => selectedUserProfileData.value?.data?.finra_affiliated);
const dataShareholderData = computed(() => selectedUserProfileData.value?.data?.ten_percent_shareholder);

const formModel = {
  employment: {},
  finra_affiliated: {},
  ten_percent_shareholder: {},
  irs_backup_withholding: {},
};


const schemaObject = computed(() => getFilteredObject(getProfileByIdOptionsData.value, formModel) || {});
const optionsEmployment = computed(() => getOptions('employment.type', schemaObject));

const model = reactive({
  employment: {
    type: selectedUserProfileData.value?.data?.employment?.type || 'Retired',
  },
  finra_affiliated: {
    member_firm_name: selectedUserProfileData.value?.data?.finra_affiliated?.member_firm_name || '',
    compliance_contact_name: selectedUserProfileData.value?.data.finra_affiliated?.compliance_contact_name || '',
    compliance_contant_email: selectedUserProfileData.value?.data.finra_affiliated?.compliance_contant_email || '',
    correspondence: selectedUserProfileData.value?.data.finra_affiliated?.correspondence || false,
    member_association: selectedUserProfileData.value?.data.finra_affiliated?.member_association || false,
  },
  ten_percent_shareholder: {
    shareholder_association: dataShareholderData.value?.shareholder_association || false,
    ticker_symbol_list: dataShareholderData.value?.ticker_symbol_list || '',
  },
  irs_backup_withholding: selectedUserProfileData.value?.data?.irs_backup_withholding || false,
} as FormModelBackgroundInformation);


const isAdditionalFields = computed(() => (
  model.employment?.type.includes('full-time')
  || model.employment?.type.includes('part-time')
  || model.employment?.type.includes('self')
));

const requiredEmployment = computed(() => {
  const requiredRules = ['type'];
  if (isAdditionalFields.value) {
    requiredRules.push('address1');
    requiredRules.push('city');
    requiredRules.push('zip_code');
  }
  if (model.employment?.type.includes('full-time')
  || model.employment?.type.includes('part-time')) {
    requiredRules.push('employer_name');
    requiredRules.push('title');
  }
  return requiredRules;
});


const EmploymentInformation = computed(() => ({
  properties: {
    type: {},
    employer_name: {},
    title: {},
    address1: address1Rule,
    address2: address2Rule,
    city: cityRule,
    zip_code: zipRule,
  },
  type: 'object',
  additionalProperties: false,
  required: requiredEmployment.value,
}));

const requiredFinra = computed(() => {
  const requiredRules = [];
  if (model.finra_affiliated.member_association) {
    requiredRules.push('member_firm_name');
    requiredRules.push('compliance_contact_name');
    requiredRules.push('compliance_contant_email');
  }
  return requiredRules;
});


const FinraInformation = computed(() => ({
  properties: {
    member_association: {},
    correspondence: {},
    member_firm_name: {},
    compliance_contact_name: {},
    compliance_contant_email: emailRule,
  },
  type: 'object',
  additionalProperties: false,
  required: requiredFinra.value,
}));

const schemaBackgroundInformation = computed(() => ({
  $schema: 'http://json-schema.org/draft-07/schema#',
  definitions: {
    EmploymentTypes: EmploymentInformation.value,
    FINRAAffiliated: FinraInformation.value,
    Individual: {
      properties: {
        employment: { type: 'object', $ref: '#/definitions/EmploymentTypes' },
        finra_affiliated: { type: 'object', $ref: '#/definitions/FINRAAffiliated' },
        ten_percent_shareholder: {},
        irs_backup_withholding: {
          title: 'irs_backup_withholding',
          type: 'boolean',
        },
      },
      type: 'object',
      errorMessage: errorMessageRule,
    },
  },
  $ref: '#/definitions/Individual',
} as unknown as JSONSchemaType<FormModelBackgroundInformation>
));

let validator = new PrecompiledValidator<FormModelBackgroundInformation>(
  // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
  filterSchema(getProfileByIdOptionsData.value, formModel),
  schemaBackgroundInformation.value,
);
const validation = ref<unknown>();
const isValid = computed(() => isEmpty(validation.value || {}));
const isDisabledButton = computed(() => (!isValid.value || isSetProfileByIdLoading.value));

const onValidate = () => {
  validation.value = validator.getFormValidationErrors(model);
};

const saveHandler = async () => {
  onValidate();
  if (!isValid.value) {
    void nextTick(() => scrollToError('VFormBackgroundInformation'));
    return;
  }

  isLoading.value = true;
  await userProfilesStore.setProfileById(
    {
      employment: {
        ...model.employment,
        type: model.employment.type,
      },
      finra_affiliated: model.finra_affiliated,
      ten_percent_shareholder: model.ten_percent_shareholder,
      irs_backup_withholding: model.irs_backup_withholding,
    },
    selectedUserProfileType.value,
    selectedUserProfileId.value,
  );
  isLoading.value = false;
  void submitFormToHubspot({
    email: userAccountData.value?.email,
    employment_type: model.employment.type,
    employer_name: model.employment.employer_name,
    title: model.employment.title,
    employer_address_1: model.employment.address1,
    employer_address_2: model.employment.address2,
    city: model.employment.city,
    zip: model.employment.zip_code,
    ...model.finra_affiliated,
    ...model.ten_percent_shareholder,
    irs_backup_withholding: model.irs_backup_withholding,
    compliance_contractemail: model.finra_affiliated.compliance_contant_email,
  });
  void userProfilesStore.getProfileById(selectedUserProfileType.value, selectedUserProfileId.value);
  void router.push({ name: ROUTE_DASHBOARD_ACCOUNT, params: { profileId: selectedUserProfileId.value } });
};

const cancelHandler = () => {
  void router.push({ name: ROUTE_DASHBOARD_ACCOUNT, params: { profileId: selectedUserProfileId.value } });
};

watch(() => selectedUserProfileData.value?.data.employment, () => {
  if (dataEmploymentData.value?.type) model.employment.type = dataEmploymentData.value?.type;
  if (dataEmploymentData.value?.employer_name) model.employment.employer_name = dataEmploymentData.value?.employer_name;
  if (dataEmploymentData.value?.title) model.employment.title = dataEmploymentData.value?.title;
  if (dataEmploymentData.value?.address1) model.employment.address1 = dataEmploymentData.value?.address1;
  if (dataEmploymentData.value?.address2) model.employment.address2 = dataEmploymentData.value?.address2;
  if (dataEmploymentData.value?.city) model.employment.city = dataEmploymentData.value?.city;
  if (dataEmploymentData.value?.zip_code) model.employment.zip_code = dataEmploymentData.value?.zip_code;
}, { deep: true, immediate: true });

watch(() => selectedUserProfileData.value?.data.finra_affiliated, () => {
  if (dataFinraData.value?.member_association) {
    model.finra_affiliated.member_association = dataFinraData.value?.member_association;
  }
  if (dataFinraData.value?.correspondence) {
    model.finra_affiliated.correspondence = dataFinraData.value?.correspondence;
  }
  if (dataFinraData.value?.member_firm_name) {
    model.finra_affiliated.member_firm_name = dataFinraData.value?.member_firm_name;
  }
  if (dataFinraData.value?.compliance_contact_name) {
    model.finra_affiliated.compliance_contact_name = dataFinraData.value?.compliance_contact_name;
  }
  if (dataFinraData.value?.compliance_contant_email) {
    model.finra_affiliated.compliance_contant_email = dataFinraData.value?.compliance_contant_email;
  }
}, { deep: true, immediate: true });


watch(() => selectedUserProfileData.value?.data.ten_percent_shareholder, () => {
  if (dataShareholderData.value?.shareholder_association) {
    model.ten_percent_shareholder.shareholder_association = dataShareholderData.value?.shareholder_association;
  }
  if (dataShareholderData.value?.ticker_symbol_list) {
    model.ten_percent_shareholder.ticker_symbol_list = dataShareholderData.value?.ticker_symbol_list;
  }
}, { deep: true, immediate: true });

watch(() => selectedUserProfileData.value?.data.irs_backup_withholding, () => {
  if (selectedUserProfileData.value?.data.irs_backup_withholding) {
    model.irs_backup_withholding = selectedUserProfileData.value?.data.irs_backup_withholding;
  }
}, { deep: true, immediate: true });

watch(() => model, () => {
  if (!isValid.value) onValidate();
}, { deep: true });

watch(() => model.employment.type, () => {
  model.employment = checkObjectAndDeleteNotRequiredFields(['type'], requiredEmployment.value, model.employment);
});
watch(() => model.finra_affiliated?.member_association, () => {
  model.finra_affiliated = checkObjectAndDeleteNotRequiredFields(['member_association', 'correspondence'], requiredFinra.value, model.finra_affiliated);
});

// eslint-disable-next-line
watch(() => [getProfileByIdOptionsData.value, schemaBackgroundInformation.value], () => {
  validator = new PrecompiledValidator<FormModelBackgroundInformation>(
    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    filterSchema(getProfileByIdOptionsData.value, formModel),
    schemaBackgroundInformation.value,
  );
});
</script>

<template>
  <div class="VFormBackgroundInformation form-background-information">
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
            :schema-back="getProfileByIdOptionsData"
            :schema-front="schemaBackgroundInformation"
            :error-text="setProfileByIdErrorData?.employment.type"
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
              dropdown-absolute
              :options="optionsEmployment"
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
              :schema-back="getProfileByIdOptionsData"
              :schema-front="schemaBackgroundInformation"
              :error-text="setProfileByIdErrorData?.employment.employer_name"
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
                @update:model-value="model.employment.employer_name = $event"
              />
            </VFormGroup>
          </FormCol>

          <FormCol col2>
            <VFormGroup
              v-slot="VFormGroupProps"
              :model="model"
              :validation="validation"
              :schema-back="getProfileByIdOptionsData"
              :schema-front="schemaBackgroundInformation"
              :error-text="setProfileByIdErrorData?.employment.title"
              path="employment.title"
              label="Your Title/Role"
            >
              <VFormInput
                :model-value="model.employment.title"
                :is-error="VFormGroupProps.isFieldError"
                placeholder="Your Title/Role"
                name="title"
                size="large"
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
              :schema-back="getProfileByIdOptionsData"
              :schema-front="schemaBackgroundInformation"
              :error-text="setProfileByIdErrorData?.employment.address1"
              path="employment.address1"
              label="Address 1"
            >
              <VFormInput
                :model-value="model.employment.address1"
                :is-error="VFormGroupProps.isFieldError"
                placeholder="Address 1"
                name="address-1"
                size="large"
                @update:model-value="model.employment.address1 = $event"
              />
            </VFormGroup>
          </FormCol>

          <FormCol col2>
            <VFormGroup
              v-slot="VFormGroupProps"
              :model="model"
              :validation="validation"
              :schema-back="getProfileByIdOptionsData"
              :schema-front="schemaBackgroundInformation"
              :error-text="setProfileByIdErrorData?.employment.address2"
              path="employment.address2"
              label="Address 2"
            >
              <VFormInput
                :model-value="model.employment.address2"
                :is-error="VFormGroupProps.isFieldError"
                placeholder="Address 2"
                name="address-2"
                size="large"
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
              :schema-back="getProfileByIdOptionsData"
              :schema-front="schemaBackgroundInformation"
              :error-text="setProfileByIdErrorData?.employment.city"
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
                @update:model-value="model.employment.city = $event"
              />
            </VFormGroup>
          </FormCol>

          <FormCol col2>
            <VFormGroup
              v-slot="VFormGroupProps"
              :model="model"
              :validation="validation"
              :schema-back="getProfileByIdOptionsData"
              :schema-front="schemaBackgroundInformation"
              :error-text="setProfileByIdErrorData?.employment.zip_code"
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
            :schema-back="getProfileByIdOptionsData"
            :schema-front="schemaBackgroundInformation"
            :error-text="setProfileByIdErrorData?.finra_affiliated.member_association"
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
              :schema-back="getProfileByIdOptionsData"
              :schema-front="schemaBackgroundInformation"
              :error-text="setProfileByIdErrorData?.finra_affiliated.correspondence"
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
              :schema-back="getProfileByIdOptionsData"
              :schema-front="schemaBackgroundInformation"
              :error-text="setProfileByIdErrorData?.finra_affiliated.member_firm_name"
              path="finra_affiliated.member_firm_name"
              label="Member Firm Name"
            >
              <VFormInput
                :model-value="model.finra_affiliated.member_firm_name"
                :is-error="VFormGroupProps.isFieldError"
                placeholder="Member Firm Name"
                size="large"
                name="firm-name"
                @update:model-value="model.finra_affiliated.member_firm_name = $event"
              />
            </VFormGroup>
          </FormCol>

          <FormCol col3>
            <VFormGroup
              v-slot="VFormGroupProps"
              :model="model"
              :validation="validation"
              :schema-back="getProfileByIdOptionsData"
              :schema-front="schemaBackgroundInformation"
              :error-text="setProfileByIdErrorData?.finra_affiliated.compliance_contact_name"
              path="finra_affiliated.compliance_contact_name"
              label="Compliance Contact Name"
            >
              <VFormInput
                :model-value="model.finra_affiliated.compliance_contact_name"
                :is-error="VFormGroupProps.isFieldError"
                placeholder="Compliance Contact Name"
                name="contact-name"
                size="large"
                @update:model-value="model.finra_affiliated.compliance_contact_name = $event"
              />
            </VFormGroup>
          </FormCol>

          <FormCol col3>
            <VFormGroup
              v-slot="VFormGroupProps"
              :model="model"
              :validation="validation"
              :schema-back="getProfileByIdOptionsData"
              :schema-front="schemaBackgroundInformation"
              :error-text="setProfileByIdErrorData?.finra_affiliated.compliance_contant_email"
              path="finra_affiliated.compliance_contant_email"
              label="Compliance contact email"
            >
              <VFormInput
                :model-value="model.finra_affiliated.compliance_contant_email"
                :is-error="VFormGroupProps.isFieldError"
                placeholder="Compliance contact email"
                name="contact-email"
                size="large"
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
            :schema-back="getProfileByIdOptionsData"
            :schema-front="schemaBackgroundInformation"
            :error-text="setProfileByIdErrorData?.ten_percent_shareholder.shareholder_association"
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
              :schema-back="getProfileByIdOptionsData"
              :schema-front="schemaBackgroundInformation"
              :error-text="setProfileByIdErrorData?.ten_percent_shareholder?.ticker_symbol_list"
              path="ten_percent_shareholder.ticker_symbol_list"
              label="Ticker symbol list"
            >
              <VFormInput
                :model-value="model.ten_percent_shareholder?.ticker_symbol_list"
                :is-error="VFormGroupProps.isFieldError"
                placeholder="Ticker symbol list"
                name="ticker-symbol"
                size="large"
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
            :schema-back="getProfileByIdOptionsData"
            :schema-front="schemaBackgroundInformation"
            :error-text="setProfileByIdErrorData?.irs_backup_withholdingn"
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
    <div class="form-background-information__footer">
      <VButton
        size="large"
        variant="outlined"
        @click="cancelHandler"
      >
        Cancel
      </VButton>
      <VButton
        size="large"
        :disabled="isDisabledButton"
        :loading="isLoading"
        data-testid="button"
        @click="saveHandler"
      >
        Save
      </VButton>
    </div>
  </div>
</template>

<style lang="scss">
.form-background-information {
  display: flex;
  flex-direction: column;
  margin: 0 auto;
  width: 100%;

  &__header {
    margin-bottom: 40px;
  }

  &__subtitle {
    margin-top: 12px;
    margin-bottom: 20px;
  }

  &__footer {
    display: flex;
    justify-content: flex-end;
    align-items: flex-start;
    gap: 12px;
    margin-top: 20px;
  }
}
</style>
