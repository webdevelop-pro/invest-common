import {
  computed, reactive, watch, nextTick, type ComputedRef,
} from 'vue';
import { storeToRefs } from 'pinia';
import { WalletAddTransactionTypes } from 'InvestCommon/data/wallet/wallet.types';
import { numberFormatter } from 'InvestCommon/helpers/numberFormatter';
import { JSONSchemaType } from 'ajv/dist/types/json-schema';
import { errorMessageRule } from 'UiKit/helpers/validation/rules';
import { FormModelAddTransaction } from 'InvestCommon/types/form';
import { useRepositoryWallet } from 'InvestCommon/data/wallet/wallet.repository';
import { useFormValidation } from 'UiKit/helpers/validation/useFormValidation';

export function useVFormWalletAddTransaction(
  transactionType: ComputedRef<WalletAddTransactionTypes> | WalletAddTransactionTypes,
  emitClose?: () => void,
) {
  const walletRepository = useRepositoryWallet();
  const { getWalletState, addTransactionState, walletId } = storeToRefs(walletRepository);

  const isTypeDeposit = computed(() => (transactionType.value === WalletAddTransactionTypes.deposit));
  const titile = computed(() => (isTypeDeposit.value ? 'Add Funds' : 'Withdraw'));
  const currentBalance = computed(() => getWalletState.value.data?.currentBalance || 0);
  const pendingOutcomingBalance = computed(() => getWalletState.value.data?.pendingOutcomingBalance || 0);
  const fundingSource = computed(() => getWalletState.value.data?.funding_source || []);
  const maxWithdraw = computed(() => (currentBalance.value - pendingOutcomingBalance.value));
  const schemaMaximum = computed(() => (isTypeDeposit.value ? 1000000 : maxWithdraw.value));
  const schemaMaximumError = computed(() => (isTypeDeposit.value ? 'Maximum available is $1,000,000' : `Maximum available is $${maxWithdraw.value}`));
  const text = computed(() => (isTypeDeposit.value ? 'transaction is $1,000,000' : `available ${maxWithdraw.value}`));

  const errorData = computed(() => (addTransactionState.value.error as any)?.data?.responseJson);

  const schemaAddTransaction = computed(() => ({
    $schema: 'http://json-schema.org/draft-07/schema#',
    definitions: {
      Individual: {
        properties: {
          amount: {
            type: 'number',
            minimum: 1,
            maximum: schemaMaximum.value,
            errorMessage: {
              maximum: schemaMaximumError.value,
              minimum: 'Amount should be at least $1',
            },
          },
          funding_source_id: {
            type: 'number',
            minimum: 1,
          },
        },
        type: 'object',
        required: ['amount', 'funding_source_id'],
        errorMessage: errorMessageRule,
      },
    },
    $ref: '#/definitions/Individual',
  } as unknown as JSONSchemaType<FormModelAddTransaction>));

  const fieldsPaths = ['amount', 'funding_source_id'];

  const schemaFrontend = schemaAddTransaction;
  // Pass undefined directly for backend schema
  const {
    model,
    validation,
    isValid,
    onValidate,
    scrollToError, formErrors, isFieldRequired, getErrorText,
    getOptions, getReferenceType,
  } = useFormValidation<FormModelAddTransaction>(
    schemaFrontend,
    undefined,
    reactive({} as FormModelAddTransaction),
    fieldsPaths
  );

  const isDisabledButton = computed(() => (!isValid.value || addTransactionState.value.loading));

  const saveHandler = async () => {
    onValidate();
    if (!isValid.value) {
      nextTick(() => scrollToError('VFormWalletAddTransaction'));
      return;
    }
    const data = {
      type: transactionType.value,
      amount: Number(model.amount),
      funding_source_id: Number(model.funding_source_id),
    };
    await walletRepository.addTransaction(walletId.value, data);
    if (addTransactionState.value.error) return;
    if (emitClose) emitClose();
  };

  const cancelHandler = () => {
    if (emitClose) emitClose();
  };

  const fundingSourceFormatted = computed(() => (
    fundingSource.value?.map((item: any) => ({
      text: `${item.bank_name}: ${item.name}${item.last4 ? ` **** ${item.last4}` : ''}`,
      id: `${item.id}`,
    })) || []
  ));

  const fundingSourceFormattedLastItem = computed(() => (
    fundingSourceFormatted.value[fundingSourceFormatted.value.length - 1]
  ));

  watch(() => fundingSourceFormatted.value, () => {
    if (!model.funding_source_id) model.funding_source_id = Number(fundingSourceFormattedLastItem.value?.id);
  }, { immediate: true });

  return {
    model,
    validation,
    isValid,
    isDisabledButton,
    onValidate,
    saveHandler,
    cancelHandler,
    titile,
    text,
    errorData,
    schemaAddTransaction,
    addTransactionState,
    fundingSourceFormatted,
    numberFormatter,
    
    // Form validation helpers
    formErrors,
    isFieldRequired,
    getErrorText,
    getOptions,
    getReferenceType,
    scrollToError,
  };
}
