import { nextTick, watch } from 'vue';
import {
  accountHolderNameRule, accountNumberRule, accountTypeRule, errorMessageRule, routingNumbeRuler,
} from 'UiKit/helpers/validation/rules';
import { JSONSchemaType } from 'ajv/dist/types/json-schema';
import { useFormValidation } from 'UiKit/helpers/validation/useFormValidation';

export const ACCOUNT_TYPES = [
  { value: 'checking', text: 'Checking' },
  { value: 'saving', text: 'Saving' },
];

export type FormModelInvestmentFundingAch = {
  accountHolderName: string;
  accountType: string;
  accountNumber: string;
  routingNumber: string;
  authorizeDebit: boolean;
}

const schema = {
  $schema: 'http://json-schema.org/draft-07/schema#',
  definitions: {
    FundingStep: {
      properties: {
        accountHolderName: accountHolderNameRule,
        accountType: accountTypeRule,
        accountNumber: accountNumberRule,
        routingNumber: routingNumbeRuler,
        authorizeDebit: {
          type: 'boolean',
          const: true,
          errorMessage: 'You must authorize the debit to continue',
        },
      },
      required: ['accountHolderName', 'accountType', 'accountNumber', 'routingNumber', 'authorizeDebit'],
      errorMessage: errorMessageRule,
    },
  },
  $ref: '#/definitions/FundingStep',
} as unknown as JSONSchemaType<FormModelInvestmentFundingAch>;

export interface UseInvestFundingAchProps {
  modelValue?: any;
  validate?: boolean;
  errorData?: any;
  paymentData?: any;
}

export interface UseInvestFundingAchEmits {
  (e: 'update:modelValue', value: any): void;
}

export function useInvestFundingAch(
  props: UseInvestFundingAchProps,
  emit: UseInvestFundingAchEmits
) {
  const fieldsPaths = ['accountHolderName', 'accountType', 'accountNumber', 'routingNumber', 'authorizeDebit'];

  const { 
    model, validation, isValid, onValidate,
    scrollToError, formErrors, isFieldRequired, getErrorText,
    getOptions, getReferenceType,
  } = useFormValidation<FormModelInvestmentFundingAch>(
    schema,
    undefined,
    {} as FormModelInvestmentFundingAch,
    fieldsPaths
  );

  // Emit form updates
  const emitFormUpdate = () => {
    // Create a copy of the model without authorizeDebit before sending
    const { authorizeDebit, ...modelToSend } = model;
    
    emit('update:modelValue', {
      isInvalid: !isValid.value,
      ...modelToSend,
    });
  };

  // Watch for validation and model changes
  watch([() => isValid.value, model], emitFormUpdate, { deep: true });

  // Watch for external validation trigger
  watch(() => props.validate, async () => {
    if (props.validate) {
      onValidate();
      if (!isValid.value) {
        await nextTick();
        scrollToError('InvestFormFundingAch');
      }
    }
  });

  // Watch for payment data changes to populate form
  watch(() => props.paymentData, (paymentData) => {
    if (paymentData) {
      const { account_holder_name, account_number, routing_number, account_type } = paymentData;
      if (account_holder_name) model.accountHolderName = account_holder_name;
      if (account_number) model.accountNumber = account_number;
      if (routing_number) model.routingNumber = routing_number;
      if (account_type) model.accountType = account_type;
    }
  }, { immediate: true, deep: true });

  return {
    model,
    validation,
    isValid,
    onValidate,
    schema,
    ACCOUNT_TYPES,
    // Form validation helpers
    formErrors,
    isFieldRequired,
    getErrorText,
    getOptions,
    getReferenceType,
    scrollToError,
  };
}
