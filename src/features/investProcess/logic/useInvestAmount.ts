import {
  computed, nextTick, onBeforeMount, ref, watch,
} from 'vue';
import { useRouter, useRoute, onBeforeRouteLeave } from 'vue-router';
import { useGlobalLoader } from 'UiKit/store/useGlobalLoader';
import { useHubspotForm } from 'UiKit/composables/useHubspotForm';
import {
  ROUTE_INVEST_AMOUNT,
  ROUTE_INVEST_REVIEW,
  ROUTE_INVEST_SIGNATURE,
} from 'InvestCommon/domain/config/enums/routes';
import { useSessionStore } from 'InvestCommon/domain/session/store/useSession';
import { useRepositoryInvestment } from 'InvestCommon/data/investment/investment.repository';
import { useRepositoryWallet } from 'InvestCommon/data/wallet/wallet.repository';
import { useRepositoryEvm } from 'InvestCommon/data/evm/evm.repository';
import { useRepositoryProfiles } from 'InvestCommon/data/profiles/profiles.repository';
import { useProfilesStore } from 'InvestCommon/domain/profiles/store/useProfiles';
import { FundingTypes } from 'InvestCommon/helpers/enums/general';
import { storeToRefs } from 'pinia';


export type formRef = {
  isValid: boolean;
  onValidate: () => void;
  scrollToError: (selector: string) => void;
  isBtnDisabled: boolean;
  model: any;
  isDirty?: boolean;
  componentData?: any;
};

