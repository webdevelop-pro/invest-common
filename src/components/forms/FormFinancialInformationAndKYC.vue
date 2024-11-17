<!-- eslint-disable @typescript-eslint/no-unsafe-assignment -->
<script setup lang="ts">
import {
  ref, computed, watch, reactive, nextTick,
} from 'vue';
import {
  usePlaidStore, useUserIdentitysStore, useUsersStore, useAccreditationStore,
} from 'InvestCommon/store';
import { useHubspotForm } from 'InvestCommon/composable';
import FormRow from 'InvestCommon/components/VForm/VFormRow.vue';
import FormCol from 'InvestCommon/components/VForm/VFormCol.vue';
import VFormInput from 'UiKit/components/VForm/VFormInput.vue';
import VButton from 'UiKit/components/VButton/VButton.vue';
import VFormSelect from 'UiKit/components/VForm/VFormSelect.vue';
import { storeToRefs } from 'pinia';
import { PrecompiledValidator } from 'UiKit/helpers/validation/PrecompiledValidator';
import { isEmpty } from 'InvestCommon/helpers/general';
import VFormGroup from 'UiKit/components/VForm/VFormGroup.vue';
import {
  FormModelFinancialInformationAndKYC, isAccreditedRadioOptions,
} from './utils';
import { filterSchema, scrollToError } from 'UiKit/helpers/validation/general';
import VFormCheckbox from 'UiKit/components/VForm/VFormCheckbox.vue';
import VFormRadio from 'UiKit/components/VForm/VFormRadio.vue';
import { numberFormatter } from 'InvestCommon/helpers/numberFormatter';
import {
  address1Rule, address2Rule, citizenshipRule, cityRule, countryRule, dobRule, errorMessageRule,
  phoneRule, stateRule, zipRule,
} from 'UiKit/helpers/validation/rules';
import { JSONSchemaType } from 'ajv';
import {
  accessTypes, durationTypes, objectivesTypes, riskComfortTypes,
} from 'InvestCommon/helpers/enums/general';
import {
  SELECT_DURATION, SELECT_IMPORTANCE,
  SELECT_OBJECTIVES, SELECT_RISK_COMFORT, SELECT_CITIZENSHIP_OPTIONS,
} from 'InvestCommon/utils';
import { useRouter } from 'vue-router';
import { ROUTE_DASHBOARD_ACCOUNT } from 'InvestCommon/helpers/enums/routes';
import { countries } from 'InvestCommon/global/countries.json';
import { USA_STATES_FULL } from 'InvestCommon/global/usaStates.json';


const props = defineProps({
  hubsportFormIdInvestment: String,
  hubsportFormIdPersonal: String,
});

const router = useRouter();
const userIdentityStore = useUserIdentitysStore();
const {
  isSetUserIdentityLoading, isSetUserIdentityError, setUserIdentityErrorData, setUserIdentityOptionsData,
} = storeToRefs(userIdentityStore);
const usersStore = useUsersStore();
const { selectedUserProfileData, userAccountData, selectedUserProfileId } = storeToRefs(usersStore);
const plaidStore = usePlaidStore();
const accreditationStore = useAccreditationStore();

const { submitFormToHubspot } = useHubspotForm('2b8bb044-fc29-4d23-9f51-7abb6d590e2f');

const isLoading = ref(false);
const accreditedInvestor = computed(() => selectedUserProfileData.value?.data?.accredited_investor);
const investmentObjectives = computed(() => selectedUserProfileData.value?.data?.investment_objectives);
const dataUserData = computed(() => selectedUserProfileData.value?.data);

function typeToText<T>(options: { value: T; text: string }[], type: string) {
  return options.find((item) => item.value === type)?.text;
}

function typeToValue<T>(options: { value: T; text: string }[], text: string | undefined) {
  return text ? options.find((item) => item.text === text)?.value : false;
}

