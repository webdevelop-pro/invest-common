<!-- eslint-disable @typescript-eslint/no-unsafe-assignment -->
<script setup lang="ts">
import {
  ref, computed, watch, reactive, nextTick,
} from 'vue';
import { useUserIdentitysStore, useUsersStore } from 'InvestCommon/store';
import { useHubspotForm } from 'InvestCommon/composable';
import FormRow from 'InvestCommon/components/common/FormRow.vue';
import FormCol from 'InvestCommon/components/common/FormCol.vue';
import BaseFormInput from 'UiKit/components/BaseFormInput/BaseFormInput.vue';
import BaseButton from 'UiKit/components/BaseButton/BaseButton.vue';
import BaseFormSelect from 'UiKit/components/BaseFormSelect/BaseFormSelect.vue';
import { storeToRefs } from 'pinia';
import { PrecompiledValidator } from 'UiKit/helpers/validation/PrecompiledValidator';
import { checkObjectAndDeleteNotRequiredFields, isEmpty } from 'InvestCommon/helpers/general';
import BaseFormGroup from 'UiKit/components/BaseFormGroup/BaseFormGroup.vue';
import {
  FormModelBackgroundInformation, SELECT_OPTIONS_EMPLOYMENT,
} from './utils';
import { filterSchema, scrollToError } from 'UiKit/helpers/validation/general';
import { EmploymentTypes } from 'InvestCommon/helpers/enums/general';
import BaseFormCheckbox from 'UiKit/components/BaseFormCheckbox/BaseFormCheckbox.vue';
import {
  address1Rule, address2Rule, cityRule, emailRule, errorMessageRule, zipRule,
} from 'UiKit/helpers/validation/rules';
import { JSONSchemaType } from 'ajv';
import { ROUTE_DASHBOARD_ACCOUNT } from 'InvestCommon/helpers/enums/routes';
import { useRouter } from 'vue-router';

const props = defineProps({
  hubsportFormId: String,
});

const router = useRouter();
const userIdentityStore = useUserIdentitysStore();
const {
  isSetUserIdentityLoading, setUserIdentityErrorData, setUserIdentityOptionsData,
} = storeToRefs(userIdentityStore);
const usersStore = useUsersStore();
const { selectedUserProfileData, selectedUserProfileId, userAccountData } = storeToRefs(usersStore);

const { submitFormToHubspot } = useHubspotForm(props.hubsportFormId);

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


function TextToType(type: string | undefined) {
  if (!type) return undefined;
  return SELECT_OPTIONS_EMPLOYMENT.find((item) => item.text === type)?.value;
}


