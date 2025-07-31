import {
  ref, computed, useTemplateRef,
  nextTick,
} from 'vue';
import { storeToRefs } from 'pinia';
import { ROUTE_DASHBOARD_ACCOUNT } from 'InvestCommon/helpers/enums/routes';
import { useProfilesStore } from 'InvestCommon/domain/profiles/store/useProfiles';
import { useRouter } from 'vue-router';
import { FormChild } from 'InvestCommon/types/form';
import env from 'InvestCommon/global';
import { useHubspotForm } from 'InvestCommon/composable/useHubspotForm';
import { scrollToError } from 'UiKit/helpers/validation/general';
import { useRepositoryProfiles } from 'InvestCommon/data/profiles/profiles.repository';
import { useSessionStore } from 'InvestCommon/domain/session/store/useSession';

export const useFormFinancialInformation = () => {
  const router = useRouter();
  const userProfileStore = useProfilesStore();
  const { selectedUserProfileId, selectedUserProfileType, selectedUserProfileData } = storeToRefs(userProfileStore);
  const useRepositoryProfilesStore = useRepositoryProfiles();
  const { setProfileByIdState, getProfileByIdOptionsState } = storeToRefs(useRepositoryProfilesStore);
  const userSessionStore = useSessionStore();
  const { userSessionTraits } = storeToRefs(userSessionStore);

  const backButtonText = ref('Back to Profile Details');
  const accountRoute = computed(() => (
    { name: ROUTE_DASHBOARD_ACCOUNT, params: { profileId: selectedUserProfileId.value } }));
  const breadcrumbs = computed(() => [
    {
      text: 'Dashboard',
      to: accountRoute.value,
    },
    {
      text: 'Profile Details',
      to: accountRoute.value,
    },
    {
      text: 'Financial and Investment Information',
    },
  ]);

  const isLoading = ref(false);

  const financialInfoFormRef = useTemplateRef<FormChild>('financialInfoFormChild');
  const investmentObjectivesFormRef = useTemplateRef<FormChild>('investmentObjectivesFormChild');
  const understandingRisksFormRef = useTemplateRef<FormChild>('understandingRisksFormChild');

  const isValid = computed(() => (financialInfoFormRef.value?.isValid
    && investmentObjectivesFormRef.value?.isValid && understandingRisksFormRef.value?.isValid));
  const isDisabledButton = computed(() => !isValid.value);
  const modelData = computed(() => selectedUserProfileData?.value?.data);

  const errorData = computed(() => setProfileByIdState.value.error?.data?.responseJson);
  const schemaBackend = computed(() => getProfileByIdOptionsState.value.data);

  const handleSave = async () => {
    financialInfoFormRef.value?.onValidate();
    investmentObjectivesFormRef.value?.onValidate();
    understandingRisksFormRef.value?.onValidate();

    if (!isValid.value) {
      nextTick(() => scrollToError('ViewDashboardFinancialInformation'));
      return;
    }

    isLoading.value = true;
    const modelLocal = {
      ...financialInfoFormRef.value?.model,
      ...investmentObjectivesFormRef.value?.model,
      ...understandingRisksFormRef.value?.model,
    };
    const { consent_plaid, ...fields } = modelLocal;
    try {
      await useRepositoryProfilesStore.setProfileById(
        {
          ...fields,
        },
        selectedUserProfileType.value,
        selectedUserProfileId.value,
      );
      isLoading.value = false;
      useHubspotForm(env.HUBSPOT_FORM_ID_FINANCIAL_SITUATION).submitFormToHubspot({
        email: userSessionTraits.value?.email,
        is_accredited: financialInfoFormRef.value?.model.accredited_investor.is_accredited,
      });
      useHubspotForm(env.HUBSPOT_FORM_ID_RISKS).submitFormToHubspot({
        email: userSessionTraits.value?.email,
        ...understandingRisksFormRef.value?.model,
      });
      useHubspotForm(env.HUBSPOT_FORM_ID_INVESTMENT_OBJECTIVES).submitFormToHubspot({
        email: userSessionTraits.value?.email,
        ...investmentObjectivesFormRef.value?.model,
      });
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
    handleSave,
    modelData,
    schemaBackend,
    errorData,
  };
};