const formModel = {
  accredited_investor: {},
  investment_objectives: {},
  educational_materials: {},
  cancelation_restrictions: {},
  resell_difficulties: {},
  risk_involved: {},
  no_legal_advices_from_company: {},
  citizenship: {},
  dob: {},
  address1: {},
  address2: {},
  city: {},
  state: {},
  zip_code: {},
  country: {},
  phone: {},
};

const model = reactive({
  accredited_investor: {
    is_accredited: accreditedInvestor.value?.is_accredited || false,
  },
  investment_objectives: {
    objectives:
      typeToValue<objectivesTypes>(SELECT_OBJECTIVES, investmentObjectives.value?.objectives)
      || objectivesTypes.growth,
    years_experience: investmentObjectives.value?.years_experience || 0,
    duration:
      typeToValue<durationTypes>(SELECT_DURATION, investmentObjectives.value?.duration)
      || durationTypes.one,
    importance_of_access:
      typeToValue<accessTypes>(SELECT_IMPORTANCE, investmentObjectives.value?.importance_of_access)
      || accessTypes.somewhat,
    risk_comfort:
      typeToValue<riskComfortTypes>(SELECT_RISK_COMFORT, investmentObjectives.value?.risk_comfort)
      || riskComfortTypes.high,
  },
  risk_involved: selectedUserProfileData.value?.data?.risk_involved || false,
  no_legal_advices_from_company: selectedUserProfileData.value?.data?.no_legal_advices_from_company || false,
  educational_materials: selectedUserProfileData.value?.data?.educational_materials || false,
  cancelation_restrictions: selectedUserProfileData.value?.data?.cancelation_restrictions || false,
  resell_difficulties: selectedUserProfileData.value?.data?.resell_difficulties || false,
  consent_plaid: false,
} as FormModelFinancialInformationAndKYC);

const schemaFinancialInformationAndKYC = computed(() => ({
  $schema: 'http://json-schema.org/draft-07/schema#',
  definitions: {
    AccreditedInvestor: {
      properties: {
        is_accredited: {},
      },
      type: 'object',
    },
    InvestmentObjectives: {
      properties: {
        duration: {},
        importance_of_access: {},
        objectives: {},
        risk_comfort: {},
        years_experience: {},
      },
      type: 'object',
      additionalProperties: false,
    },
    PatchIndividualProfile: {
      properties: {
        accredited_investor: { type: 'object', $ref: '#/definitions/AccreditedInvestor' },
        investment_objectives: { type: 'object', $ref: '#/definitions/InvestmentObjectives' },
        citizenship: citizenshipRule,
        dob: dobRule,
        address1: address1Rule,
        address2: address2Rule,
        city: cityRule,
        state: stateRule,
        zip_code: zipRule,
        country: countryRule,
        phone: phoneRule,
        consent_plaid: {
          checkboxTrue: true,
        },
        educational_materials: {
          checkboxTrue: true,
        },
        cancelation_restrictions: {
          checkboxTrue: true,
        },
        resell_difficulties: {
          checkboxTrue: true,
        },
        risk_involved: {
          checkboxTrue: true,
        },
        no_legal_advices_from_company: {
          checkboxTrue: true,
        },
      },
      type: 'object',
      errorMessage: errorMessageRule,
      required: ['citizenship', 'address1', 'dob', 'phone', 'city', 'state', 'zip_code', 'country'],
    },
  },
  $ref: '#/definitions/PatchIndividualProfile',
} as unknown as JSONSchemaType<FormModelFinancialInformationAndKYC>
));

let validator = new PrecompiledValidator<FormModelFinancialInformationAndKYC>(
  // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
  filterSchema(setUserIdentityOptionsData.value, formModel),
  schemaFinancialInformationAndKYC.value,
);
const validation = ref<unknown>();
const isValid = computed(() => isEmpty(validation.value || {}));
const isDisabledButton = computed(() => (!isValid.value || isSetUserIdentityLoading.value));

const onValidate = () => {
  validation.value = validator.getFormValidationErrors(model);
};

