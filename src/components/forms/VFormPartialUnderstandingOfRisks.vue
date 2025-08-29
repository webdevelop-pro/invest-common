<script setup lang="ts">
import {
  watch, PropType, computed, toRaw,
} from 'vue';
import FormRow from 'UiKit/components/Base/VForm/VFormRow.vue';
import FormCol from 'UiKit/components/Base/VForm/VFormCol.vue';
import VFormCheckbox from 'UiKit/components/Base/VForm/VFormCheckbox.vue';
import VFormGroup from 'UiKit/components/Base/VForm/VFormGroup.vue';
import { JSONSchemaType } from 'ajv/dist/types/json-schema';
import { errorMessageRule } from 'UiKit/helpers/validation/rules';
import { FormModelUnderstandRisks } from 'InvestCommon/types/form';
import { useFormValidation } from 'UiKit/helpers/validation/useFormValidation';

const props = defineProps({
  modelData: Object as PropType<FormModelUnderstandRisks>,
  consentPlaid: Boolean,
  errorData: Object,
  schemaBackend: Object,
  loading: Boolean,
});

const schemaFrontend = {
  $schema: 'http://json-schema.org/draft-07/schema#',
  definitions: {
    Individual: {
      properties: {
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
  $ref: '#/definitions/Individual',
} as unknown as JSONSchemaType<FormModelUnderstandRisks>;

const schemaBackendLocal = computed(() => (props.schemaBackend ? structuredClone(toRaw(props.schemaBackend)) : null));
const fieldsPaths = [
  'educational_materials',
  'cancelation_restrictions',
  'resell_difficulties',
  'risk_involved',
  'no_legal_advices_from_company',
  'consent_plaid',
];

const {
  model,
  validation,
  isValid,
  onValidate,
  isFieldRequired,
  getErrorText,
} = useFormValidation<FormModelUnderstandRisks>(
  schemaFrontend,
  schemaBackendLocal,
  {
    risk_involved: props.modelData?.risk_involved || false,
    no_legal_advices_from_company: props.modelData?.no_legal_advices_from_company || false,
    educational_materials: props.modelData?.educational_materials || false,
    cancelation_restrictions: props.modelData?.cancelation_restrictions || false,
    resell_difficulties: props.modelData?.resell_difficulties || false,
    consent_plaid: props.consentPlaid,
  } as FormModelUnderstandRisks,
  fieldsPaths,
);

defineExpose({
  model, validation, isValid, onValidate,
});

watch(() => props.modelData, (newModelData) => {
  if (!newModelData) return;
  fieldsPaths.forEach((field) => {
    if (newModelData[field] !== undefined && newModelData[field] !== null) {
      model[field] = newModelData[field];
    }
  });
}, { deep: true, immediate: true });
</script>

<template>
  <div class="VFormPartialUnderstandingOfRisks v-form-partial-understanding-of-risks">
    <div class="v-form-partial-understanding-of-risks__subtitle is--h3__title ">
      Understanding of Risks
    </div>
    <FormRow>
      <FormCol>
        <VFormGroup
          v-slot="VFormGroupProps"
          :required="isFieldRequired('educational_materials')"
          :error-text="getErrorText('educational_materials', errorData as any)"
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
          :required="isFieldRequired('cancelation_restrictions')"
          :error-text="getErrorText('cancelation_restrictions', errorData as any)"
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
          :required="isFieldRequired('resell_difficulties')"
          :error-text="getErrorText('resell_difficulties', errorData as any)"
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
          :required="isFieldRequired('risk_involved')"
          :error-text="getErrorText('risk_involved', errorData as any)"
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
          :required="isFieldRequired('no_legal_advices_from_company')"
          :error-text="getErrorText('no_legal_advices_from_company', errorData as any)"
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
          :required="isFieldRequired('consent_plaid')"
          :error-text="getErrorText('consent_plaid', errorData as any)"
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
</template>

<style lang="scss">
.v-form-partial-understanding-of-risks {
  display: flex;
  flex-direction: column;
  width: 100%;

  &__subtitle {
    margin-bottom: 20px;
    margin-top: 12px;
  }
}
</style>
