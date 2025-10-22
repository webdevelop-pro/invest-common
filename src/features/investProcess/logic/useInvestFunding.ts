import {
  ref, computed, watch, nextTick, onBeforeMount,
} from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { useProfilesStore } from 'InvestCommon/domain/profiles/store/useProfiles';
import { useHubspotForm } from 'UiKit/composables/useHubspotForm';
import { useFormValidation } from 'UiKit/helpers/validation/useFormValidation';
import { ROUTE_INVEST_REVIEW, ROUTE_INVEST_SIGNATURE } from 'InvestCommon/domain/config/enums/routes';
import { FundingTypes } from 'InvestCommon/helpers/enums/general';
import { storeToRefs } from 'pinia';
import { currency } from 'InvestCommon/helpers/currency';
import { urlOfferSingle } from 'InvestCommon/domain/config/links';
import { errorMessageRule } from 'UiKit/helpers/validation/rules';
import { JSONSchemaType } from 'ajv/dist/types/json-schema';
import { useSessionStore } from 'InvestCommon/domain/session/store/useSession';
import { useRepositoryWallet } from 'InvestCommon/data/wallet/wallet.repository';
import { useRepositoryEvm } from 'InvestCommon/data/evm/evm.repository';
import { useRepositoryInvestment } from 'InvestCommon/data/investment/investment.repository';
import { useGlobalLoader } from 'UiKit/store/useGlobalLoader';
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