const objectivesData = () => ({
  objectives: typeToText<objectivesTypes>(SELECT_OBJECTIVES, model.investment_objectives.objectives) as string,
  years_experience: +model.investment_objectives.years_experience,
  duration: typeToText<durationTypes>(SELECT_DURATION, model.investment_objectives.duration) as string,
  risk_comfort:
    typeToText<riskComfortTypes>(SELECT_RISK_COMFORT, model.investment_objectives.risk_comfort) as string,
  importance_of_access:
    typeToText<accessTypes>(SELECT_IMPORTANCE, model.investment_objectives.importance_of_access) as string,
});

const hubspotHandle = () => {
  void submitFormToHubspot({
    email: userAccountData.value?.email,
    educational_materials: model.educational_materials,
    cancelation_restrictions: model.cancelation_restrictions,
    resell_difficulties: model.resell_difficulties,
    risk_involved: model.risk_involved,
    no_legal_advices_from_company: model.no_legal_advices_from_company,
    is_accredited: model.accredited_investor.is_accredited,
  });
  void useHubspotForm(props.hubsportFormIdInvestment).submitFormToHubspot({
    email: userAccountData.value?.email,
    ...objectivesData(),
  });
  void useHubspotForm(props.hubsportFormIdPersonal).submitFormToHubspot({
    email: userAccountData.value?.email,
    citizenship: model.citizenship,
    phone: model.phone,
    date_of_birth: model.dob,
    address1: model.address1,
    address2: model.address2,
    city: model.city,
    country: model.country,
    state: model.state,
    zip_code: model.zip_code,
  });
};

