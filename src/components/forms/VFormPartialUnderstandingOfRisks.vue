<script setup lang="ts">
import {
  watch, PropType, reactive, ref, computed,
} from 'vue';
import { useUserProfilesStore } from 'InvestCommon/store/useUserProfiles';
import FormRow from 'InvestCommon/components/VForm/VFormRow.vue';
import FormCol from 'InvestCommon/components/VForm/VFormCol.vue';
import VFormCheckbox from 'UiKit/components/Base/VForm/VFormCheckbox.vue';
import VFormGroup from 'UiKit/components/Base/VForm/VFormGroup.vue';
import { storeToRefs } from 'pinia';
import { JSONSchemaType } from 'ajv';
import { errorMessageRule } from 'UiKit/helpers/validation/rules';
import { FormModelUnderstandRisks } from 'InvestCommon/types/form';
import { createFormModel } from 'UiKit/helpers/model';
import { PrecompiledValidator } from 'UiKit/helpers/validation/PrecompiledValidator';
import { filterSchema } from 'UiKit/helpers/validation/general';
import { isEmpty } from 'UiKit/helpers/general';

const props = defineProps({
  modelData: Object as PropType<FormModelUnderstandRisks>,
  consentPlaid: Boolean,
});

const userIdentityStore = useUserProfilesStore();
const {
  setProfileByIdErrorData, getProfileByIdOptionsData,
} = storeToRefs(userIdentityStore);

const schema = {
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

const model = reactive<FormModelUnderstandRisks>({
  risk_involved: props.modelData?.risk_involved || false,
  no_legal_advices_from_company: props.modelData?.no_legal_advices_from_company || false,
  educational_materials: props.modelData?.educational_materials || false,
  cancelation_restrictions: props.modelData?.cancelation_restrictions || false,
  resell_difficulties: props.modelData?.resell_difficulties || false,
  consent_plaid: props.consentPlaid,
});
const formModel = createFormModel(schema);
let validator = new PrecompiledValidator<FormModelUnderstandRisks>(
  filterSchema(getProfileByIdOptionsData.value, formModel),
  schema,
);
const validation = ref<unknown>();
const isValid = computed(() => isEmpty(validation.value || {}));

const onValidate = () => {
  validation.value = validator.getFormValidationErrors(model);
};


defineExpose({
  model, validation, validator, isValid, onValidate,
});

watch(() => props.modelData, () => {
  // risks
  if (props.modelData?.risk_involved) {
    model.risk_involved = props.modelData?.risk_involved;
  }
  if (props.modelData?.no_legal_advices_from_company) {
    model.no_legal_advices_from_company = props.modelData?.no_legal_advices_from_company;
  }
  if (props.modelData?.educational_materials) {
    model.educational_materials = props.modelData?.educational_materials;
  }
  if (props.modelData?.cancelation_restrictions) {
    model.cancelation_restrictions = props.modelData?.cancelation_restrictions;
  }
  if (props.modelData?.resell_difficulties) {
    model.resell_difficulties = props.modelData?.resell_difficulties;
  }
}, { deep: true, immediate: true });


watch(() => model, () => {
  if (!isValid.value) onValidate();
}, { deep: true });

watch(() => [getProfileByIdOptionsData.value, schema], () => {
  validator = new PrecompiledValidator<FormModelUnderstandRisks>(
    filterSchema(getProfileByIdOptionsData.value, formModel),
    schema,
  );
});
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
          :model="model"
          :validation="validation"
          :schema-back="getProfileByIdOptionsData"
          :schema-front="schema"
          :error-text="setProfileByIdErrorData?.educational_materials"
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
          :schema-back="getProfileByIdOptionsData"
          :schema-front="schema"
          :error-text="setProfileByIdErrorData?.cancelation_restrictions"
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
          :schema-back="getProfileByIdOptionsData"
          :schema-front="schema"
          :error-text="setProfileByIdErrorData?.resell_difficulties"
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
          :schema-back="getProfileByIdOptionsData"
          :schema-front="schema"
          :error-text="setProfileByIdErrorData?.risk_involved"
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
          :schema-back="getProfileByIdOptionsData"
          :schema-front="schema"
          :error-text="setProfileByIdErrorData?.no_legal_advices_from_company"
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
          :schema-back="getProfileByIdOptionsData"
          :schema-front="schema"
          :error-text="setProfileByIdErrorData?.consent_plaid"
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
