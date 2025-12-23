import {
  ref, computed, watch, Ref,
} from 'vue';
import { useFormValidation } from 'UiKit/helpers/validation/useFormValidation';
import { useForm } from 'UiKit/composables/useForm';
import { FundingTypes } from 'InvestCommon/helpers/enums/general';
import { errorMessageRule } from 'UiKit/helpers/validation/rules';
import { JSONSchemaType } from 'ajv/dist/types/json-schema';
import { currency } from 'InvestCommon/helpers/currency';
import InvestFormFundingAch from 'InvestCommon/features/investProcess/components/VFormInvestFundingAch.vue';
import InvestFormFundingWire from 'InvestCommon/features/investProcess/components/VFormInvestFundingWire.vue';

const SELECT_OPTIONS_FUNDING_TYPE = [
  { value: FundingTypes.ach, text: 'ACH' },
  { value: FundingTypes.wire, text: 'WIRE' },
];

export type FormModelInvestmentFunding = {
  funding_type: FundingTypes;
}

export type ComponentData = {
  isInvalid: boolean;
  accountHolderName: string;
  accountType: string;
  accountNumber: string;
  routingNumber: string;
}

export interface UseInvestFundingFormProps {
  // Shared step model from parent (ViewInvestAmount)
  // Currently only number_of_shares is needed here
  modelValue?: {
    number_of_shares?: number;
  };
  errorData?: any;
  schemaBackend?: any;
  data?: any;
  getWalletState?: any;
  walletId?: number;
  getEvmWalletState?: any;
  evmWalletId?: number;
  selectedUserProfileData?: any;
}

export interface UseInvestFundingFormEmits {
  (e: 'update:componentData', value: any): void;
}

