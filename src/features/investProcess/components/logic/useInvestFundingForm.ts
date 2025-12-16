import {
  ref, computed, watch, Ref,
} from 'vue';
import { useFormValidation } from 'UiKit/helpers/validation/useFormValidation';
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

  const notEnoughWalletFunds = computed(() =>
    (props.data?.amount || 0) > (props.getWalletState?.data?.totalBalance || 0)
  );

  const hasEvmWallet = computed(() => 
    (props.evmWalletId || 0) > 0 && !(props.getEvmWalletState?.data?.isStatusAnyError || props.getEvmWalletState?.error)
  );

  const notEnoughEvmWalletFunds = computed(() =>
    (props.data?.amount || 0) > (props.getEvmWalletState?.data?.fundingBalance || 0)
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
    
    return getErrorText('funding_type', props.errorData);
  });

  const userName = computed(() => {
    const data = props.selectedUserProfileData?.data;
    return `${data?.first_name || ''} ${data?.last_name || ''}`.trim();
  });

  // Combined validation that includes ACH form if ACH is selected
  const isValid = computed(() => {
    const mainValid = mainFormIsValid.value;
    if (model.funding_type === FundingTypes.ach && dynamicFormRef?.value) {
      return mainValid && dynamicFormRef.value.isValid;
    }
    return mainValid;
  });

  // Combined validation function
  const onValidate = () => {
    onValidateMainForm();
    if (model.funding_type === FundingTypes.ach && dynamicFormRef?.value) {
      dynamicFormRef.value.onValidate();
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
  };
}
