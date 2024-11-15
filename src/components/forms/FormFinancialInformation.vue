<!-- eslint-disable @typescript-eslint/no-unsafe-assignment -->
<script setup lang="ts">
import {
  ref, computed, watch, reactive, nextTick,
} from 'vue';
import { useUserIdentitysStore, useUsersStore } from 'InvestCommon/store';
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
  FormModelInvestmentsLimits, isAccreditedRadioOptions,
} from './utils';
import {
  accessTypes, durationTypes, objectivesTypes, riskComfortTypes,
} from 'InvestCommon/helpers/enums/general';
import {
  SELECT_DURATION, SELECT_IMPORTANCE,
  SELECT_OBJECTIVES, SELECT_RISK_COMFORT,
} from 'InvestCommon/utils';
import { filterSchema, scrollToError } from 'UiKit/helpers/validation/general';
import VFormCheckbox from 'UiKit/components/VFormCheckbox/VFormCheckbox.vue';
import VFormRadio from 'UiKit/components/VFormRadio/VFormRadio.vue';
import { numberFormatter } from 'InvestCommon/helpers/numberFormatter';
import { errorMessageRule } from 'UiKit/helpers/validation/rules';
import { JSONSchemaType } from 'ajv';
import { useRouter } from 'vue-router';
import { ROUTE_DASHBOARD_ACCOUNT } from 'InvestCommon/helpers/enums/routes';

const props = defineProps({
  hubsportFormId: String,
});

const router = useRouter();
const userIdentityStore = useUserIdentitysStore();
const {
  isSetUserIdentityLoading, setUserIdentityErrorData, setUserIdentityOptionsData,
} = storeToRefs(userIdentityStore);
const usersStore = useUsersStore();
const {
  selectedUserProfileData, selectedUserProfileRiskAcknowledged, selectedUserProfileId,
  userAccountData,
} = storeToRefs(usersStore);

const { submitFormToHubspot } = useHubspotForm('2b8bb044-fc29-4d23-9f51-7abb6d590e2f');

const isLoading = ref(false);
const accreditedInvestor = computed(() => selectedUserProfileData.value?.data?.accredited_investor);
const investmentObjectives = computed(() => selectedUserProfileData.value?.data?.investment_objectives);

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
  consent_plaid: selectedUserProfileRiskAcknowledged.value,
} as FormModelInvestmentsLimits);

const schemaInvestmentsLimits = computed(() => ({
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
    },
  },
  $ref: '#/definitions/PatchIndividualProfile',
} as unknown as JSONSchemaType<FormModelInvestmentsLimits>
));

let validator = new PrecompiledValidator<FormModelInvestmentsLimits>(
  // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
  filterSchema(setUserIdentityOptionsData.value, formModel),
  schemaInvestmentsLimits.value,
);
const validation = ref<unknown>();
const isValid = computed(() => isEmpty(validation.value || {}));
const isDisabledButton = computed(() => (!isValid.value || isSetUserIdentityLoading.value));

const objectivesData = () => ({
  objectives: typeToText<objectivesTypes>(SELECT_OBJECTIVES, model.investment_objectives.objectives) as string,
  years_experience: +model.investment_objectives.years_experience,
  duration: typeToText<durationTypes>(SELECT_DURATION, model.investment_objectives.duration) as string,
  risk_comfort:
    typeToText<riskComfortTypes>(SELECT_RISK_COMFORT, model.investment_objectives.risk_comfort) as string,
  importance_of_access:
    typeToText<accessTypes>(SELECT_IMPORTANCE, model.investment_objectives.importance_of_access) as string,
});

const onValidate = () => {
  validation.value = validator.getFormValidationErrors(model);
};

const saveHandler = async () => {
  onValidate();
  if (!isValid.value) {
    void nextTick(() => scrollToError('FormFinancialInformation'));
    return;
  }

  isLoading.value = true;
  await userIdentityStore.setUserIdentity({
    accredited_investor: model.accredited_investor,
    educational_materials: model.educational_materials,
    cancelation_restrictions: model.cancelation_restrictions,
    resell_difficulties: model.resell_difficulties,
    risk_involved: model.risk_involved,
    no_legal_advices_from_company: model.no_legal_advices_from_company,
    investment_objectives: {
      ...objectivesData(),
    },
  });
  isLoading.value = false;
  void submitFormToHubspot({
    email: userAccountData.value?.email,
    educational_materials: model.educational_materials,
    cancelation_restrictions: model.cancelation_restrictions,
    resell_difficulties: model.resell_difficulties,
    risk_involved: model.risk_involved,
    no_legal_advices_from_company: model.no_legal_advices_from_company,
    is_accredited: model.accredited_investor.is_accredited,
  });
  void useHubspotForm(props.hubsportFormId).submitFormToHubspot({
    email: userAccountData.value?.email,
    ...objectivesData(),
  });
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
}, { deep: true });

