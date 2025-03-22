<script setup lang="ts">
import {
  computed, nextTick, reactive, ref, watch,
} from 'vue';
import FormRow from 'UiKit/components/Base/VForm/VFormRow.vue';
import FormCol from 'UiKit/components/Base/VForm/VFormCol.vue';
import VFormInput from 'UiKit/components/Base/VForm/VFormInput.vue';
import VFormSelect from 'UiKit/components/Base/VForm/VFormSelect.vue';
import { PrecompiledValidator } from 'UiKit/helpers/validation/PrecompiledValidator';
import { isEmpty } from 'InvestCommon/helpers/general';
import VFormGroup from 'UiKit/components/Base/VForm/VFormGroup.vue';
import { storeToRefs } from 'pinia';
import { useInvestmentsStore } from 'InvestCommon/store/useInvestments';
import { useOfferStore } from 'InvestCommon/store/useOffer';
import { scrollToError } from 'UiKit/helpers/validation/general';
import {
  accountHolderNameRule, accountNumberRule, accountTypeRule, errorMessageRule, routingNumbeRuler,
} from 'UiKit/helpers/validation/rules';
import { JSONSchemaType } from 'ajv/dist/types/json-schema';

const SELECT_ACCOUNT_TYPE = [
  {
    value: 'checking',
    text: 'Checking',
  },
  {
    value: 'saving',
    text: 'Saving',
  },
];

type FormModelInvestmentFundingAch = {
  accountHolderName: string;
  accountType: string;
  accountNumber: string;
  routingNumber: string;
}

const schemaInvestmentFundingAch = {
  $schema: 'http://json-schema.org/draft-07/schema#',
  definitions: {
    FundingStep: {
      properties: {
        accountHolderName: accountHolderNameRule,
        accountType: accountTypeRule,
        accountNumber: accountNumberRule,
        routingNumber: routingNumbeRuler,
      },
      required: ['accountHolderName', 'accountType', 'accountNumber', 'routingNumber'],
      errorMessage: errorMessageRule,
    },
  },
  $ref: '#/definitions/FundingStep',
} as unknown as JSONSchemaType<FormModelInvestmentFundingAch>;

const props = defineProps({
  modelValue: Object,
  validate: Boolean,
});

const emit = defineEmits(['update:modelValue']);

const investmentsStore = useInvestmentsStore();
const { setFundingErrorData } = storeToRefs(investmentsStore);
const offerStore = useOfferStore();
const { getUnconfirmedOfferData } = storeToRefs(offerStore);

const model = reactive({
} as FormModelInvestmentFundingAch);

const validator = new PrecompiledValidator<FormModelInvestmentFundingAch>(
  schemaInvestmentFundingAch,
);
const validation = ref<unknown>();
const isValid = computed(() => isEmpty(validation.value || {}));

const onValidate = () => {
  validation.value = validator.getFormValidationErrors(model);
};

watch(() => [props.validate], () => {
  onValidate();
  if (!isValid.value) {
    nextTick(() => scrollToError('InvestFormFundingAch'));
    return;
  }
  emit('update:modelValue', {
    isInvalid: !isValid.value,
    ...model,
  });
}, { deep: true });

watch(() => isValid.value, () => {
  emit('update:modelValue', {
    isInvalid: !isValid.value,
    ...model,
  });
}, { deep: true });

watch(() => model, async () => {
  if (!isValid.value) onValidate();
  await nextTick();
  emit('update:modelValue', {
    isInvalid: !isValid.value,
    ...model,
  });
}, { deep: true });

watch(() => props.validate, () => {
  if (props.validate) {
    onValidate();
    if (!isValid.value) {
      nextTick(() => scrollToError('InvestFormFundingAch'));
    }
  }
});

watch(() => getUnconfirmedOfferData.value?.payment_data, () => {
  if (getUnconfirmedOfferData.value?.payment_data.account_holder_name) {
    model.accountHolderName = getUnconfirmedOfferData.value?.payment_data.account_holder_name;
  }
  if (getUnconfirmedOfferData.value?.payment_data.account_number) {
    model.accountNumber = getUnconfirmedOfferData.value?.payment_data.account_number;
  }
  if (getUnconfirmedOfferData.value?.payment_data.routing_number) {
    model.routingNumber = getUnconfirmedOfferData.value?.payment_data.routing_number;
  }
  if (getUnconfirmedOfferData.value?.payment_data.account_type) {
    model.accountType = getUnconfirmedOfferData.value?.payment_data.account_type;
  }
}, { immediate: true, deep: true });
</script>

<template>
  <div
    class="FormInvestFundingAch form-invest-funding-ach"
    data-testid="funding-ach"
  >
    <FormRow>
      <FormCol col2>
        <VFormGroup
          v-slot="VFormGroupProps"
          :model="model"
          :validation="validation"
          :schema-front="schemaInvestmentFundingAch"
          :error-text="setFundingErrorData?.accountHolderName"
          path="accountHolderName"
          label="Account Holder Name"
        >
          <VFormInput
            :model-value="model.accountHolderName"
            :is-error="VFormGroupProps.isFieldError"
            placeholder="Account Holder Name"
            name="holder-name"
            size="large"
            @update:model-value="model.accountHolderName = $event"
          />
        </VFormGroup>
      </FormCol>

      <FormCol col2>
        <VFormGroup
          v-slot="VFormGroupProps"
          :model="model"
          :validation="validation"
          :schema-front="schemaInvestmentFundingAch"
          :error-text="setFundingErrorData?.accountType"
          path="accountType"
          label="Account Type"
        >
          <VFormSelect
            v-model="model.accountType"
            :is-error="VFormGroupProps.isFieldError"
            item-label="text"
            item-value="value"
            name="account-type"
            placeholder="Account Type"
            size="large"
            :loading="(SELECT_ACCOUNT_TYPE?.length === 0)"
            :options="SELECT_ACCOUNT_TYPE"
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
          :schema-front="schemaInvestmentFundingAch"
          :error-text="setFundingErrorData?.accountNumber"
          path="accountNumber"
          label="Account Number"
        >
          <VFormInput
            :model-value="model.accountNumber"
            :is-error="VFormGroupProps.isFieldError"
            placeholder="Account Number"
            name="account-number"
            size="large"
            allow-integer-only
            @update:model-value="model.accountNumber = $event"
          />
        </VFormGroup>
      </FormCol>

      <FormCol col2>
        <VFormGroup
          v-slot="VFormGroupProps"
          :model="model"
          :validation="validation"
          :schema-front="schemaInvestmentFundingAch"
          :error-text="setFundingErrorData?.routingNumber"
          path="routingNumber"
          label="Routing Number"
        >
          <VFormInput
            :model-value="model.routingNumber"
            :is-error="VFormGroupProps.isFieldError"
            placeholder="Routing Number"
            name="routing-number"
            size="large"
            allow-integer-only
            @update:model-value="model.routingNumber = $event"
          />
        </VFormGroup>
      </FormCol>
    </FormRow>
  </div>
</template>