const model = reactive({
  employment: {
    type: TextToType(selectedUserProfileData.value?.data?.employment?.type) || EmploymentTypes.retired,
  },
  finra_affiliated: {
    member_firm_name: selectedUserProfileData.value?.data?.finra_affiliated?.member_firm_name || '',
    compliance_contract_name: selectedUserProfileData.value?.data.finra_affiliated?.compliance_contract_name || '',
    compliance_contract_email: selectedUserProfileData.value?.data.finra_affiliated?.compliance_contract_email || '',
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
  model.employment?.type === EmploymentTypes.full
  || model.employment?.type === EmploymentTypes.part
  || model.employment?.type === EmploymentTypes.self
));

const requiredEmployment = computed(() => {
  const requiredRules = ['type'];
  if (isAdditionalFields.value) {
    requiredRules.push('address1');
    requiredRules.push('city');
    requiredRules.push('postal_code');
  }
  if (model.employment?.type === EmploymentTypes.full
  || model.employment?.type === EmploymentTypes.part) {
    requiredRules.push('employer_name');
    requiredRules.push('role');
  }
  return requiredRules;
});


const EmploymentInformation = computed(() => ({
  properties: {
    type: {},
    employer_name: {},
    role: {},
    address1: address1Rule,
    address2: address2Rule,
    city: cityRule,
    postal_code: zipRule,
  },
  type: 'object',
  additionalProperties: false,
  required: requiredEmployment.value,
}));

const requiredFinra = computed(() => {
  const requiredRules = [];
  if (model.finra_affiliated.member_association) {
    requiredRules.push('member_firm_name');
    requiredRules.push('compliance_contract_name');
    requiredRules.push('compliance_contract_email');
  }
  return requiredRules;
});


const FinraInformation = computed(() => ({
  properties: {
    member_association: {},
    correspondence: {},
    member_firm_name: {},
    compliance_contract_name: {},
    compliance_contract_email: emailRule,
  },
  type: 'object',
  additionalProperties: false,
  required: requiredFinra.value,
}));

const schemaBackgroundInformation = computed(() => ({
  $schema: 'http://json-schema.org/draft-07/schema#',
  definitions: {
    EmploymentInformation: EmploymentInformation.value,
    FinraInformation: FinraInformation.value,
    PatchIndividualProfile: {
      properties: {
        employment: { type: 'object', $ref: '#/definitions/EmploymentInformation' },
        finra_affiliated: { type: 'object', $ref: '#/definitions/FinraInformation' },
        ten_percent_shareholder: { },
        irs_backup_withholding: {
          title: 'irs_backup_withholding',
          type: 'boolean',
        },
      },
      type: 'object',
      errorMessage: errorMessageRule,
    },
  },
  $ref: '#/definitions/PatchIndividualProfile',
} as unknown as JSONSchemaType<FormModelBackgroundInformation>
));

let validator = new PrecompiledValidator<FormModelBackgroundInformation>(
  // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
  filterSchema(setUserIdentityOptionsData.value, formModel),
  schemaBackgroundInformation.value,
);
const validation = ref<unknown>();
const isValid = computed(() => isEmpty(validation.value || {}));
const isDisabledButton = computed(() => (!isValid.value || isSetUserIdentityLoading.value));

const onValidate = () => {
  validation.value = validator.getFormValidationErrors(model);
};

function typeToText(type: string) {
  return SELECT_OPTIONS_EMPLOYMENT.find((item) => item.value === type)?.text;
}

const saveHandler = async () => {
  onValidate();
  if (!isValid.value) {
    void nextTick(() => scrollToError('FormBackgroundInformation'));
    return;
  }

  isLoading.value = true;
  await userIdentityStore.setUserIdentity({
    employment: {
      ...model.employment,
      type: typeToText(model.employment.type) as string,
    },
    finra_affiliated: model.finra_affiliated,
    ten_percent_shareholder: model.ten_percent_shareholder,
    irs_backup_withholding: model.irs_backup_withholding,
  });
  isLoading.value = false;
  void submitFormToHubspot({
    email: userAccountData.value?.email,
    employment_type: model.employment.type,
    employer_name: model.employment.employer_name,
    role: model.employment.role,
    employer_address_1: model.employment.address1,
    employer_address_2: model.employment.address2,
    city: model.employment.city,
    zip: model.employment.postal_code,
    ...model.finra_affiliated,
    ...model.ten_percent_shareholder,
    irs_backup_withholding: model.irs_backup_withholding,
    compliance_contractemail: model.finra_affiliated.compliance_contract_email,
  });
  void userIdentityStore.getUserIndividualProfile();
  void router.push({ name: ROUTE_DASHBOARD_ACCOUNT, params: { profileId: selectedUserProfileId.value } });
};

const cancelHandler = () => {
  void router.push({ name: ROUTE_DASHBOARD_ACCOUNT, params: { profileId: selectedUserProfileId.value } });
};

watch(() => selectedUserProfileData.value?.data.employment, () => {
  if (dataEmploymentData.value?.type) model.employment.type = TextToType(dataEmploymentData.value?.type);
  if (dataEmploymentData.value?.employer_name) model.employment.employer_name = dataEmploymentData.value?.employer_name;
  if (dataEmploymentData.value?.role) model.employment.role = dataEmploymentData.value?.role;
  if (dataEmploymentData.value?.address1) model.employment.address1 = dataEmploymentData.value?.address1;
  if (dataEmploymentData.value?.address2) model.employment.address2 = dataEmploymentData.value?.address2;
  if (dataEmploymentData.value?.city) model.employment.city = dataEmploymentData.value?.city;
  if (dataEmploymentData.value?.postal_code) model.employment.postal_code = dataEmploymentData.value?.postal_code;
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
  if (dataFinraData.value?.compliance_contract_name) {
    model.finra_affiliated.compliance_contract_name = dataFinraData.value?.compliance_contract_name;
  }
  if (dataFinraData.value?.compliance_contract_email) {
    model.finra_affiliated.compliance_contract_email = dataFinraData.value?.compliance_contract_email;
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
watch(() => [setUserIdentityOptionsData.value, schemaBackgroundInformation.value], () => {
  validator = new PrecompiledValidator<FormModelBackgroundInformation>(
    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    filterSchema(setUserIdentityOptionsData.value, formModel),
    schemaBackgroundInformation.value,
  );
});
</script>

<template>
  <div class="FormBackgroundInformation form-background-information">
    <div class="form-background-information__header is--h1__title">
      Your Background Information
    </div>
    <div class="form-background-information__content">
      <FormRow>
        <FormCol>
          <BaseFormGroup
            v-slot="baseFormGroupProps"
            :model="model"
            :validation="validation"
            :schema-back="setUserIdentityOptionsData"
            :schema-front="schemaBackgroundInformation"
            :error-text="setUserIdentityErrorData?.employment.type"
            path="employment.type"
            label="Employment"
          >
            <BaseFormSelect
              v-model="model.employment.type"
              item-label="text"
              item-value="value"
              :is-error="baseFormGroupProps.isFieldError"
              name="employment-type"
              size="large"
              dropdown-absolute
              :options="SELECT_OPTIONS_EMPLOYMENT"
            />
          </BaseFormGroup>
        </FormCol>
      </FormRow>
      <template v-if="isAdditionalFields">
        <FormRow v-if="model.employment.type !== EmploymentTypes.self">
          <FormCol col2>
            <BaseFormGroup
              v-slot="baseFormGroupProps"
              :model="model"
              :validation="validation"
              :schema-back="setUserIdentityOptionsData"
              :schema-front="schemaBackgroundInformation"
              :error-text="setUserIdentityErrorData?.employment.employer_name"
              path="employment.employer_name"
              label="Employer Name"
            >
              <BaseFormInput
                :model-value="model.employment.employer_name"
                :is-error="baseFormGroupProps.isFieldError"
                placeholder="Employer Name"
                name="employer-name"
                size="large"
                data-testid="employer-name"
                @update:model-value="model.employment.employer_name = $event"
              />
            </BaseFormGroup>
          </FormCol>

          <FormCol col2>
            <BaseFormGroup
              v-slot="baseFormGroupProps"
              :model="model"
              :validation="validation"
              :schema-back="setUserIdentityOptionsData"
              :schema-front="schemaBackgroundInformation"
              :error-text="setUserIdentityErrorData?.employment.role"
              path="employment.role"
              label="Your Title/Role"
            >
              <BaseFormInput
                :model-value="model.employment.role"
                :is-error="baseFormGroupProps.isFieldError"
                placeholder="Your Title/Role"
                name="role"
                size="large"
                @update:model-value="model.employment.role = $event"
              />
            </BaseFormGroup>
          </FormCol>
        </FormRow>

        <FormRow>
          <FormCol col2>
            <BaseFormGroup
              v-slot="baseFormGroupProps"
              :model="model"
              :validation="validation"
              :schema-back="setUserIdentityOptionsData"
              :schema-front="schemaBackgroundInformation"
              :error-text="setUserIdentityErrorData?.employment.address1"
              path="employment.address1"
              label="Address 1"
            >
              <BaseFormInput
                :model-value="model.employment.address1"
                :is-error="baseFormGroupProps.isFieldError"
                placeholder="Address 1"
                name="address-1"
                size="large"
                @update:model-value="model.employment.address1 = $event"
              />
            </BaseFormGroup>
          </FormCol>

          <FormCol col2>
            <BaseFormGroup
              v-slot="baseFormGroupProps"
              :model="model"
              :validation="validation"
              :schema-back="setUserIdentityOptionsData"
              :schema-front="schemaBackgroundInformation"
              :error-text="setUserIdentityErrorData?.employment.address2"
              path="employment.address2"
              label="Address 2"
            >
              <BaseFormInput
                :model-value="model.employment.address2"
                :is-error="baseFormGroupProps.isFieldError"
                placeholder="Address 2"
                name="address-2"
                size="large"
                @update:model-value="model.employment.address2 = $event"
              />
            </BaseFormGroup>
          </FormCol>
        </FormRow>

        <FormRow>
          <FormCol col2>
            <BaseFormGroup
              v-slot="baseFormGroupProps"
              :model="model"
              :validation="validation"
              :schema-back="setUserIdentityOptionsData"
              :schema-front="schemaBackgroundInformation"
              :error-text="setUserIdentityErrorData?.employment.city"
              path="employment.city"
              label="City"
            >
              <BaseFormInput
                :model-value="model.employment.city"
                :is-error="baseFormGroupProps.isFieldError"
                placeholder="City"
                name="city"
                size="large"
                disallow-special-chars
                disallow-numbers
                @update:model-value="model.employment.city = $event"
              />
            </BaseFormGroup>
          </FormCol>

          <FormCol col2>
            <BaseFormGroup
              v-slot="baseFormGroupProps"
              :model="model"
              :validation="validation"
              :schema-back="setUserIdentityOptionsData"
              :schema-front="schemaBackgroundInformation"
              :error-text="setUserIdentityErrorData?.employment.postal_code"
              path="employment.postal_code"
              label="Zip Code"
            >
              <BaseFormInput
                :model-value="model.employment.postal_code"
                :is-error="baseFormGroupProps.isFieldError"
                placeholder="Zip Code"
                size="large"
                name="zip"
                mask="#####-####"
                return-masked-value
                disallow-special-chars
                @update:model-value="model.employment.postal_code = $event"
              />
            </BaseFormGroup>
          </FormCol>
        </FormRow>
      </template>
      <FormRow>
        <FormCol>
          <BaseFormGroup
            v-slot="baseFormGroupProps"
            :model="model"
            :validation="validation"
            :schema-back="setUserIdentityOptionsData"
            :schema-front="schemaBackgroundInformation"
            :error-text="setUserIdentityErrorData?.finra_affiliated.member_association"
            path="finra_affiliated.member_association"
            label="FINRA/SEC Affiliated"
          >
            <BaseFormCheckbox
              v-model="model.finra_affiliated.member_association"
              :is-error="baseFormGroupProps.isFieldError"
            >
              Member Association
            </BaseFormCheckbox>
          </BaseFormGroup>
        </FormCol>
      </FormRow>

      <template v-if="model.finra_affiliated.member_association">
        <FormRow>
          <FormCol>
            <BaseFormGroup
              v-slot="baseFormGroupProps"
              :model="model"
              :validation="validation"
              :schema-back="setUserIdentityOptionsData"
              :schema-front="schemaBackgroundInformation"
              :error-text="setUserIdentityErrorData?.finra_affiliated.correspondence"
              path="finra_affiliated.correspondence"
            >
              <BaseFormCheckbox
                v-model="model.finra_affiliated.correspondence"
                :is-error="baseFormGroupProps.isFieldError"
              >
                Correspondence
              </BaseFormCheckbox>
            </BaseFormGroup>
          </FormCol>
        </FormRow>
        <FormRow>
          <FormCol col3>
            <BaseFormGroup
              v-slot="baseFormGroupProps"
              :model="model"
              :validation="validation"
              :schema-back="setUserIdentityOptionsData"
              :schema-front="schemaBackgroundInformation"
              :error-text="setUserIdentityErrorData?.finra_affiliated.member_firm_name"
              path="finra_affiliated.member_firm_name"
              label="Member Firm Name"
            >
              <BaseFormInput
                :model-value="model.finra_affiliated.member_firm_name"
                :is-error="baseFormGroupProps.isFieldError"
                placeholder="Member Firm Name"
                size="large"
                name="firm-name"
                @update:model-value="model.finra_affiliated.member_firm_name = $event"
              />
            </BaseFormGroup>
          </FormCol>

          <FormCol col3>
            <BaseFormGroup
              v-slot="baseFormGroupProps"
              :model="model"
              :validation="validation"
              :schema-back="setUserIdentityOptionsData"
              :schema-front="schemaBackgroundInformation"
              :error-text="setUserIdentityErrorData?.finra_affiliated.compliance_contract_name"
              path="finra_affiliated.compliance_contract_name"
              label="Compliance Contact Name"
            >
              <BaseFormInput
                :model-value="model.finra_affiliated.compliance_contract_name"
                :is-error="baseFormGroupProps.isFieldError"
                placeholder="Compliance Contact Name"
                name="contact-name"
                size="large"
                @update:model-value="model.finra_affiliated.compliance_contract_name = $event"
              />
            </BaseFormGroup>
          </FormCol>

          <FormCol col3>
            <BaseFormGroup
              v-slot="baseFormGroupProps"
              :model="model"
              :validation="validation"
              :schema-back="setUserIdentityOptionsData"
              :schema-front="schemaBackgroundInformation"
              :error-text="setUserIdentityErrorData?.finra_affiliated.compliance_contract_email"
              path="finra_affiliated.compliance_contract_email"
              label="Compliance contact email"
            >
              <BaseFormInput
                :model-value="model.finra_affiliated.compliance_contract_email"
                :is-error="baseFormGroupProps.isFieldError"
                placeholder="Compliance contact email"
                name="contact-email"
                size="large"
                @update:model-value="model.finra_affiliated.compliance_contract_email = $event"
              />
            </BaseFormGroup>
          </FormCol>
        </FormRow>
      </template>
      <FormRow>
        <FormCol>
          <BaseFormGroup
            v-slot="baseFormGroupProps"
            :model="model"
            :validation="validation"
            :schema-back="setUserIdentityOptionsData"
            :schema-front="schemaBackgroundInformation"
            :error-text="setUserIdentityErrorData?.ten_percent_shareholder.shareholder_association"
            path="ten_percent_shareholder.shareholder_association"
            label="10% Shareholder"
          >
            <BaseFormCheckbox
              v-model="model.ten_percent_shareholder.shareholder_association"
              :is-error="baseFormGroupProps.isFieldError"
            >
              Shareholder Association
            </BaseFormCheckbox>
          </BaseFormGroup>
        </FormCol>
      </FormRow>
      <template v-if="model.ten_percent_shareholder?.shareholder_association">
        <FormRow>
          <FormCol>
            <BaseFormGroup
              v-slot="baseFormGroupProps"
              :model="model"
              :validation="validation"
              :schema-back="setUserIdentityOptionsData"
              :schema-front="schemaBackgroundInformation"
              :error-text="setUserIdentityErrorData?.ten_percent_shareholder?.ticker_symbol_list"
              path="ten_percent_shareholder.ticker_symbol_list"
              label="Ticker symbol list"
            >
              <BaseFormInput
                :model-value="model.ten_percent_shareholder?.ticker_symbol_list"
                :is-error="baseFormGroupProps.isFieldError"
                placeholder="Ticker symbol list"
                name="ticker-symbol"
                size="large"
                @update:model-value="model.ten_percent_shareholder.ticker_symbol_list = $event"
              />
            </BaseFormGroup>
          </FormCol>
        </FormRow>
      </template>
      <FormRow>
        <FormCol>
          <BaseFormGroup
            v-slot="baseFormGroupProps"
            :model="model"
            :validation="validation"
            :schema-back="setUserIdentityOptionsData"
            :schema-front="schemaBackgroundInformation"
            :error-text="setUserIdentityErrorData?.irs_backup_withholdingn"
            path="irs_backup_withholding"
            label="IRS Backup Withholding"
          >
            <BaseFormCheckbox
              v-model="model.irs_backup_withholding"
              :is-error="baseFormGroupProps.isFieldError"
            >
              IRS Backup Withholding
            </BaseFormCheckbox>
          </BaseFormGroup>
        </FormCol>
      </FormRow>
    </div>
    <div class="form-background-information__footer">
      <BaseButton
        size="large"
        variant="outlined"
        @click="cancelHandler"
      >
        Cancel
      </BaseButton>
      <BaseButton
        size="large"
        :disabled="isDisabledButton"
        :loading="isLoading"
        data-testid="button"
        @click="saveHandler"
      >
        Save
      </BaseButton>
    </div>
  </div>
</template>

<style lang="scss" scoped>
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
