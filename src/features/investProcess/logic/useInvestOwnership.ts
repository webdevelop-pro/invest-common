import {
  computed, nextTick, useTemplateRef,
  ref,
} from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { useGlobalLoader } from 'UiKit/store/useGlobalLoader';
import { useProfilesStore } from 'InvestCommon/domain/profiles/store/useProfiles';
import { ROUTE_INVEST_SIGNATURE } from 'InvestCommon/domain/config/enums/routes';
import { storeToRefs } from 'pinia';
import { navigateWithQueryParams } from 'InvestCommon/helpers/general';
import { scrollToError } from 'UiKit/helpers/validation/general';
import { urlProfileAccount } from 'InvestCommon/domain/config/links';
import { InvestKycTypes } from 'InvestCommon/types/api/invest';
import { PROFILE_TYPES } from 'InvestCommon/domain/config/enums/profileTypes';
import { FormChild } from 'InvestCommon/types/form';
import { useRepositoryProfiles } from 'InvestCommon/data/profiles/profiles.repository';
import { useRepositoryInvestment } from 'InvestCommon/data/investment/investment.repository';

export function useInvestOwnership() {
  const globalLoader = useGlobalLoader();
  globalLoader.hide();

  // Store setup
  const router = useRouter();
  const route = useRoute();
  const useRepositoryProfilesStore = useRepositoryProfiles();
  const { setProfileState, getProfileByIdOptionsState, setProfileByIdState } = storeToRefs(useRepositoryProfilesStore);
  const profilesStore = useProfilesStore();
  const { selectedUserProfileData, selectedUserProfileType, selectedUserProfileId } = storeToRefs(profilesStore);
  const investmentRepository = useRepositoryInvestment();
  const { setOwnershipState } = storeToRefs(investmentRepository);

  // Profile type mapping for cleaner logic
  const PROFILE_FORM_MAP = {
    [PROFILE_TYPES.INDIVIDUAL]: 'individualFormChild',
    [PROFILE_TYPES.ENTITY]: 'entityFormChild',
    [PROFILE_TYPES.SDIRA]: 'sdiraFormChild',
    [PROFILE_TYPES.SOLO401K]: 'soloFormChild',
    [PROFILE_TYPES.TRUST]: 'trustFormChild',
  } as const;

  // Template refs
  const formRefs = {
    individualFormChild: useTemplateRef<FormChild>('individualFormChild'),
    entityFormChild: useTemplateRef<FormChild>('entityFormChild'),
    sdiraFormChild: useTemplateRef<FormChild>('sdiraFormChild'),
    soloFormChild: useTemplateRef<FormChild>('soloFormChild'),
    trustFormChild: useTemplateRef<FormChild>('trustFormChild'),
  };

  // Helper function to get current form ref based on profile type
  const getCurrentFormRef = () => {
    const profileType = selectedUserProfileType.value?.toLowerCase();
    if (!profileType) return null;
    const formKey = PROFILE_FORM_MAP[profileType as keyof typeof PROFILE_FORM_MAP];
    return formKey ? formRefs[formKey] : null;
  };

  // Computed properties
  const isAlertShow = computed(() => selectedUserProfileData.value?.kyc_status !== InvestKycTypes.approved);
  const isAlertText = computed(() => 'You need to pass KYC before you can make investment with this profile.');
  const errorData = computed(() => setProfileState.value.error?.data?.responseJson);
  const schemaBackend = computed(() => getProfileByIdOptionsState.value.data);

  // Simplified computed properties using helper function
  const childFormIsValid = computed(() => getCurrentFormRef()?.value?.isValid ?? true);
  const childFormModel = computed(() => getCurrentFormRef()?.value?.model ?? {});
  const isValid = computed(() => childFormIsValid.value);
  const isDisabledButton = computed(() => !isValid.value || isAlertShow.value);
  const dataUserData = computed(() => selectedUserProfileData.value?.data || {});

  // Route params with type safety
  const slug = route.params.slug as string;
  const id = route.params.id as string;
  const profileId = route.params.profileId as string;

  // State
  const isLoadingLocal = ref(false);

  const isLoading = computed(() =>
    setProfileState.value.loading || isLoadingLocal.value);

  // Validation function
  const onValidate = () => {
    getCurrentFormRef()?.value?.onValidate();
  };

  // Main handler
  const continueHandler = async () => {
    const model = { ...childFormModel.value };
    onValidate();
    
    if (!isValid.value) {
      nextTick(() => scrollToError('VFormInvestProcessOwnership'));
      return;
    }

    isLoadingLocal.value = true;
    
    try {
      if (!selectedUserProfileType.value || !selectedUserProfileId.value) {
        console.error('Profile type or ID is missing');
        return;
      }
      
      await useRepositoryProfilesStore.setProfileById(
        model,
        selectedUserProfileType.value,
        selectedUserProfileId.value,
      );
      
      if (!setProfileByIdState.value.error) {
        await investmentRepository.setOwnership(slug, id, String(selectedUserProfileId.value));
      }

      if (setOwnershipState.value.error) return;
      
      await useRepositoryProfilesStore.getProfileById(selectedUserProfileType.value, selectedUserProfileId.value);
      
      if (setOwnershipState.value.data) {
        router.push({ name: ROUTE_INVEST_SIGNATURE });
      }
    } finally {
      isLoadingLocal.value = false;
    }
  };

  const onAlertButtonClick = () => {
    if (selectedUserProfileId.value) {
      navigateWithQueryParams(urlProfileAccount(selectedUserProfileId.value));
    }
  };

  return {
    // Constants
    PROFILE_TYPES,
    
    // Store state
    setProfileState,
    getProfileByIdOptionsState,
    setProfileByIdState,
    selectedUserProfileData,
    selectedUserProfileType,
    selectedUserProfileId,
    setOwnershipState,
    
    // Form refs
    formRefs,
    
    // Computed values
    isAlertShow,
    isAlertText,
    errorData,
    schemaBackend,
    childFormIsValid,
    childFormModel,
    isValid,
    isDisabledButton,
    dataUserData,
    
    // Route params
    slug,
    id,
    profileId,
    
    // State
    isLoading,
    
    // Actions
    onValidate,
    continueHandler,
    onAlertButtonClick,
    
    // Helper functions
    getCurrentFormRef,
  };
} 