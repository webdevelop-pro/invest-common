import {
  ref, computed, useTemplateRef,
  nextTick, watch,
} from 'vue';
import { storeToRefs } from 'pinia';
import { useHubspotForm } from 'UiKit/composables/useHubspotForm';
import { useRouter } from 'vue-router';
import { ROUTE_DASHBOARD_ACCOUNT } from 'InvestCommon/domain/config/enums/routes';
import { FormChild } from 'InvestCommon/types/form';
import { PROFILE_TYPES as profileTypes } from 'InvestCommon/domain/config/enums/profileTypes';
import env from 'InvestCommon/domain/config/env';
import { useRepositoryProfiles } from 'InvestCommon/data/profiles/profiles.repository';
import { useSessionStore } from 'InvestCommon/domain/session/store/useSession';
import { useRepositoryAccreditation } from 'InvestCommon/data/accreditation/accreditation.repository';
import { useProfilesStore } from 'InvestCommon/domain/profiles/store/useProfiles';

export const useFormCreateNewProfile = () => {
  const router = useRouter();
  const userProfileStore = useProfilesStore();
  const {
    selectedUserProfileId, selectedUserProfileData, selectedUserIndividualProfile,
  } = storeToRefs(userProfileStore);
  const useRepositoryProfilesStore = useRepositoryProfiles();
  const { setProfileState, getProfileOptionsState, setProfileByIdState } = storeToRefs(useRepositoryProfilesStore);
  const userSessionStore = useSessionStore();
  const { userSessionTraits } = storeToRefs(userSessionStore);
  const accreditationRepository = useRepositoryAccreditation();

  const backButtonText = ref('Back to Profile Details');
  const accountRoute = computed(() => (
    { name: ROUTE_DASHBOARD_ACCOUNT, params: { profileId: selectedUserProfileId.value || 0 } }));
  const breadcrumbs = computed(() => [
    {
      text: 'Dashboard',
      to: accountRoute.value,
    },
    {
      text: 'Set Up Investment Account',
    },
  ]);

  const selectTypeFormRef = useTemplateRef<FormChild>('selectTypeFormChild');
  const entityTypeFormRef = useTemplateRef<FormChild>('entityFormChild');
  const sdiraTypeFormRef = useTemplateRef<FormChild>('sdiraFormChild');
  const soloTypeFormRef = useTemplateRef<FormChild>('soloFormChild');
  const trustTypeFormRef = useTemplateRef<FormChild>('trustFormChild');

  const PROFILE_TYPES = computed(() => profileTypes);
  const selectedType = computed(() => String(selectTypeFormRef.value?.model?.type_profile));
  const errorData = computed(() => setProfileState.value.error?.data?.responseJson || null);
  const schemaBackend = computed(() => getProfileOptionsState.value.data || null);

  // Enhanced loading state for profile switching
  const isProfileSwitching = ref(false);
  const previousSelectedType = ref<string>('');
  const showSkeleton = ref(false);

  // Watch for profile type changes to show loading skeleton
  watch(
    selectedType,
    async (newType, oldType) => {
      if (oldType && oldType !== newType) {
        isProfileSwitching.value = true;
        showSkeleton.value = true;

        await nextTick();

        setTimeout(() => {
          showSkeleton.value = false;
          isProfileSwitching.value = false;
        }, 150);
      }

      previousSelectedType.value = newType || '';
    },
    { immediate: true }
  );

  const childFormIsValid = computed(() => {
    if (selectedType.value.toLowerCase() === profileTypes.ENTITY) {
      return entityTypeFormRef.value?.isValid;
    }
    if (selectedType.value.toLowerCase() === profileTypes.SDIRA) {
      return sdiraTypeFormRef.value?.isValid;
    }
    if (selectedType.value.toLowerCase() === profileTypes.SOLO401K) {
      return soloTypeFormRef.value?.isValid;
    }
    if (selectedType.value.toLowerCase() === profileTypes.TRUST) {
      return trustTypeFormRef.value?.isValid;
    }
    return true;
  });
  const childFormModel = computed(() => {
    if (selectedType.value.toLowerCase() === profileTypes.ENTITY) {
      return entityTypeFormRef.value?.model;
    }
    if (selectedType.value.toLowerCase() === profileTypes.SDIRA) {
      return sdiraTypeFormRef.value?.model;
    }
    if (selectedType.value.toLowerCase() === profileTypes.SOLO401K) {
      return soloTypeFormRef.value?.model;
    }
    if (selectedType.value.toLowerCase() === profileTypes.TRUST) {
      return trustTypeFormRef.value?.model;
    }
    return {};
  });
  const personalFormModel = computed(() => {
    if (selectedType.value.toLowerCase() === profileTypes.ENTITY) {
      return entityTypeFormRef.value?.personalFormRef?.model;
    }
    if (selectedType.value.toLowerCase() === profileTypes.SDIRA) {
      return sdiraTypeFormRef.value?.personalFormRef?.model;
    }
    if (selectedType.value.toLowerCase() === profileTypes.SOLO401K) {
      return soloTypeFormRef.value?.personalFormRef?.model;
    }
    if (selectedType.value.toLowerCase() === profileTypes.TRUST) {
      return trustTypeFormRef.value?.personalFormRef?.model;
    }
    return {};
  });
  const onValidate = () => {
    selectTypeFormRef.value?.onValidate();
    if (selectedType.value.toLowerCase() === profileTypes.ENTITY) {
      entityTypeFormRef.value?.onValidate();
    }
    if (selectedType.value.toLowerCase() === profileTypes.SDIRA) {
      sdiraTypeFormRef.value?.onValidate();
    }
    if (selectedType.value.toLowerCase() === profileTypes.SOLO401K) {
      soloTypeFormRef.value?.onValidate();
    }
    if (selectedType.value.toLowerCase() === profileTypes.TRUST) {
      trustTypeFormRef.value?.onValidate();
    }
  };

  const isLoading = ref(false);
  const isValid = computed(() => (selectTypeFormRef.value?.isValid && childFormIsValid.value));
  const isDisabledButton = computed(() => (!isValid.value));
  const modelData = computed(() => selectedUserIndividualProfile.value?.data || {});
  const isIndividualEscrow = computed(() => selectedUserIndividualProfile.value?.escrow_id);
  const isTrustRevocable = computed(() => (
    (selectedType.value.toLowerCase() === profileTypes.TRUST) && childFormModel.value?.type?.toLowerCase().includes('revocable')));

  const isProfileAktAsIndividual = computed(() => (
    (selectedType.value.toLowerCase() === profileTypes.SDIRA)
    || (selectedType.value.toLowerCase() === profileTypes.SOLO401K)
    || isTrustRevocable.value)); // same logic as in domain profiles

  const handleHubspot = () => {
    const model = { ...childFormModel.value };
    useHubspotForm(env.HUBSPOT_FORM_ID_PERSONAL_INFORMATION).submitFormToHubspot({
      email: userSessionTraits.value?.email,
      firstname: model?.first_name,
      lastname: model?.last_name,
      middle_name: model?.middle_name,
      date_of_birth: model?.dob,
      phone: model?.phone,
      citizenship: model?.citizenship,
      snn: model?.ssn,
      address_1: model?.address1,
      address_2: model?.address2,
      city: model?.city,
      state: model?.state,
      zip_code: model?.zip_code,
      country: model?.country,
    });
    if (selectedType.value.toLowerCase() === profileTypes.ENTITY) {
      useHubspotForm(env.HUBSPOT_FORM_ID_ENTITY_INFORMATION).submitFormToHubspot({
        email: userSessionTraits.value?.email,
        type: model.type,
        name: model.name,
        owner_title: model.owner_title,
        solely_for_investing: model.solely_for_investing,
        tax_exempts: model.tax_exempts,
      });
      useHubspotForm(env.HUBSPOT_FORM_ID_BUSINESS_CONTROLLER).submitFormToHubspot({
        email: userSessionTraits.value?.email,
        business_controller: model.business_controller,
      });
      useHubspotForm(env.HUBSPOT_FORM_ID_BENEFICIAL_OWNERS).submitFormToHubspot({
        email: userSessionTraits.value?.email,
        beneficials: model.beneficials,
      });
    }
    if (selectedType.value.toLowerCase() === profileTypes.TRUST) {
      useHubspotForm(env.HUBSPOT_FORM_ID_TRUST_INFORMATION).submitFormToHubspot({
        email: userSessionTraits.value?.email,
        type: model.type,
        name: model.name,
        owner_title: model.owner_title,
        ein: model.ein,
      });
      useHubspotForm(env.HUBSPOT_FORM_ID_BUSINESS_CONTROLLER).submitFormToHubspot({
        email: userSessionTraits.value?.email,
        business_controller: model.business_controller,
      });
      useHubspotForm(env.HUBSPOT_FORM_ID_BENEFICIAL_OWNERS).submitFormToHubspot({
        email: userSessionTraits.value?.email,
        beneficials: model.beneficials,
      });
    }
    if (selectedType.value.toLowerCase() === profileTypes.SDIRA) {
      useHubspotForm(env.HUBSPOT_FORM_ID_CUSTODIAN).submitFormToHubspot({
        email: userSessionTraits.value?.email,
        custodian: model.type,
        account_number: model.account_number,
        full_account_name: model.full_account_name,
      });
    }
    if (selectedType.value.toLowerCase() === profileTypes.SOLO401K) {
      useHubspotForm(env.HUBSPOT_FORM_ID_PLAN_INFO).submitFormToHubspot({
        email: userSessionTraits.value?.email,
        name: model.name,
        ein: model.ein,
      });
    }
  };


  const handlerCreateEscrow = async () => {
    const model = { ...childFormModel.value };
    await useRepositoryProfilesStore.setProfile(
      model,
      selectedType.value,
    );

    if (!setProfileState.value.error) {
      handleHubspot();
      await accreditationRepository.createEscrow(
        selectedUserProfileData.value?.user_id,
        setProfileState.value.data?.id,
      );
      await useRepositoryProfilesStore.getUser();
      await userProfileStore.setSelectedUserProfileById(Number(setProfileState.value.data?.id));
      useRepositoryProfilesStore.getProfileById(selectedType.value, String(setProfileState.value.data?.id));
      isLoading.value = false;
      router.push({ name: ROUTE_DASHBOARD_ACCOUNT, params: { profileId: String(setProfileState.value.data?.id) } });
    }
  };

  const handlerCheckIndividualEscrow = async () => {
    const model = { ...childFormModel.value };
    if (!isIndividualEscrow.value) {
      await accreditationRepository.createEscrow(
        selectedUserProfileData.value?.user_id,
        selectedUserIndividualProfile.value?.id,
      );
    }
    if (!accreditationRepository.createEscrowState.value.error) {
      await useRepositoryProfilesStore.setProfile(
        model,
        selectedType.value,
      );
    }

    if (!setProfileState.value.error) {
      handleHubspot();
      await useRepositoryProfilesStore.getUser();
      await userProfileStore.setSelectedUserProfileById(Number(setProfileState.value.data?.id));
      useRepositoryProfilesStore.getProfileById(selectedType.value, String(setProfileState.value.data?.id));
      isLoading.value = false;
      router.push({ name: ROUTE_DASHBOARD_ACCOUNT, params: { profileId: String(setProfileState.value.data?.id) } });
    }
  };

  const handleSave = async () => {
    onValidate();
    if (!isValid.value) {
      nextTick(() => {
        const element = document.querySelector('.ViewCreateNewProfile');
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      });
      return;
    }

    isLoading.value = true;

    try {
      await useRepositoryProfilesStore.setProfileById(
          personalFormModel.value,
          selectedUserIndividualProfile.value?.type,
          selectedUserProfileId.value,
      );

      if (setProfileByIdState.value.error) {
        return;
      }

      useRepositoryProfilesStore.setUser({ phone: personalFormModel.value?.phone });
      useRepositoryProfilesStore.getUser();

      if (isProfileAktAsIndividual.value) {
        await handlerCheckIndividualEscrow();
      } else {
        await handlerCreateEscrow();
      }
    } finally {
      isLoading.value = false;
    }
  };

  watch(() => selectedType.value, () => {
    if (selectedType.value && selectedType.value.length > 0 && selectedType.value !== 'undefined') {
      useRepositoryProfilesStore.getProfileOptions(selectedType.value);
    }
  });

  // Expose everything needed for the view
  return {
    backButtonText,
    breadcrumbs,
    selectedType,
    selectedUserProfileData,
    isDisabledButton,
    isLoading,
    handleSave,
    PROFILE_TYPES,
    modelData,
    schemaBackend,
    errorData,
    isProfileSwitching,
    previousSelectedType,
    showSkeleton,
  };
};