export function useInvestFundingForm(
  props: UseInvestFundingFormProps,
  emit?: UseInvestFundingFormEmits,
  dynamicFormRef?: Ref<{ isValid: boolean; onValidate: () => void; scrollToError: (selector: string) => void } | null>,
) {
  const schemaInvestmentFunding = {
    $schema: 'http://json-schema.org/draft-07/schema#',
    definitions: {
      FundingStep: {
        properties: { funding_type: {} },
        errorMessage: errorMessageRule,
        required: ['funding_type'],
      },
    },
    $ref: '#/definitions/FundingStep',
  } as unknown as JSONSchemaType<FormModelInvestmentFunding>;

  const fieldsPaths = ['funding_type'];

  // Use the useFormValidation composable
  const {
    model,
    validation,
    isValid: mainFormIsValid,
    onValidate: onValidateMainForm,
    scrollToError,
    formErrors,
    isFieldRequired,
    getErrorText,
    getOptions,
    getReferenceType,
  } = useFormValidation(
    schemaInvestmentFunding,
    props.schemaBackend,
    {} as FormModelInvestmentFunding,
    fieldsPaths
  );

  // Computed properties
  const fundingSource = computed(() => props.getWalletState?.data?.funding_source || []);
  const fundingSourceFormatted = computed(() => 
    fundingSource.value?.map((item: any) => ({
      value: String(item.id),
      text: `${item.bank_name}: ${item.name}`,
    })) || []
  );

  const componentData = ref<ComponentData>({
    isInvalid: false,
    accountHolderName: '',
    accountType: '',
    accountNumber: '',
    routingNumber: '',
  });

  // Wallet status checks
  const hasWallet = computed(() => 
    (props.walletId || 0) > 0 && !props.getWalletState?.data?.isWalletStatusAnyError
  );

  // Calculate investment amount - prioritize shared modelValue.number_of_shares, then saved data
  const investmentAmount = computed(() => {
    const mv = props.modelValue || {};
    console.log('mv', mv);

    // 1) derive from current shared modelValue.number_of_shares (live form value)
    if (mv.number_of_shares != null) {
      const pricePerShare = props.data?.offer?.price_per_share || 0;
      return mv.number_of_shares * pricePerShare;
    }

    // 2) saved backend amount (e.g. when returning to an existing investment)
    if (props.data?.amount != null) {
      return props.data.amount;
    }

    // 3) fallback: derive from backend number_of_shares * price_per_share
    const numberOfShares = props.data?.number_of_shares ?? 0;
    const pricePerShare = props.data?.offer?.price_per_share || 0;
    return numberOfShares * pricePerShare;
  });

  const notEnoughWalletFunds = computed(() =>
    investmentAmount.value > (props.getWalletState?.data?.totalBalance || 0)
  );

  const hasEvmWallet = computed(() => 
    (props.evmWalletId || 0) > 0 && !(props.getEvmWalletState?.data?.isStatusAnyError || props.getEvmWalletState?.error)
  );

  const notEnoughEvmWalletFunds = computed(() =>
    investmentAmount.value > (props.getEvmWalletState?.data?.fundingBalance || 0)
  );

  const selectOptions = computed(() => {
    const options: Array<{
      value: FundingTypes | string;
      text: string;
      disabled?: boolean;
    }> = [...SELECT_OPTIONS_FUNDING_TYPE];
    
    // Add wallet options if available
    if (hasWallet.value) {
      options.push({
        value: FundingTypes.wallet,
        text: `Wallet (${currency(props.getWalletState?.data?.totalBalance || 0)})`,
        disabled: (props.getWalletState?.data?.totalBalance || 0) === 0,
      });
    }
    
    if (hasEvmWallet.value) {
      options.push({
        value: FundingTypes.cryptoWallet,
        text: `Crypto Wallet (${currency(props.getEvmWalletState?.data?.fundingBalance || 0)})`,
        disabled: (props.getEvmWalletState?.data?.fundingBalance || 0) === 0,
      });
    }
    
    options.push(...fundingSourceFormatted.value);
    return options;
  });

  const selectErrors = computed(() => {
    // 1) Schema / frontend validation errors (required, enum, etc.)
    const formValidationError = formErrors.getFieldError('funding_type');
    if (formValidationError) {
      return [formValidationError];
    }

    // 2) Business logic errors for insufficient funds
    if (model.funding_type === FundingTypes.cryptoWallet && notEnoughEvmWalletFunds.value) {
      return ['Crypto wallet does not have enough funds'];
    }
    
    if (model.funding_type === FundingTypes.wallet) {
      if (notEnoughWalletFunds.value) {
        return ['Wallet does not have enough funds'];
      }
      if (props.errorData?.wallet) {
        return props.errorData.wallet;
      }
    }
    
    // 3) Backend/API errors for funding_type, if any
    return getErrorText('funding_type', props.errorData);
  });

  const userName = computed(() => {
    const data = props.selectedUserProfileData?.data;
    return `${data?.first_name || ''} ${data?.last_name || ''}`.trim();
  });

  // Combined validation that includes ACH form and funds checks
  const isValid = computed(() => {
    const mainValid = mainFormIsValid.value;
    if (!mainValid) return false;

    // Check if there are any select errors (insufficient funds, API errors, etc.)
    const errors = selectErrors.value;
    const hasErrors = Array.isArray(errors) 
      ? errors.some(error => error && String(error).trim() !== '')
      : errors && String(errors).trim() !== '';
    
    if (hasErrors) return false;

    // For ACH, also check the nested ACH form
    if (model.funding_type === FundingTypes.ach && dynamicFormRef?.value) {
      return dynamicFormRef.value.isValid;
    }

    return true;
  });

  // Combined validation function
  // Ensures validation is synchronous and validates nested ACH form when needed
  const onValidate = () => {
    // Validate main form first
    onValidateMainForm();
    
    // For ACH forms, validate the nested form and immediately update componentData.isInvalid
    if (model.funding_type === FundingTypes.ach && dynamicFormRef?.value) {
      dynamicFormRef.value.onValidate();
      // Immediately update componentData.isInvalid synchronously
      const achFormIsValid = dynamicFormRef.value.isValid;
      componentData.value.isInvalid = !achFormIsValid;
    }
  };

  const isBtnDisabled = computed(() => {
    // First check if combined form is valid
    if (!isValid.value) return true;
    
    // Then check funding type specific validations
    switch (model.funding_type) {
      case FundingTypes.ach:
        return componentData.value.isInvalid;
      case FundingTypes.wallet:
        return notEnoughWalletFunds.value;
      case FundingTypes.cryptoWallet:
        return notEnoughEvmWalletFunds.value;
      default:
        return false;
    }
  });

  const currentComponent = computed(() => {
    switch (model.funding_type) {
      case FundingTypes.wire:
        return InvestFormFundingWire;
      case FundingTypes.ach:
        return InvestFormFundingAch;
      default:
        return null;
    }
  });

  const validate = ref(false);
  const currentProps = computed(() => {
    if (currentComponent.value === InvestFormFundingWire) {
      return {
        'offer-id': props.data?.id,
        'user-name': userName.value,
        offer: props.data?.offer || {},
      };
    }
    
    if (currentComponent.value === InvestFormFundingAch) {
      return {
        validate: validate.value,
        errorData: props.errorData,
        paymentData: props.data?.payment_data || {},
      };
    }
    return false;
  });

  // Watch for funding type changes from offer data
  watch(() => props.data?.funding_type, (newType) => {
    if (newType && newType !== 'none' as any) {
      model.funding_type = newType;
    }
  }, { immediate: true });

  // Watch componentData and emit updates
  if (emit) {
    watch(componentData, (newValue) => {
      emit('update:componentData', newValue);
    }, { deep: true });
  }

  // Track dirty state for the main funding_type form field
  const { isDirty } = useForm<FormModelInvestmentFunding>({
    initialValues: computed(() => ({
      funding_type: props.data?.funding_type as FundingTypes | undefined,
    })),
    currentValues: model,
  });

  return {
    // Form state
    model,
    validation,
    isValid,
    onValidate,
    scrollToError,
    
    // Component data
    componentData,
    validate,
    
    // Computed values
    fundingSource,
    fundingSourceFormatted,
    hasWallet,
    notEnoughWalletFunds,
    hasEvmWallet,
    notEnoughEvmWalletFunds,
    selectOptions,
    selectErrors,
    userName,
    isBtnDisabled,
    currentComponent,
    currentProps,
    
    // Form validation helpers
    formErrors,
    isFieldRequired,
    getErrorText,
    getOptions,
    getReferenceType,

    // Dirty state
    isDirty,

    // Expose for testing and potential consumers
    investmentAmount,
  };
}