export function useInvestAmount() {
  const globalLoader = useGlobalLoader();
  globalLoader.hide();

  const { submitFormToHubspot } = useHubspotForm('749740b1-d955-4158-b949-b68e13a59e5b');

  const userSessionStore = useSessionStore();
  const { userSessionTraits, userLoggedIn } = storeToRefs(userSessionStore);

  const investmentRepository = useRepositoryInvestment();
  const {
    setAmountOptionsState,
    setAmountState,
    getInvestUnconfirmedOne,
  } = storeToRefs(investmentRepository);

  const walletRepository = useRepositoryWallet();
  const {
    getWalletState, walletId, canLoadWalletData,
  } = storeToRefs(walletRepository);

  const evmRepository = useRepositoryEvm();
  const {
    getEvmWalletState, evmWalletId, canLoadEvmWalletData,
  } = storeToRefs(evmRepository);

  const profilesStore = useProfilesStore();
  const {
    selectedUserProfileData, selectedUserProfileId,
  } = storeToRefs(profilesStore);

  const repositoryProfiles = useRepositoryProfiles();
  const { getUserState } = storeToRefs(repositoryProfiles);

  const router = useRouter();
  const route = useRoute();

  // Computed values from investment data

  const errorData = computed(() => setAmountState.value.error?.data?.responseJson);
  const schemaBackend = computed(() => setAmountOptionsState.value.data);

  // Form ref and model
  const amountFormRef = ref<formRef | null>(null);
  const ownershipFormRef = ref<formRef | null>(null);
  const fundingFormRef = ref<formRef | null>(null);

  const formModel = ref<{
    number_of_shares?: number
    profile_id?: number
  }>({});

  // Button disabled state
  const isBtnDisabled = computed(() => {
    if (!amountFormRef.value || !ownershipFormRef.value || !fundingFormRef.value) return true;
    return amountFormRef.value?.isBtnDisabled
      || ownershipFormRef.value?.isBtnDisabled
      || fundingFormRef.value?.isBtnDisabled;
  });

  const isLoading = computed(() => setAmountState.value.loading);

  const fundingPayload = computed(() => {
    const fundingType = fundingFormRef.value?.model.funding_type;
    const componentData = fundingFormRef.value?.componentData;

    if (!fundingType) return undefined;

    // ACH funding
    if (fundingType === FundingTypes.ach) {
      if (componentData?.isInvalid) return undefined;
      return {
        funding_type: FundingTypes.ach,
        payment_data: {
          account_number: componentData.accountNumber,
          routing_number: componentData.routingNumber,
          account_holder_name: componentData.accountHolderName,
          account_type: componentData.accountType,
        },
      };
    }

    // Crypto wallet funding
    if (fundingType === FundingTypes.cryptoWallet) {
      return {
        funding_type: FundingTypes.cryptoWallet,
        payment_data: {
          wallet: getEvmWalletState.value.data?.address || '',
        },
      };
    }

    // Wallet funding (from saved funding source)
    if (
      fundingType !== FundingTypes.wallet &&
      fundingType !== FundingTypes.wire
    ) {
      return {
        funding_source_id: Number(fundingType),
        funding_type: FundingTypes.wallet,
      };
    }

    // Default: wallet or wire
    return { funding_type: fundingType };
  });

  const isAnyFormDirty = computed(() => (
    Boolean(
      amountFormRef.value?.isDirty
      || ownershipFormRef.value?.isDirty
      || fundingFormRef.value?.isDirty,
    )
  ));

  const navigateToBackendStepIfNeeded = () => {
    const backendStepName = getInvestUnconfirmedOne.value?.step as string | undefined;
    const currentStepName = 'amount';

    if (!backendStepName || backendStepName === currentStepName) return false;

    const normalizedStepName = backendStepName.toLowerCase();
    const stepToRouteName: Record<string, string> = {
      amount: ROUTE_INVEST_AMOUNT,
      signature: ROUTE_INVEST_SIGNATURE,
      review: ROUTE_INVEST_REVIEW,
    };

    const targetRouteName = stepToRouteName[normalizedStepName];
    if (!targetRouteName) return false;

    router.push({
      name: targetRouteName,
      params: {
        ...route.params,
      },
    });

    return true;
  };

  const updateData = (profileId?: number) => {
    if (!userLoggedIn.value) return;

    const targetProfileId = profileId ?? selectedUserProfileId.value;
    const targetProfile = getUserState.value?.data?.profiles?.find(
      (profile) => profile.id === targetProfileId
    );
    
    // Wallet data loading logic
    const canLoadWallet = walletRepository.canLoadWalletDataNotSelected(targetProfile);
    if (canLoadWallet) {
      walletRepository.getWalletByProfile(targetProfileId);
    } else if (getWalletState.value.data) {
      walletRepository.resetAll();
    }
    
    // EVM wallet (crypto) data loading logic
    const canLoadEvmWallet = evmRepository.canLoadEvmWalletDataNotSelected(targetProfile);
    if (canLoadEvmWallet) {
      evmRepository.getEvmWalletByProfile(targetProfileId);
    } else if (getEvmWalletState.value.data) {
      evmRepository.resetAll();
    }
  }

  // React to profile_id changes: reset funding method and reload wallets for the selected profile
  watch(
    () => formModel.value.profile_id,
    (newProfileId, oldProfileId) => {
      if (!newProfileId || newProfileId === oldProfileId) return;

      // Reset selected funding method when profile changes
      if (fundingFormRef.value?.model) {
        fundingFormRef.value.model.funding_type = undefined;
      }

      // Reload wallet and EVM wallet data for the new profile
      // Pass newProfileId explicitly to ensure we use the correct profile ID
      updateData(newProfileId);
    },
  );

  const validateAllForms = () => {
    if (!amountFormRef.value || !ownershipFormRef.value || !fundingFormRef.value) return false;

    const forms = [
      { ref: amountFormRef.value, selector: 'FormInvestAmount' },
      { ref: ownershipFormRef.value, selector: 'VFormInvestOwnership' },
      { ref: fundingFormRef.value, selector: 'InvestFormFunding' },
    ];

    // 1) Trigger validation on all forms so every subform updates its errors
    forms.forEach(({ ref }) => {
      ref.onValidate();
    });

    // 2) Check validity for each form, remembering the first invalid to scroll to
    let allValid = true;
    let firstInvalid: { ref: formRef; selector: string } | null = null;

    for (const entry of forms) {
      const { ref, selector } = entry;
      if (!ref.isValid) {
        allValid = false;
        if (!firstInvalid) {
          firstInvalid = entry;
          nextTick(() => ref.scrollToError(selector));
        }
      }
    }

    return allValid;
  };

  const buildAmountPayload = () => ({
    number_of_shares: amountFormRef.value?.model.number_of_shares,
    profile_id: ownershipFormRef.value?.model.profile_id,
    ...fundingPayload.value,
  });

  // Continue handler
  const handleContinue = async () => {
    const isValid = validateAllForms();
    if (!isValid) return;

    // If nothing was changed on any of the subforms, respect backend step without saving
    if (!isAnyFormDirty.value) {
      const redirected = navigateToBackendStepIfNeeded();
      if (redirected) return;
    }

    const { slug, id, profileId } = route.params;
    const dataToSend = buildAmountPayload();
    await investmentRepository.setAmount(
      slug as string,
      id as string,
      profileId as string,
      dataToSend,
    );


    if (setAmountState.value.error) return;

    submitFormToHubspot({
      email: userSessionTraits.value?.email,
      ...dataToSend,
      shares_amount: amountFormRef.value?.model?.number_of_shares,
      investment_amount: amountFormRef.value?.investmentAmount,
    });

    // Navigate to Signature step with updated profile
    router.push({
      name: ROUTE_INVEST_SIGNATURE,
      params: {
        ...route.params,
        profileId: String(dataToSend.profile_id),
      },
    });
  };

  onBeforeMount(() => {
    updateData();
  });

  // Reset wallet and EVM data when leaving invest process
  onBeforeRouteLeave(() => {
    evmRepository.resetAll();
    walletRepository.resetAll();
  });

  return {
    getInvestUnconfirmedOne,
    
    // Validation state
    errorData,
    schemaBackend,
    
    // Form state
    amountFormRef,
    ownershipFormRef,
    fundingFormRef,
    formModel,
    isLoading,
    isBtnDisabled,
    
    // Actions
    handleContinue,
    
    // Repository state
    setAmountState,
    setAmountOptionsState,

    // Wallet / profile state used by funding form
    getWalletState,
    walletId,
    getEvmWalletState,
    evmWalletId,
    selectedUserProfileData,
  };
} 