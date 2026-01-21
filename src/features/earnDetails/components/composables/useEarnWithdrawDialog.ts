import { computed, ref, unref, watch, type MaybeRef } from 'vue';
import type { JSONSchemaType } from 'ajv/dist/types/json-schema';
import { useFormValidation } from 'UiKit/helpers/validation/useFormValidation';
import { errorMessageRule } from 'UiKit/helpers/validation/rules';
import { useRepositoryEarn } from 'InvestCommon/data/earn/earn.repository';
import { useToast } from 'UiKit/components/Base/VToast/use-toast';

interface UseEarnWithdrawDialogOptions {
  poolId?: MaybeRef<string | undefined>;
  profileId?: MaybeRef<string | number | undefined>;
  symbol?: MaybeRef<string | undefined>;
  onClose?: () => void;
}

export interface FormModelEarnWithdraw {
  amount: number | null;
}

export function useEarnWithdrawDialog(options: UseEarnWithdrawDialogOptions = {}) {
  const poolId = computed(() => unref(options.poolId));
  const profileId = computed(() => unref(options.profileId));
  const symbol = computed(() => unref(options.symbol));

  const isSubmitting = ref(false);

  const earnRepository = useRepositoryEarn();
  const { withdraw, getPositions } = earnRepository;
  const { toast } = useToast();

  const formattedSymbol = computed(() => symbol.value ?? 'Token');

  const schema = computed(() => ({
    $schema: 'http://json-schema.org/draft-07/schema#',
    definitions: {
      EarnWithdraw: {
        properties: {
          amount: {
            type: 'number',
            minimum: 0.01,
            errorMessage: {
              minimum: 'Amount must be greater than 0',
            },
          },
        },
        type: 'object',
        required: ['amount'],
        errorMessage: errorMessageRule,
      },
    },
    $ref: '#/definitions/EarnWithdraw',
  } as unknown as JSONSchemaType<FormModelEarnWithdraw>));

  const fieldsPaths = ['amount'];

  const {
    model,
    isValid,
    onValidate,
    isFieldRequired,
    getErrorText,
  } = useFormValidation<FormModelEarnWithdraw>(
    schema,
    undefined,
    {} as FormModelEarnWithdraw,
    fieldsPaths,
  );

  const handleSubmit = async () => {
    onValidate();
    if (!isValid.value) return;
    const numAmount = Number(model.amount);
    if (!numAmount || Number.isNaN(numAmount) || numAmount <= 0) return;
    if (!poolId.value || !profileId.value) return;

    isSubmitting.value = true;
    try {
      await withdraw({
        poolId: poolId.value,
        profileId: profileId.value,
        amount: numAmount,
        symbol: symbol.value,
      });

      await getPositions(poolId.value, profileId.value);

      toast({
        title: 'Withdraw completed',
        description: `${numAmount} ${formattedSymbol.value} withdrawn successfully`,
        variant: 'success',
      });

      model.amount = null;
      options.onClose?.();
    } finally {
      isSubmitting.value = false;
    }
  };

  // Local errorData placeholder to satisfy getErrorText signature
  const errorData = ref<Record<string, any>>({});

  // Keep validation state in sync as the amount changes,
  // so the submit button pattern matches other forms.
  watch(
    () => model.amount,
    () => {
      // Trigger validation only when user has typed something
      if (model.amount !== null) {
        onValidate();
      }
    },
  );

  return {
    model,
    isValid,
    isFieldRequired,
    getErrorText: (field: keyof FormModelEarnWithdraw) => getErrorText(field, errorData),
    isSubmitting,
    formattedSymbol,
    handleSubmit,
  };
}

