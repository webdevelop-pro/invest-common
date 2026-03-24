import {
  ref, computed, nextTick,
  toRaw, useTemplateRef,
} from 'vue';
import { storeToRefs } from 'pinia';
import { ROUTE_DASHBOARD_ACCOUNT } from 'InvestCommon/domain/config/enums/routes';
import { useProfilesStore } from 'InvestCommon/domain/profiles/store/useProfiles';
import { useRoute, useRouter } from 'vue-router';
import env from 'InvestCommon/config/env';
import { useHubspotForm } from 'UiKit/composables/useHubspotForm';
import { scrollToError } from 'UiKit/helpers/validation/general';
import { useRepositoryProfiles } from 'InvestCommon/data/profiles/profiles.repository';
import { useSessionStore } from 'InvestCommon/domain/session/store/useSession';
import { FormChild } from 'InvestCommon/types/form';
import { useRepositoryAccreditation } from 'InvestCommon/data/accreditation/accreditation.repository';
import { useRepositoryKyc } from 'InvestCommon/data/kyc/kyc.repository';
import { reportError } from 'InvestCommon/domain/error/errorReporting';

const runSaveStep = async (
  action: () => Promise<unknown>,
  fallbackMessage: string,
) => {
  try {
    await action();
    return true;
  } catch (error) {
    reportError(error, fallbackMessage);
    return false;
  }
};

export const useFormFinancialInformationAndKyc = () => {
  const router = useRouter();
  const route = useRoute();
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
  const backButtonRoute = computed(() => (
    route.query.redirect || {
      name: ROUTE_DASHBOARD_ACCOUNT,
      params: { profileId: selectedUserProfileId.value },
    }
  ));
  const breadcrumbs = computed(() => [
    {
      text: 'Dashboard',
      to: backButtonRoute.value,
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

  const hubspotHandle = async () => {
    await useHubspotForm(env.HUBSPOT_FORM_ID_FINANCIAL_SITUATION).submitFormToHubspot({
      email: userSessionTraits.value?.email,
      is_accredited: financialInfoFormRef.value?.model?.accredited_investor?.is_accredited,
    });
    await useHubspotForm(env.HUBSPOT_FORM_ID_RISKS).submitFormToHubspot({
      email: userSessionTraits.value?.email,
      ...understandingRisksFormRef.value?.model,
    });
    await useHubspotForm(env.HUBSPOT_FORM_ID_INVESTMENT_OBJECTIVES).submitFormToHubspot({
      email: userSessionTraits.value?.email,
      ...investmentObjectivesFormRef.value?.model,
    });
    await useHubspotForm(env.HUBSPOT_FORM_ID_PERSONAL_INFORMATION).submitFormToHubspot({
      email: userSessionTraits.value?.email,
      ...personalFormRef.value?.model,
      date_of_birth: personalFormRef.value?.model?.dob,
    });
  };

  const syncUserAfterSave = async (phone?: string) => {
    const isUserUpdated = await runSaveStep(
      () => useRepositoryProfilesStore.setUser({ phone }),
      'Failed to update user phone',
    );

    if (!isUserUpdated) {
      return false;
    }

    return runSaveStep(
      () => useRepositoryProfilesStore.getUser(),
      'Failed to refresh user',
    );
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
    let hubspotPromise: Promise<void> | null = null;

    isLoading.value = true;
    try {
      let canContinue = await runSaveStep(
        () => useRepositoryProfilesStore.setProfileById(
          {
            ...fields,
          },
          selectedUserProfileType.value,
          selectedUserProfileId.value,
        ),
        'Failed to save KYC and financial information',
      );

      if (canContinue && !setProfileByIdState.value.error) {
        hubspotPromise = hubspotHandle();
        void syncUserAfterSave(fields?.phone);
        canContinue = await runSaveStep(
          () => useRepositoryKycStore.handlePlaidKyc(selectedUserProfileId.value),
          'Failed to handle Plaid KYC',
        );
      }

      if (canContinue
        && !tokenState.value.error
        && !setProfileByIdState.value.error
        && selectedUserProfileData.value?.user_id
        && selectedUserProfileData.value?.id
        && !selectedUserProfileData.value?.escrow_id) {
        canContinue = await runSaveStep(
          () => accreditationRepository.createEscrow(
            selectedUserProfileData.value?.user_id,
            selectedUserProfileData.value?.id,
          ),
          'Failed to create escrow',
        );
      }
    } finally {
      isLoading.value = false;
    }

    await runSaveStep(
      () => useRepositoryProfilesStore.getProfileById(
        selectedUserProfileType.value,
        selectedUserProfileId.value,
      ),
      'Failed to refresh profile',
    );

    if (hubspotPromise) {
      await hubspotPromise;
    }

    await router.push(backButtonRoute.value);
  };

  return {
    backButtonText,
    backButtonRoute,
    breadcrumbs,
    isDisabledButton,
    isLoading,
    isLoadingFields,
    handleSave,
    modelData,
    schemaBackend,
    errorData,
  };
};