const saveHandler = async () => {
  onValidate();
  if (!isValid.value) {
    void nextTick(() => scrollToError('FormFinancialInformationAndKYC'));
    return;
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { consent_plaid, ...fields } = model;

  isLoading.value = true;
  await userIdentityStore.setUserIdentity({
    ...fields,
    investment_objectives: {
      ...objectivesData(),
    },
  });
  await plaidStore.handlePlaidKyc();
  if (!isSetUserIdentityError.value && selectedUserProfileData.value?.user_id && selectedUserProfileData.value?.id
    && !selectedUserProfileData.value?.escrow_id) {
    await accreditationStore.createEscrow(selectedUserProfileData.value?.user_id, selectedUserProfileData.value?.id);
  }
  isLoading.value = false;
  hubspotHandle();
  void userIdentityStore.getUserIndividualProfile();
  void router.push({ name: ROUTE_DASHBOARD_ACCOUNT, params: { profileId: selectedUserProfileId.value } });
};

const cancelHandler = () => {
  void router.push({ name: ROUTE_DASHBOARD_ACCOUNT, params: { profileId: selectedUserProfileId.value } });
};

watch(() => selectedUserProfileData.value?.data?.accredited_investor, () => {
  if (accreditedInvestor.value?.is_accredited) {
    model.accredited_investor.is_accredited = accreditedInvestor.value?.is_accredited;
  }
}, { deep: true });


watch(() => investmentObjectives.value, () => {
  model.investment_objectives = {
    objectives:
      typeToValue<objectivesTypes>(SELECT_OBJECTIVES, investmentObjectives.value?.objectives)
      || objectivesTypes.growth,
    years_experience: investmentObjectives.value?.years_experience || 0,
    duration:
      typeToValue<durationTypes>(SELECT_DURATION, investmentObjectives.value?.duration)
      || durationTypes.one,
    importance_of_access:
      typeToValue<accessTypes>(SELECT_IMPORTANCE, investmentObjectives.value?.importance_of_access)
      || accessTypes.somewhat,
    risk_comfort:
      typeToValue<riskComfortTypes>(SELECT_RISK_COMFORT, investmentObjectives.value?.risk_comfort)
      || riskComfortTypes.high,
  };
}, { deep: true });

watch(() => selectedUserProfileData.value?.data, () => {
  // personal
  if (dataUserData.value?.dob) model.dob = dataUserData.value?.dob;
  if (dataUserData.value?.address1) model.address1 = dataUserData.value?.address1;
  if (dataUserData.value?.address2) model.address2 = dataUserData.value?.address2;
  if (dataUserData.value?.city) model.city = dataUserData.value?.city;
  if (dataUserData.value?.state) model.state = dataUserData.value?.state;
  if (dataUserData.value?.zip_code) model.zip_code = dataUserData.value?.zip_code;
  if (dataUserData.value?.country) model.country = dataUserData.value?.country;
  if (dataUserData.value?.phone) model.phone = dataUserData.value?.phone;
  if (dataUserData.value?.citizenship) model.citizenship = dataUserData.value?.citizenship;
  // risks
  if (selectedUserProfileData.value?.data?.risk_involved) {
    model.risk_involved = selectedUserProfileData.value?.data?.risk_involved;
  }
  if (selectedUserProfileData.value?.data?.no_legal_advices_from_company) {
    model.no_legal_advices_from_company = selectedUserProfileData.value?.data?.no_legal_advices_from_company;
  }
  if (selectedUserProfileData.value?.data?.educational_materials) {
    model.educational_materials = selectedUserProfileData.value?.data?.educational_materials;
  }
  if (selectedUserProfileData.value?.data?.cancelation_restrictions) {
    model.cancelation_restrictions = selectedUserProfileData.value?.data?.cancelation_restrictions;
  }
  if (selectedUserProfileData.value?.data?.resell_difficulties) {
    model.resell_difficulties = selectedUserProfileData.value?.data?.resell_difficulties;
  }
}, { deep: true, immediate: true });

watch(() => model, () => {
  if (!isValid.value) onValidate();
}, { deep: true });

// eslint-disable-next-line
watch(() => [setUserIdentityOptionsData.value, schemaFinancialInformationAndKYC.value], () => {
  validator = new PrecompiledValidator<FormModelFinancialInformationAndKYC>(
    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    filterSchema(setUserIdentityOptionsData.value, formModel),
    schemaFinancialInformationAndKYC.value,
  );
});
</script>

<template>
  <div class="FormFinancialInformationAndKYC form-reg-cf-information">
    <div class="form-reg-cf-information__header is--h1__title">
      Your Financial Information and KYC
    </div>
    <p class="form-reg-cf-information__subheader is--subheading-2">
      Automated KYC process for investor onboarding. This is a one-time step.
    </p>
    <div class="form-reg-cf-information__content">
      <FormRow>
        <FormCol>
          <VFormGroup
            v-slot="VFormGroupProps"
            :model="model"
            :validation="validation"
            :schema-back="setUserIdentityOptionsData"
            :schema-front="schemaFinancialInformationAndKYC"
            :error-text="setUserIdentityErrorData?.citizenship"
            path="citizenship"
            label="Citizenship"
          >
            <VFormSelect
              :model-value="model.citizenship"
              :is-error="VFormGroupProps.isFieldError"
              name="citizenship"
              data-testid="citizenship"
              placeholder="Please choose an option"
              item-label="text"
              item-value="value"
              :options="SELECT_CITIZENSHIP_OPTIONS"
              dropdown-absolute
              @update:model-value="model.citizenship = $event"
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
            :schema-back="setUserIdentityOptionsData"
            :schema-front="schemaFinancialInformationAndKYC"
            :error-text="setUserIdentityErrorData?.dob"
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
            :schema-back="setUserIdentityOptionsData"
            :schema-front="schemaFinancialInformationAndKYC"
            :error-text="setUserIdentityErrorData?.phone"
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
      <div class="form-reg-cf-information__subtitle is--h3__title is--margin-top">
        Residence Address
      </div>
      <FormRow>
        <FormCol col2>
          <VFormGroup
            v-slot="VFormGroupProps"
            :model="model"
            :validation="validation"
            :schema-back="setUserIdentityOptionsData"
            :schema-front="schemaFinancialInformationAndKYC"
            :error-text="setUserIdentityErrorData?.address1"
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
            :schema-back="setUserIdentityOptionsData"
            :schema-front="schemaFinancialInformationAndKYC"
            :error-text="setUserIdentityErrorData?.address2"
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
            :schema-back="setUserIdentityOptionsData"
            :schema-front="schemaFinancialInformationAndKYC"
            :error-text="setUserIdentityErrorData?.city"
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
            :schema-back="setUserIdentityOptionsData"
            :schema-front="schemaFinancialInformationAndKYC"
            :error-text="setUserIdentityErrorData?.state"
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
              item-label="text"
              item-value="value"
              searchable
              :options="USA_STATES_FULL"
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
            :schema-back="setUserIdentityOptionsData"
            :schema-front="schemaFinancialInformationAndKYC"
            :error-text="setUserIdentityErrorData?.zip_code"
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
            :schema-back="setUserIdentityOptionsData"
            :schema-front="schemaFinancialInformationAndKYC"
            :error-text="setUserIdentityErrorData?.country"
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
              item-value="code"
              searchable
              :options="countries"
              dropdown-absolute
              data-testid="country"
              @update:model-value="model.country = $event"
            />
          </VFormGroup>
        </FormCol>
      </FormRow>
      <div class="form-reg-cf-information__subtitle is--h3__title is--margin-top">
        Financial Situation
      </div>
      <FormRow>
        <FormCol>
          <VFormGroup
            v-slot="VFormGroupProps"
            :model="model"
            :validation="validation"
            :schema-back="setUserIdentityOptionsData"
            :schema-front="schemaFinancialInformationAndKYC"
            :error-text="setUserIdentityErrorData?.accredited_investor?.is_accredited"
            path="accredited_investor.is_accredited"
            data-testid="is-accredited"
          >
            <div>
              Are you an
              <router-link
                to="/resource-center/accredited-investor"
                target="_blank"
                class="is--link-regular"
              >
                Accredited Investor?
              </router-link>
            </div>
            <VFormRadio
              v-model="model.accredited_investor.is_accredited"
              :is-error="VFormGroupProps.isFieldError"
              :options="isAccreditedRadioOptions"
            />
          </VFormGroup>
        </FormCol>
      </FormRow>
      <div class="form-reg-cf-information__subtitle is--h3__title is--margin-top">
        Investment Objectives
      </div>
      <FormRow>
        <FormCol>
          <VFormGroup
            v-slot="VFormGroupProps"
            :model="model"
            :validation="validation"
            :schema-back="setUserIdentityOptionsData"
            :schema-front="schemaFinancialInformationAndKYC"
            :error-text="setUserIdentityErrorData?.investment_objectives.objectives"
            path="investment_objectives.objectives"
            label="Investment objectives"
          >
            <VFormSelect
              v-model="model.investment_objectives.objectives"
              :is-error="VFormGroupProps.isFieldError"
              item-label="text"
              item-value="value"
              name="investment-objectives"
              size="large"
              data-testid="investment-objectives"
              :options="SELECT_OBJECTIVES"
              dropdown-absolute
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
            :schema-back="setUserIdentityOptionsData"
            :schema-front="schemaFinancialInformationAndKYC"
            :error-text="setUserIdentityErrorData?.investment_objectives.years_experience"
            path="investment_objectives.years_experience"
            label="Investment Years Experience"
          >
            <VFormInput
              :model-value="String(model.investment_objectives.years_experience)"
              :is-error="VFormGroupProps.isFieldError"
              size="large"
              placeholder="10 years"
              name="years-experience"
              data-testid="years-experience"
              @update:model-value="model.investment_objectives.years_experience = numberFormatter($event)"
            />
          </VFormGroup>
        </FormCol>

        <FormCol col2>
          <VFormGroup
            v-slot="VFormGroupProps"
            :model="model"
            :validation="validation"
            :schema-back="setUserIdentityOptionsData"
            :schema-front="schemaFinancialInformationAndKYC"
            :error-text="setUserIdentityErrorData?.investment_objectives.duration"
            path="investment_objectives.duration"
            label="How long do you plan to invest"
          >
            <VFormSelect
              v-model="model.investment_objectives.duration"
              :is-error="VFormGroupProps.isFieldError"
              item-label="text"
              item-value="value"
              name="duration"
              data-testid="duration"
              size="large"
              :options="SELECT_DURATION"
              dropdown-absolute
            />
          </VFormGroup>
        </FormCol>
      </FormRow>
      <FormRow>
        <FormCol>
          <VFormGroup
            v-slot="VFormGroupProps"
            :model="model"
            :validation="validation"
            :schema-back="setUserIdentityOptionsData"
            :schema-front="schemaFinancialInformationAndKYC"
            :error-text="setUserIdentityErrorData?.investment_objectives.importance_of_access"
            path="investment_objectives.importance_of_access"
            label="How important is it to have immediate access to your invested funds"
          >
            <VFormSelect
              v-model="model.investment_objectives.importance_of_access"
              :is-error="VFormGroupProps.isFieldError"
              item-label="text"
              item-value="value"
              name="importance-of-access"
              data-testid="importance-of-access"
              size="large"
              :options="SELECT_IMPORTANCE"
              dropdown-absolute
            />
          </VFormGroup>
        </FormCol>
      </FormRow>
      <FormRow>
        <FormCol>
          <VFormGroup
            v-slot="VFormGroupProps"
            :model="model"
            :validation="validation"
            :schema-back="setUserIdentityOptionsData"
            :schema-front="schemaFinancialInformationAndKYC"
            :error-text="setUserIdentityErrorData?.investment_objectives.risk_comfort"
            path="investment_objectives.risk_comfort"
            label="How much risk are you comfortable with"
          >
            <VFormSelect
              v-model="model.investment_objectives.risk_comfort"
              :is-error="VFormGroupProps.isFieldError"
              item-label="text"
              item-value="value"
              name="risk-comfort"
              data-testid="risk-comfort"
              size="large"
              :options="SELECT_RISK_COMFORT"
              dropdown-absolute
            />
          </VFormGroup>
        </FormCol>
      </FormRow>
      <div class="form-reg-cf-information__subtitle is--h3__title is--margin-top">
        Understanding of Risks
      </div>
      <FormRow>
        <FormCol>
          <VFormGroup
            v-slot="VFormGroupProps"
            :model="model"
            :validation="validation"
            :schema-back="setUserIdentityOptionsData"
            :schema-front="schemaFinancialInformationAndKYC"
            :error-text="setUserIdentityErrorData?.educational_materials"
            path="educational_materials"
            data-testid="educational-materials-group"
          >
            <VFormCheckbox
              v-model="model.educational_materials"
              :is-error="VFormGroupProps.isFieldError"
              data-testid="educational-materials"
            >
              <span class="is--body">
                Market and Liquidity Risk: I acknowledge the potential for market fluctuations and
                limited liquidity in Regulation A and Regulation D offerings.
              </span>
            </VFormCheckbox>
          </VFormGroup>
        </FormCol>
      </FormRow>
      <FormRow>
        <FormCol>
          <VFormGroup
            v-slot="VFormGroupProps"
            :model="model"
            :validation="validation"
            :schema-back="setUserIdentityOptionsData"
            :schema-front="schemaFinancialInformationAndKYC"
            :error-text="setUserIdentityErrorData?.cancelation_restrictions"
            path="cancelation_restrictions"
            data-testid="cancelation-restrictions-group"
          >
            <VFormCheckbox
              v-model="model.cancelation_restrictions"
              :is-error="VFormGroupProps.isFieldError"
              data-testid="cancelation-restrictions"
            >
              <span class="is--body">
                Business and Regulatory Risk: I understand the business challenges and regulatory uncertainties
                associated with investing in these offerings.
              </span>
            </VFormCheckbox>
          </VFormGroup>
        </FormCol>
      </FormRow>
      <FormRow>
        <FormCol>
          <VFormGroup
            v-slot="VFormGroupProps"
            :model="model"
            :validation="validation"
            :schema-back="setUserIdentityOptionsData"
            :schema-front="schemaFinancialInformationAndKYC"
            :error-text="setUserIdentityErrorData?.resell_difficulties"
            path="resell_difficulties"
            data-testid="resell-difficulties-group"
          >
            <VFormCheckbox
              v-model="model.resell_difficulties"
              :is-error="VFormGroupProps.isFieldError"
              data-testid="resell-difficulties"
            >
              <span class="is--body">
                Limited Information and Fraud Risk: I'm aware of the limited disclosure and potential for fraudulent
                schemes in Regulation A and Regulation D investments.
              </span>
            </VFormCheckbox>
          </VFormGroup>
        </FormCol>
      </FormRow>
      <FormRow>
        <FormCol>
          <VFormGroup
            v-slot="VFormGroupProps"
            :model="model"
            :validation="validation"
            :schema-back="setUserIdentityOptionsData"
            :schema-front="schemaFinancialInformationAndKYC"
            :error-text="setUserIdentityErrorData?.risk_involved"
            path="risk_involved"
            data-testid="risk-involved-group"
          >
            <VFormCheckbox
              v-model="model.risk_involved"
              :is-error="VFormGroupProps.isFieldError"
              data-testid="risk-involved"
            >
              <span class="is--body">
                Illiquidity and Capital Loss: I accept the illiquid nature and the risk of partial
                or total loss of capital in these investments.
              </span>
            </VFormCheckbox>
          </VFormGroup>
        </FormCol>
      </FormRow>
      <FormRow>
        <FormCol>
          <VFormGroup
            v-slot="VFormGroupProps"
            :model="model"
            :validation="validation"
            :schema-back="setUserIdentityOptionsData"
            :schema-front="schemaFinancialInformationAndKYC"
            :error-text="setUserIdentityErrorData?.no_legal_advices_from_company"
            path="no_legal_advices_from_company"
            data-testid="no_legal_advices_from_company-group"
          >
            <VFormCheckbox
              v-model="model.no_legal_advices_from_company"
              :is-error="VFormGroupProps.isFieldError"
              data-testid="no_legal_advices_from_company"
            >
              <span class="is--body">
                Overall Investment Risk: In summary, I recognize and accept the inherent risks, including
                market volatility, limited liquidity, regulatory uncertainties, and the possibility of
                financial loss, in investing in Regulation A and Regulation D offerings.
              </span>
            </VFormCheckbox>
          </VFormGroup>
        </FormCol>
      </FormRow>
      <FormRow>
        <FormCol>
          <VFormGroup
            v-slot="VFormGroupProps"
            :model="model"
            :validation="validation"
            :schema-back="setUserIdentityOptionsData"
            :schema-front="schemaFinancialInformationAndKYC"
            :error-text="setUserIdentityErrorData?.consent_plaid"
            path="consent_plaid"
            data-testid="consent-plaid-group"
          >
            <VFormCheckbox
              v-model="model.consent_plaid"
              :is-error="VFormGroupProps.isFieldError"
              data-testid="consent-plaid"
            >
              <span class="is--body">
                I consent to share personal information with
                <a
                  href="https://plaid.com/legal/terms-of-use/"
                  target="_blank"
                  rel="noopener noreferrer"
                  class="is--link-regular"
                >
                  Plaid
                </a>
              </span>
            </VFormCheckbox>
          </VFormGroup>
        </FormCol>
      </FormRow>
    </div>
    <div class="form-reg-cf-information__footer">
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
.form-reg-cf-information {
  display: flex;
  flex-direction: column;
  margin: 0 auto;
  width: 100%;

  &__header {
    margin-bottom: 20px;
  }

  &__subheader {
    color: $gray-80;
    margin-bottom: 40px;
  }

  &__subtitle {
    margin-top: 12px;
    margin-bottom: 20px;
  }

  &__text {
    margin-bottom: 20px;
  }

  &__footer {
    display: flex;
    justify-content: flex-end;
    align-items: flex-start;
    gap: 12px;
    margin-top: 20px;
  }

  &__row {
    align-items: center;
  }

  &__accreditation-number {
    margin-left: 20px;
  }

  .is--margin-top {
    margin-top: 22px;
  }
}
</style>