watch(() => model, () => {
  if (!isValid.value) onValidate();
}, { deep: true });

// eslint-disable-next-line
watch(() => [setUserIdentityOptionsData.value, schemaInvestmentsLimits.value], () => {
  validator = new PrecompiledValidator<FormModelInvestmentsLimits>(
    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    filterSchema(setUserIdentityOptionsData.value, formModel),
    schemaInvestmentsLimits.value,
  );
});
</script>

<template>
  <div class="FormFinancialInformation form-financial-information">
    <div class="form-financial-information__header is--h1__title">
      Financial and Investment Information
    </div>
    <div class="form-financial-information__content">
      <div class="form-financial-information__subtitle is--h3__title">
        Financial Situation
      </div>
      <FormRow class="form-financial-information__row">
        <FormCol>
          <VFormGroup
            v-slot="VFormGroupProps"
            :model="model"
            :validation="validation"
            :schema-back="setUserIdentityOptionsData"
            :schema-front="schemaInvestmentsLimits"
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

      <div class="form-financial-information__subtitle is--h3__title is--margin-top">
        Investment Objectives
      </div>
      <FormRow>
        <FormCol>
          <VFormGroup
            v-slot="VFormGroupProps"
            :model="model"
            :validation="validation"
            :schema-back="setUserIdentityOptionsData"
            :schema-front="schemaInvestmentsLimits"
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
              data-testid="investment-objectives"
              size="large"
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
            :schema-front="schemaInvestmentsLimits"
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
            :schema-front="schemaInvestmentsLimits"
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
              size="large"
              data-testid="duration"
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
            :schema-front="schemaInvestmentsLimits"
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
            :schema-front="schemaInvestmentsLimits"
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
      <div class="form-financial-information__subtitle is--h3__title is--margin-top">
        Understanding of Risks
      </div>
      <FormRow>
        <FormCol>
          <VFormGroup
            v-slot="VFormGroupProps"
            :model="model"
            :validation="validation"
            :schema-back="setUserIdentityOptionsData"
            :schema-front="schemaInvestmentsLimits"
            :error-text="setUserIdentityErrorData?.educational_materials"
            path="educational_materials"
            data-testid="educational-materials-group"
          >
            <VFormCheckbox
              v-model="model.educational_materials"
              :disabled="selectedUserProfileRiskAcknowledged"
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
            :schema-front="schemaInvestmentsLimits"
            :error-text="setUserIdentityErrorData?.cancelation_restrictions"
            path="cancelation_restrictions"
            data-testid="cancelation-restrictions-group"
          >
            <VFormCheckbox
              v-model="model.cancelation_restrictions"
              :disabled="selectedUserProfileRiskAcknowledged"
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
            :schema-front="schemaInvestmentsLimits"
            :error-text="setUserIdentityErrorData?.resell_difficulties"
            path="resell_difficulties"
            data-testid="resell-difficulties-group"
          >
            <VFormCheckbox
              v-model="model.resell_difficulties"
              :disabled="selectedUserProfileRiskAcknowledged"
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
            :schema-front="schemaInvestmentsLimits"
            :error-text="setUserIdentityErrorData?.risk_involved"
            path="risk_involved"
            data-testid="risk-involved-group"
          >
            <VFormCheckbox
              v-model="model.risk_involved"
              :disabled="selectedUserProfileRiskAcknowledged"
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
            :schema-front="schemaInvestmentsLimits"
            :error-text="setUserIdentityErrorData?.no_legal_advices_from_company"
            path="no_legal_advices_from_company"
            data-testid="no_legal_advices_from_company-group"
          >
            <VFormCheckbox
              v-model="model.no_legal_advices_from_company"
              :disabled="selectedUserProfileRiskAcknowledged"
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
            :schema-front="schemaInvestmentsLimits"
            :error-text="setUserIdentityErrorData?.consent_plaid"
            path="consent_plaid"
            data-testid="consent-plaid-group"
          >
            <VFormCheckbox
              v-model="model.consent_plaid"
              :disabled="selectedUserProfileRiskAcknowledged"
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
    <div class="form-financial-information__footer">
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
.form-financial-information {
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
    margin-top: 40px;
  }
}
</style>
