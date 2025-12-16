import {
  computed, nextTick, onBeforeMount, ref,
} from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { useGlobalLoader } from 'UiKit/store/useGlobalLoader';
import { useHubspotForm } from 'UiKit/composables/useHubspotForm';
import { ROUTE_INVEST_SIGNATURE } from 'InvestCommon/domain/config/enums/routes';
import { useSessionStore } from 'InvestCommon/domain/session/store/useSession';
import { useRepositoryInvestment } from 'InvestCommon/data/investment/investment.repository';
import { useRepositoryWallet } from 'InvestCommon/data/wallet/wallet.repository';
import { useRepositoryEvm } from 'InvestCommon/data/evm/evm.repository';
import { useProfilesStore } from 'InvestCommon/domain/profiles/store/useProfiles';
import { FundingTypes } from 'InvestCommon/helpers/enums/general';
import { storeToRefs } from 'pinia';


export type formRef = {
  isValid: boolean;
  onValidate: () => void;
  scrollToError: (selector: string) => void;
  isBtnDisabled: boolean;
  model: any;
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
    // Prepare funding payload
    let fundingPayload: any = { funding_type: fundingFormRef.value?.model.funding_type };
    const componentData = fundingFormRef.value?.componentData;

    // Additional check for ACH form validity
    if (
      fundingFormRef.value?.model.funding_type === FundingTypes.ach &&
      componentData.isInvalid
    ) {
      return;
    }

    const paymentData = {
      account_number: componentData.accountNumber,
      routing_number: componentData.routingNumber,
      account_holder_name: componentData.accountHolderName,
      account_type: componentData.accountType,
    };

    if (fundingFormRef.value?.model.funding_type === FundingTypes.ach) {
      fundingPayload = {
        funding_type: fundingFormRef.value?.model.funding_type,
        payment_data: paymentData,
      };
    }

    if (
      fundingFormRef.value?.model.funding_type !== FundingTypes.ach
      && fundingFormRef.value?.model.funding_type !== FundingTypes.wallet
      && fundingFormRef.value?.model.funding_type !== FundingTypes.wire
      && fundingFormRef.value?.model.funding_type !== FundingTypes.cryptoWallet
    ) {
      fundingPayload = {
        funding_source_id: Number(fundingFormRef.value?.model.funding_type),
        funding_type: FundingTypes.wallet,
      };
    }

    if (
      fundingFormRef.value?.model.funding_type !== FundingTypes.ach
      && fundingFormRef.value?.model.funding_type === FundingTypes.cryptoWallet
    ) {
      fundingPayload = {
        funding_type: FundingTypes.cryptoWallet,
        payment_data: {
          wallet: getEvmWalletState.value.data?.address || '',
        },
      };
    }

    return fundingPayload;
  });

  // Continue handler
  const handleContinue = async () => {
    if (!amountFormRef.value || !ownershipFormRef.value || !fundingFormRef.value) return;
    
    amountFormRef.value.onValidate();
    ownershipFormRef.value.onValidate();
    fundingFormRef.value.onValidate();
    if (!amountFormRef.value.isValid) {
      nextTick(() => amountFormRef.value?.scrollToError('FormInvestAmount'));
      return;
    }
    if (!ownershipFormRef.value.isValid) {
      nextTick(() => ownershipFormRef.value?.scrollToError('VFormInvestOwnership'));
      return;
    }

    if (!fundingFormRef.value.isValid) {
      nextTick(() => fundingFormRef.value?.scrollToError('InvestFormFunding'));
      return;
    }


    const { slug, id, profileId } = route.params;
    const dataToSend = {
      number_of_shares: amountFormRef.value?.model.number_of_shares,
      profile_id: ownershipFormRef.value?.model.profile_id,
      ...fundingPayload.value,
    }
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