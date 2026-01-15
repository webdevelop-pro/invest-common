import { computed, nextTick, ref, unref, type MaybeRef } from 'vue';
import type { JSONSchemaType } from 'ajv/dist/types/json-schema';
import { useFormValidation } from 'UiKit/helpers/validation/useFormValidation';
import { errorMessageRule } from 'UiKit/helpers/validation/rules';
import { useRepositoryEarn } from 'InvestCommon/data/earn/earn.repository';

export interface FormModelEarnDeposit {
  amount: number | null;
}

interface UseEarnDepositCardOptions {
  /**
   * Optional max amount that will be set when user clicks "Max"
   */
  maxAmount?: MaybeRef<number | undefined>;
  /**
   * Optional scroll id used by `scrollToError` helper
   */
  scrollId?: MaybeRef<string | undefined>;
  /**
   * Optional submit handler to perform real deposit logic
   */
  onSubmit?: MaybeRef<((amount: number) => Promise<void> | void) | undefined>;
  /**
   * Optional pool id used for repository calls
   */
  poolId?: MaybeRef<string | undefined>;
  /**
   * Optional profile id used for repository calls
   */
  profileId?: MaybeRef<string | number | undefined>;
  /**
   * Optional symbol used for repository calls
   */
  symbol?: MaybeRef<string | undefined>;
}

export function useEarnDepositCard(options: UseEarnDepositCardOptions = {}) {
  // Convert options to reactive refs to maintain reactivity
  // Use toRef for plain values, or accept refs directly
  const maxAmount = computed(() => unref(options.maxAmount));
  const scrollId = computed(() => unref(options.scrollId));
  const onSubmit = computed(() => unref(options.onSubmit));
  const poolId = computed(() => unref(options.poolId));
  const profileId = computed(() => unref(options.profileId));
  const symbol = computed(() => unref(options.symbol));

  const schema = computed(() => ({
    $schema: 'http://json-schema.org/draft-07/schema#',
    definitions: {
      EarnDeposit: {
        properties: {
          amount: {
            type: 'number',
            minimum: 0.01,
            maximum: maxAmount.value || 0,
            errorMessage: {
              minimum: 'Amount must be greater than 0',
              maximum: `Maximum available is ${maxAmount.value || 0}`
            },
          },
        },
        type: 'object',
        required: ['amount'],
        errorMessage: errorMessageRule,
      },
    },
    $ref: '#/definitions/EarnDeposit',
  } as unknown as JSONSchemaType<FormModelEarnDeposit>));

  const fieldsPaths = ['amount'];

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
    resetValidation,
  } = useFormValidation<FormModelEarnDeposit>(
    schema,
    undefined,
    {} as FormModelEarnDeposit,
    fieldsPaths,
  );

  const isSubmitting = ref(false);
  const earnRepository = useRepositoryEarn();

  const submitHandler = async () => {
    onValidate();
    if (!isValid.value) {
      if (scrollId.value) {
        nextTick(() => scrollToError(scrollId.value as string));
      }
      return;
    }

    const amount = Number(model.amount);

    if (!amount || Number.isNaN(amount) || amount <= 0) {
      return;
    }

    isSubmitting.value = true;

    try {
      if (onSubmit.value) {
        await onSubmit.value(amount);
      } else if (poolId.value && profileId.value) {
        const result = await earnRepository.deposit({
          poolId: poolId.value,
          profileId: profileId.value,
          amount,
          symbol: symbol.value,
        });
        // After a successful deposit, refresh positions data for the position tab
        // The deposit function already updated the positions array, so we just need to trigger a refresh
        await earnRepository.getPositions(result.poolId, result.profileId);
      } else {
        // TODO: Implement actual deposit logic here
        await new Promise((resolve) => {
          setTimeout(resolve, 2000);
        });
      }

      model.amount = null;
    } finally {
      isSubmitting.value = false;
    }
  };

  const onMax = () => {
    if (maxAmount.value !== undefined && maxAmount.value !== null) {
      model.amount = Number(maxAmount.value);
      return;
    }

    // TODO: Replace with actual max available balance
    model.amount = 1000;
  };

  const resetFormValidation = () => {
    resetValidation();
    formErrors.clearErrors();
  };

  return {
    // form core
    model,
    validation,
    isValid,

    // helpers
    formErrors,
    isFieldRequired,
    getErrorText,
    getOptions,
    getReferenceType,
    onValidate,
    scrollToError,

    // actions
    isSubmitting,
    submitHandler,
    onMax,
    resetFormValidation,
  };
}


