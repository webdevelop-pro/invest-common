import {
  ref, computed, useTemplateRef,
  nextTick, watch,
} from 'vue';
import { acceptHMRUpdate, defineStore, storeToRefs } from 'pinia';
import { useHubspotForm } from 'InvestCommon/composable/useHubspotForm';
import { useRouter } from 'vue-router';
import { ROUTE_DASHBOARD_ACCOUNT } from 'InvestCommon/helpers/enums/routes';
import { FormChild } from 'InvestCommon/types/form';
import { scrollToError } from 'UiKit/helpers/validation/general';
import { PROFILE_TYPES as profileTypes } from 'InvestCommon/global/investment.json';
import env from 'InvestCommon/global';
import { useRepositoryProfiles } from 'InvestCommon/data/profiles/profiles.repository';
import { useSessionStore } from 'InvestCommon/domain/session/store/useSession';
import { useRepositoryAccreditation } from 'InvestCommon/data/accreditation/accreditation.repository';
import { useProfilesStore } from 'InvestCommon/domain/profiles/store/useProfiles';

export const useFormCreateNewProfile = defineStore('useFormCreateNewProfile', () => {
  const router = useRouter();
  const userProfileStore = useProfilesStore();
  const { selectedUserProfileId, selectedUserProfileData, selectedUserIndividualProfile } = storeToRefs(userProfileStore);
  const useRepositoryProfilesStore = useRepositoryProfiles();
  const { setProfileState, getProfileByIdOptionsState, setProfileByIdState } = storeToRefs(useRepositoryProfilesStore);
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
  const errorData = computed(() => setProfileState.value.error);
  const schemaBackend = computed(() => getProfileByIdOptionsState.value.data);

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
  const isCreateEscrowForProfile = computed(() => (
    (selectedType.value.toLowerCase() === profileTypes.ENTITY) || (selectedType.value.toLowerCase() === profileTypes.TRUST)));
  const isCheckIndividualEscrow = computed(() => (
    (selectedType.value.toLowerCase() === profileTypes.SDIRA) || (selectedType.value.toLowerCase() === profileTypes.SOLO401K)));

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
    useHubspotForm(env.HUBSPOT_FORM_ID_IDENTIFICATION).submitFormToHubspot({
      email: userSessionTraits.value?.email,
      ...model.type_of_identification,
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
      useRepositoryProfilesStore.getUser();
      userProfileStore.setSelectedUserProfileById(Number(setProfileState.value.data?.id));
      useRepositoryProfilesStore.getProfileById(selectedType.value, String(setProfileState.value.data?.id));
      isLoading.value = false;
      router.push({ name: ROUTE_DASHBOARD_ACCOUNT, params: { profileId: String(setProfileState.value.data?.id) } });
    }
  };

  const handlerCheckIndividualEscrow = async () => {
    const model = { ...childFormModel.value };
    if (!isIndividualEscrow.value) {
      await useRepositoryProfilesStore.setProfileById(
        personalFormModel.value,
        selectedUserIndividualProfile.value?.type,
        selectedUserProfileId.value,
      );
      if (!setProfileByIdState.value.error) {
        await accreditationRepository.createEscrow(
          selectedUserProfileData.value?.user_id,
          selectedUserIndividualProfile.value?.id,
        );
        useHubspotForm(env.HUBSPOT_FORM_ID_PERSONAL_INFORMATION).submitFormToHubspot({
          email: userSessionTraits.value?.email,
          ...model,
          date_of_birth: model?.dob,
        });
      }
    }
    if (!accreditationRepository.createEscrowState.value.error) {
      await useRepositoryProfilesStore.setProfile(
        model,
        selectedType.value,
      );
    }

    if (!setProfileState.value.error) {
      handleHubspot();
      useRepositoryProfilesStore.getUser();
      userProfileStore.setSelectedUserProfileById(Number(setProfileState.value.data?.id));
      useRepositoryProfilesStore.getProfileById(selectedType.value, String(setProfileState.value.data?.id));
      isLoading.value = false;
      router.push({ name: ROUTE_DASHBOARD_ACCOUNT, params: { profileId: String(setProfileState.value.data?.id) } });
    }
  };

  const handleSave = async () => {
    const model = { ...childFormModel.value };
    onValidate();
    if (!isValid.value) {
      nextTick(() => scrollToError('ViewCreateNewProfile'));
      return;
    }

    isLoading.value = true;

    try {
      if (isCreateEscrowForProfile.value) {
        handlerCreateEscrow();
      } else if (isCheckIndividualEscrow.value) {
        handlerCheckIndividualEscrow();
      }
    } finally {
      isLoading.value = false;
    }
  };

  watch(() => selectedType.value, () => {
    if (selectedType.value && selectedType.value.length > 0 && selectedType.value !== 'undefined') {
      useRepositoryProfilesStore.getProfileByIdOptions(selectedType.value, selectedUserProfileId.value);
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
  };
});

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useFormCreateNewProfile, import.meta.hot));
}
