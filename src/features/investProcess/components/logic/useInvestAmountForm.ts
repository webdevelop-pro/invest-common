import { computed, watch } from 'vue';
import { JSONSchemaType } from 'ajv/dist/types/json-schema';
import { useFormValidation } from 'UiKit/helpers/validation/useFormValidation';
import { useForm } from 'UiKit/composables/useForm';
import { numberFormatter } from 'InvestCommon/helpers/numberFormatter';
import { currency } from 'InvestCommon/helpers/currency';

export type FormModelInvestAmount = {
  number_of_shares: number;
}

export interface UseInvestAmountFormProps {
  modelValue?: any;
  errorData?: any;
  data?: any;
  backendSchema?: any;
  isLoading: boolean;
}

export interface UseInvestAmountFormEmits {
  (e: 'update:modelValue', value: any): void;
}

export function useInvestAmountForm(
  props: UseInvestAmountFormProps,
  emit: UseInvestAmountFormEmits
) {
  // Extract offer data once
  const offer = computed(() => props.data?.offer || {});
  const price = computed(() => offer.value.price_per_share || 0);
  const numberOfShares = computed(() => props.data?.number_of_shares);
  const totalShares = computed(() => offer.value.total_shares || 1000);
  const subscribedShares = computed(() => offer.value.subscribed_shares || 10);
  const maxInvestment = computed(() => totalShares.value - subscribedShares.value);
  const minInvestment = computed(() => offer.value.min_investment || 10);

  // Dynamic schema with computed validation rules
  const schemaFrontend = computed(() => ({
    $schema: 'http://json-schema.org/draft-07/schema#',
    definitions: {
      AmountStep: {
        properties: {
          number_of_shares: {
            type: 'number',
            minimum: minInvestment.value,
            maximum: maxInvestment.value,
            errorMessage: {
              minimum: `${minInvestment.value} share(s) is minimum`,
              maximum: `${maxInvestment.value} share(s) is maximum`,
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
  const investmentAmount = computed(() => sharesAmount.value * price.value);
  const investmentAmountShow = computed(() => 
    investmentAmount.value > 0 ? currency(+investmentAmount.value.toFixed(2)) : undefined
  );
  const isLeftLessThanMin = computed(() => {
    const remaining = maxInvestment.value - sharesAmount.value;
    return remaining < minInvestment.value && 
           sharesAmount.value < maxInvestment.value && 
           sharesAmount.value > minInvestment.value;
  });

  const isBtnDisabled = computed(() => !isValid.value || isLeftLessThanMin.value);

  // Track form dirty state
  const { isDirty } = useForm<FormModelInvestAmount>({
    initialValues: computed(() => ({ number_of_shares: numberOfShares.value || 0 })),
    currentValues: model,
  });

  // Emit form updates
  watch(model, () => {
    emit('update:modelValue', { number_of_shares: model.number_of_shares });
  }, { deep: true });

  // Sync model with external changes (modelValue prop or backend data)
  watch([() => props.modelValue?.number_of_shares, numberOfShares], ([modelValue, backendValue]) => {
    const newValue = modelValue ?? backendValue;
    if (newValue !== undefined && newValue !== model.number_of_shares) {
      model.number_of_shares = newValue;
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
    maxInvestment,
    minInvestment,
    formErrors,
    isFieldRequired,
    getErrorText,
    getOptions,
    getReferenceType,
    scrollToError,
    isDirty,
  };
}

