import {
  ref, computed, nextTick,
  toRaw, useTemplateRef,
} from 'vue';
import { acceptHMRUpdate, defineStore, storeToRefs } from 'pinia';
import { ROUTE_DASHBOARD_ACCOUNT } from 'InvestCommon/helpers/enums/routes';
import { useProfilesStore } from 'InvestCommon/domain/profiles/store/useProfiles';
import { useRouter } from 'vue-router';
import env from 'InvestCommon/global';
import { useHubspotForm } from 'InvestCommon/composable/useHubspotForm';
import { scrollToError } from 'UiKit/helpers/validation/general';
import { useRepositoryProfiles } from 'InvestCommon/data/profiles/profiles.repository';
import { useSessionStore } from 'InvestCommon/domain/session/store/useSession';
import { FormChild } from 'InvestCommon/types/form';
import { useRepositoryAccreditation } from 'InvestCommon/data/accreditation/accreditation.repository';
import { useRepositoryKyc } from 'InvestCommon/data/kyc/kyc.repository';

export const useFormFinancialInformationAndKyc = defineStore('useFormFinancialInformationAndKyc', () => {
  const router = useRouter();
  const userProfileStore = useProfilesStore();
  const { selectedUserProfileId, selectedUserProfileType, selectedUserProfileData } = storeToRefs(userProfileStore);
  const useRepositoryProfilesStore = useRepositoryProfiles();
  const { setProfileByIdState, getProfileByIdOptionsState } = storeToRefs(useRepositoryProfilesStore);
  const userSessionStore = useSessionStore();
  const { userSessionTraits } = storeToRefs(userSessionStore);
  const useRepositoryKycStore = useRepositoryKyc();
  const { tokenState } = storeToRefs(useRepositoryKycStore);
  const accreditationRepository = useRepositoryAccreditation();

  const backButtonText = ref('Go Back');
  const breadcrumbs = computed(() => [
    {
      text: 'Dashboard',
      to: { name: ROUTE_DASHBOARD_ACCOUNT, params: { profileId: selectedUserProfileId.value } },
    },
    {
      text: 'Identity Verification (KYC)',
    },
  ]);

  const personalFormRef = useTemplateRef<FormChild>('personalFormChild');
  const financialInfoFormRef = useTemplateRef<FormChild>('financialInfoFormChild');
  const investmentObjectivesFormRef = useTemplateRef<FormChild>('investmentObjectivesFormChild');
  const understandingRisksFormRef = useTemplateRef<FormChild>('understandingRisksFormChild');

  const isLoading = ref(false);
  const isLoadingFields = computed(() => getProfileByIdOptionsState.value.loading);

  const isValid = computed(() => (personalFormRef.value?.isValid && financialInfoFormRef.value?.isValid
  && investmentObjectivesFormRef.value?.isValid && understandingRisksFormRef.value?.isValid));
  const isDisabledButton = computed(() => !isValid.value);
  const modelData = computed(() => selectedUserProfileData?.value?.data);

  const errorData = computed(() => setProfileByIdState.value.error?.data?.responseJson);
  const schemaBackend = computed(() => (
    getProfileByIdOptionsState.value.data ? structuredClone(toRaw(getProfileByIdOptionsState.value.data)) : {}));

  const hubspotHandle = () => {
    useHubspotForm(env.HUBSPOT_FORM_ID_FINANCIAL_SITUATION).submitFormToHubspot({
      email: userSessionTraits.value?.email,
      is_accredited: financialInfoFormRef.value?.model?.accredited_investor?.is_accredited,
    });
    useHubspotForm(env.HUBSPOT_FORM_ID_RISKS).submitFormToHubspot({
      email: userSessionTraits.value?.email,
      ...understandingRisksFormRef.value?.model,
    });
    useHubspotForm(env.HUBSPOT_FORM_ID_INVESTMENT_OBJECTIVES).submitFormToHubspot({
      email: userSessionTraits.value?.email,
      ...investmentObjectivesFormRef.value?.model,
    });
    useHubspotForm(env.HUBSPOT_FORM_ID_PERSONAL_INFORMATION).submitFormToHubspot({
      email: userSessionTraits.value?.email,
      ...personalFormRef.value?.model,
      date_of_birth: personalFormRef.value?.model?.dob,
    });
  };

  const handleSave = async () => {
    personalFormRef.value?.onValidate();
    financialInfoFormRef.value?.onValidate();
    investmentObjectivesFormRef.value?.onValidate();
    understandingRisksFormRef.value?.onValidate();

    if (!isValid.value) {
      nextTick(() => scrollToError('ViewKYC'));
      return;
    }

    const modelLocal = {
      ...personalFormRef.value?.model,
      ...financialInfoFormRef.value?.model,
      ...investmentObjectivesFormRef.value?.model,
      ...understandingRisksFormRef.value?.model,
    };

    const { consent_plaid, ...fields } = modelLocal;

    isLoading.value = true;
    try {
      await useRepositoryProfilesStore.setProfileById(
        {
          ...fields,
        },
        selectedUserProfileType.value,
        selectedUserProfileId.value,
      );
      if (!setProfileByIdState.value.error) await useRepositoryKycStore.handlePlaidKyc();
      if (!tokenState.value.error && !setProfileByIdState.value.error
    && selectedUserProfileData.value?.user_id && selectedUserProfileData.value?.id
    && !selectedUserProfileData.value?.escrow_id) {
        await accreditationRepository.createEscrow(selectedUserProfileData.value?.user_id, selectedUserProfileData.value?.id);
      }
      isLoading.value = false;
      if (!setProfileByIdState.value.error) hubspotHandle();
      useRepositoryProfilesStore.getProfileById(selectedUserProfileType.value, selectedUserProfileId.value);
      router.push({ name: ROUTE_DASHBOARD_ACCOUNT, params: { profileId: selectedUserProfileId.value } });
    } finally {
      isLoading.value = false;
    }
  };

  return {
    backButtonText,
    breadcrumbs,
    isDisabledButton,
    isLoading,
    isLoadingFields,
    handleSave,
    modelData,
    schemaBackend,
    errorData,
  };
});

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useFormFinancialInformationAndKyc, import.meta.hot));
}
