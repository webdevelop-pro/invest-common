import { computed, nextTick, ref, unref, type MaybeRef } from 'vue';
import type { JSONSchemaType } from 'ajv/dist/types/json-schema';
import { useFormValidation } from 'UiKit/helpers/validation/useFormValidation';
import { errorMessageRule } from 'UiKit/helpers/validation/rules';
import { useRepositoryEarn } from 'InvestCommon/data/earn/earn.repository';
import { useToast } from 'UiKit/components/Base/VToast/use-toast';
import { storeToRefs } from 'pinia';
import { useRouter } from 'vue-router';
import { ROUTE_EARN_YOUR_POSITION } from 'InvestCommon/domain/config/enums/routes';

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
  const { toast } = useToast();
  const router = useRouter();

  const hasApproved = computed(
    () =>
      Boolean(
        poolId.value &&
          profileId.value != null &&
          symbol.value &&
          earnRepository.isTokenApproved(poolId.value, profileId.value, symbol.value),
      ),
  );
  const isApproving = ref(false);

  const isMaxDisabled = computed(() => !maxAmount.value || maxAmount.value <= 0);

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

      toast({
        title: 'Supply completed',
        description: `${amount} ${symbol.value ?? ''} supplied successfully`,
        variant: 'success',
      });

      model.amount = null;

      // Navigate to "your-position" tab; explicitly clear query so tab (and any other) query is removed from URL
      if (poolId.value && profileId.value != null) {
        await router.push({
          name: ROUTE_EARN_YOUR_POSITION,
          params: {
            profileId: String(profileId.value),
            poolId: poolId.value,
          },
          query: {},
        });
      }
      nextTick(() => {
        const el = document.getElementById('earn-your-position-table');
        if (el) {
          const rect = el.getBoundingClientRect();
          const offset = window.pageYOffset || document.documentElement.scrollTop || 0;
          const targetY = rect.top + offset - 150;

          window.scrollTo({
            top: targetY,
            behavior: 'smooth',
          });
        }
      });
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

  const { depositState } = storeToRefs(earnRepository);
  const errorData = computed(() => (depositState.value.error as any)?.data?.responseJson || {});

  const approveToken = async () => {
    if (hasApproved.value || isApproving.value) return;

    isApproving.value = true;

    try {
      // Simulate on-chain approval delay
      await new Promise((resolve) => {
        setTimeout(resolve, 2000);
      });

      if (poolId.value && profileId.value && symbol.value) {
        earnRepository.mockApprovalTransaction({
          profileId: profileId.value,
          poolId: poolId.value,
          symbol: symbol.value,
        });

        // Refresh positions so "Your Position" tab updates after approval
        await earnRepository.getPositions(poolId.value, profileId.value);
      }

      toast({
        title: 'Approved',
        description: `${symbol.value ?? 'Token'} approved successfully`,
        variant: 'success',
      });
    } finally {
      isApproving.value = false;
    }
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
    errorData,
    depositState,
    isMaxDisabled,
    hasApproved,
    isApproving,
    approveToken,
  };
}