export function useInvestFunding() {
  const globalLoader = useGlobalLoader();
  globalLoader.hide();

  const route = useRoute();
  const router = useRouter();
  const { id, slug, profileId } = route?.params;
  const { submitFormToHubspot } = useHubspotForm('b27d194e-cbab-4c53-9d60-1065be6425be');

  const walletRepository = useRepositoryWallet();
  const { getWalletState, walletId, canLoadWalletData } = storeToRefs(walletRepository);
  const evmRepository = useRepositoryEvm();
  const { getEvmWalletState, evmWalletId, canLoadEvmWalletData } = storeToRefs(evmRepository);

  const profilesStore = useProfilesStore();
  const { selectedUserProfileData, selectedUserProfileId } = storeToRefs(profilesStore);

  const userSessionStore = useSessionStore();
  const { userSessionTraits, userLoggedIn } = storeToRefs(userSessionStore);
  const investmentRepository = useRepositoryInvestment();
  const { getInvestUnconfirmedOne, setFundingOptionsState, setFundingState } = storeToRefs(investmentRepository);

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

  const errorData = computed(() => (setFundingState.value.error as any)?.data?.responseJson);
  const schemaBackend = computed(() => setFundingOptionsState.value.data);

  // Use the useFormValidation composable
  const {
    model,
    validation,
    isValid,
    onValidate,
    scrollToError, formErrors, isFieldRequired, getErrorText,
    getOptions, getReferenceType,
  } = useFormValidation(
    schemaInvestmentFunding,
    schemaBackend,
    {} as FormModelInvestmentFunding,
    fieldsPaths
  );

  // Computed properties
  const fundingSource = computed(() => getWalletState.value.data?.funding_source || []);
  const fundingSourceFormatted = computed(() => 
    fundingSource.value?.map((item) => ({
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
    walletId.value > 0 && !getWalletState.value.data?.isWalletStatusAnyError
  );

  const notEnoughWalletFunds = computed(() => 
    (getInvestUnconfirmedOne.value?.amount || 0) > (getWalletState.value.data?.totalBalance || 0)
  );

  const hasEvmWallet = computed(() => 
    evmWalletId.value > 0 && !(getEvmWalletState.value.data?.isStatusAnyError || getEvmWalletState.value.error)
  );

  const notEnoughEvmWalletFunds = computed(() => 
    (getInvestUnconfirmedOne.value?.amount || 0) > (getEvmWalletState.value.data?.fundingBalance || 0)
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
        text: `Wallet (${currency(getWalletState.value.data?.totalBalance || 0)})`,
        disabled: (getWalletState.value.data?.totalBalance || 0) === 0,
      });
    }
    
    if (hasEvmWallet.value) {
      options.push({
        value: FundingTypes.cryptoWallet,
        text: `Crypto Wallet (${currency(getEvmWalletState.value.data?.fundingBalance || 0)})`,
        disabled: (getEvmWalletState.value.data?.fundingBalance || 0) === 0,
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
      if (errorData.value?.wallet) {
        return errorData.value.wallet;
      }
    }
    
    return getErrorText('funding_type', errorData.value);
  });

  const userName = computed(() => {
    const data = selectedUserProfileData.value?.data;
    return `${data?.first_name || ''} ${data?.last_name || ''}`.trim();
  });

  const isBtnDisabled = computed(() => {
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
        'offer-id': id,
        'user-name': userName.value,
        offer: getInvestUnconfirmedOne.value?.offer || {},
      };
    }
    
    if (currentComponent.value === InvestFormFundingAch) {
      return {
        validate: validate.value,
        errorData: errorData.value,
        paymentData: getInvestUnconfirmedOne.value?.payment_data || {},
      };
    }
    return false;
  });

  const fundingAnalytics = (type: FundingTypes, options: object) => {
    submitFormToHubspot({
      email: userSessionTraits.value?.email,
      funding_type: type,
      ...options,
    });
  };

  const continueHandler = async () => {
    onValidate();
    if (!isValid.value) {
      nextTick(() => scrollToError('InvestFormFunding'));
      return;
    }

    let data: any = { funding_type: model.funding_type };
    validate.value = true;
    await nextTick();
    validate.value = false;
    if ((model.funding_type === FundingTypes.ach) && componentData.value.isInvalid) return;
    const paymentData = {
      account_number: componentData.value.accountNumber,
      routing_number: componentData.value.routingNumber,
      account_holder_name: componentData.value.accountHolderName,
      account_type: componentData.value.accountType,
    };
    if (model.funding_type === FundingTypes.ach) {
      data = {
        funding_type: model.funding_type,
        payment_data: paymentData,
      };
    }
    if ((model.funding_type !== FundingTypes.ach) && (model.funding_type !== FundingTypes.wallet)
      && (model.funding_type !== FundingTypes.wire)) {
      data = {
        funding_source_id: Number(model.funding_type),
        funding_type: FundingTypes.wallet,
      };
    }
    if ((model.funding_type !== FundingTypes.ach) && (model.funding_type === FundingTypes.cryptoWallet)) {
      data = {
        funding_type: FundingTypes.cryptoWallet,
        payment_data: {
          wallet: getEvmWalletState.value.data?.address || '',
        },
      };
    }
    await investmentRepository.setFunding(slug as string, id as string, profileId as string, data);

    if (!setFundingState.value.error) {
      router.push({
        name: ROUTE_INVEST_REVIEW,
      });

      if (model.funding_type === FundingTypes.ach) {
        fundingAnalytics(FundingTypes.ach, paymentData);
      } else if (model.funding_type === FundingTypes.wire) {
        fundingAnalytics(FundingTypes.wire, {
          offer_id: id,
          user_name: userName.value,
        });
      }
    }
  };

  watch(() => getInvestUnconfirmedOne.value?.funding_type, (newType) => {
    if (newType && newType !== 'none' as any) {
      model.funding_type = newType;
    }
  }, { immediate: true });

  onBeforeMount(() => {
    if (userLoggedIn.value) {
      if (canLoadWalletData.value) {
        walletRepository.getWalletByProfile(selectedUserProfileId.value);
      }
      if (canLoadEvmWalletData.value) {
        evmRepository.getEvmWalletByProfile(selectedUserProfileId.value);
      }
    }
  });

  return {
    // Form state
    model,
    validation,
    isValid,
    onValidate,
    
    // Component data
    componentData,
    
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
    
    // Validation state
    errorData,
    schemaBackend,
    schemaInvestmentFunding,
    
    // Actions
    continueHandler,
    fundingAnalytics,
    
    // Repository state
    setFundingState,
    setFundingOptionsState,
    getInvestUnconfirmedOne,
    
    // Route params
    id,
    slug,
    profileId,
    
    // Constants
    ROUTE_INVEST_REVIEW,
    ROUTE_INVEST_SIGNATURE,
    urlOfferSingle,
    
    // Form validation helpers
    formErrors,
    isFieldRequired,
    getErrorText,
    getOptions,
    getReferenceType,
    scrollToError,
  };
}
