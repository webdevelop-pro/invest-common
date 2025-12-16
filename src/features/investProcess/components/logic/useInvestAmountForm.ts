import { computed, watch } from 'vue';
import { JSONSchemaType } from 'ajv/dist/types/json-schema';
import { useFormValidation } from 'UiKit/helpers/validation/useFormValidation';
import { numberFormatter } from 'InvestCommon/helpers/numberFormatter';
import { currency } from 'InvestCommon/helpers/currency';

export type FormModelInvestAmount = {
  number_of_shares: number;
}

export interface UseInvestAmountFormProps {
  modelValue?: any;
  errorData?: any;
  data: any;
  backendSchema: any;
  isLoading: boolean;
}

export interface UseInvestAmountFormEmits {
  (e: 'update:modelValue', value: any): void;
}

export function useInvestAmountForm(
  props: UseInvestAmountFormProps,
  emit: UseInvestAmountFormEmits
) {

  const price = computed(() => (props.data?.offer?.price_per_share || 0));
  const numberOfShares = computed(() => props.data?.number_of_shares);
  const totalShares = computed(() => props.data?.offer?.total_shares || 1000);
  const subscribedShares = computed(() => props.data?.offer?.subscribed_shares || 10);
  const maxInvestment = computed(() => (totalShares.value - subscribedShares.value));
  const minInvestment = computed(() => (props.data?.offer?.min_investment || 10));

  // Dynamic schema with computed validation rules
  const schemaFrontend = computed(() => ({
    $schema: 'http://json-schema.org/draft-07/schema#',
    definitions: {
      AmountStep: {
        properties: {
          number_of_shares: {
            type: 'number',
            minimum: minInvestment.value || 0,
            maximum: maxInvestment.value || 1000,
            errorMessage: {
              minimum: `${minInvestment.value || 0} share(s) is minimum`,
              maximum: `${maxInvestment.value || 1000} share(s) is maximum`,
            },
          },
        },
        required: ['number_of_shares'],
        type: 'object',
      },
    },
    $ref: '#/definitions/AmountStep',
  } as unknown as JSONSchemaType<FormModelInvestAmount>));

  const fieldsPaths = ['number_of_shares'];

  // Use form validation composable
  const {
    model,
    validation,
    isValid,
    onValidate,
    scrollToError,
    formErrors,
    isFieldRequired,
    getErrorText,
    getOptions,
    getReferenceType,
  } = useFormValidation<FormModelInvestAmount>(
    schemaFrontend,
    props.backendSchema,
    {} as FormModelInvestAmount,
    fieldsPaths
  );

  // Amount calculations
  const sharesAmount = computed(() => numberFormatter(model.number_of_shares || 0));
  const investmentAmount = computed(() => sharesAmount.value * (price.value || 0));
  const investmentAmountShow = computed(() => (
    investmentAmount.value > 0 ? currency(+investmentAmount.value.toFixed(2)) : undefined
  ));
  const isLeftLessThanMin = computed(() => {
    const min = minInvestment.value || 0;
    const max = maxInvestment.value || 1000;
    return (
      (max - sharesAmount.value) < min &&
      sharesAmount.value < max &&
      sharesAmount.value > min
    );
  });

  const isBtnDisabled = computed(() => !isValid.value || isLeftLessThanMin.value);

  // Emit form updates
  const emitFormUpdate = () => {
    emit('update:modelValue', {
      number_of_shares: model.number_of_shares,
    });
  };

  // Watch for validation and model changes
  watch(model, emitFormUpdate, { deep: true });

  // Watch for external model value changes
  watch(() => props.modelValue, (newValue) => {
    if (newValue?.number_of_shares !== undefined && newValue.number_of_shares !== model.number_of_shares) {
      model.number_of_shares = newValue.number_of_shares;
    }
  }, { immediate: true });

  // Watch for number of shares changes from offer data
  watch(() => numberOfShares.value, () => {
    if (numberOfShares.value) {
      model.number_of_shares = numberOfShares.value;
    }
  }, { immediate: true });

  return {
    model,
    validation,
    isValid,
    onValidate,
    schemaFrontend,
    sharesAmount,
    investmentAmount,
    investmentAmountShow,
    isLeftLessThanMin,
    isBtnDisabled,
    // computed
    maxInvestment,
    minInvestment,
    // Form validation helpers
    formErrors,
    isFieldRequired,
    getErrorText,
    getOptions,
    getReferenceType,
    scrollToError,
  };
}

