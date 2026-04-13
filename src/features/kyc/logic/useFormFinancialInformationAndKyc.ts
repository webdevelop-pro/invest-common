import {
  ref, computed, toRaw, useTemplateRef,
} from 'vue';
import { storeToRefs } from 'pinia';
import { ROUTE_DASHBOARD_ACCOUNT } from 'InvestCommon/domain/config/enums/routes';
import { useProfilesStore } from 'InvestCommon/domain/profiles/store/useProfiles';
import type { RouteLocationRaw } from 'vue-router';
import { useRoute, useRouter } from 'vue-router';
import { useRepositoryProfiles } from 'InvestCommon/data/profiles/profiles.repository';
import { useSessionStore } from 'InvestCommon/domain/session/store/useSession';
import type { FormChild } from 'InvestCommon/types/form';
import { useRepositoryAccreditation } from 'InvestCommon/data/accreditation/accreditation.repository';
import { useRepositoryKyc } from 'InvestCommon/data/kyc/kyc.repository';
import { useKycFormValidation } from './useKycFormValidation';
import { useKycPostSubmitNavigation } from './useKycPostSubmitNavigation';
import { useKycSubmission } from './useKycSubmission';
import type {
  KycFormSectionRef,
} from './useKycFormWorkflow';
import {
  collectKycSectionModels,
  collectKycSubmissionFields,
} from './useKycFormWorkflow';

const resolveBackButtonRoute = (
  redirect: unknown,
  profileId: string | number,
): RouteLocationRaw => {
  if (typeof redirect === 'string' && redirect.length > 0) {
    return redirect;
  }

  return {
    name: ROUTE_DASHBOARD_ACCOUNT,
    params: { profileId },
  };
};

export const useFormFinancialInformationAndKyc = () => {
  const router = useRouter();
  const route = useRoute();
  const userProfileStore = useProfilesStore();
  const { selectedUserProfileId, selectedUserProfileType, selectedUserProfileData } = storeToRefs(userProfileStore);
  const repositoryProfiles = useRepositoryProfiles();
  const { setProfileByIdState, getProfileByIdOptionsState } = storeToRefs(repositoryProfiles);
  const userSessionStore = useSessionStore();
  const { userSessionTraits } = storeToRefs(userSessionStore);
  const repositoryKyc = useRepositoryKyc();
  const accreditationRepository = useRepositoryAccreditation();

  const backButtonText = ref('Go Back');
  const backButtonRoute = computed<RouteLocationRaw>(() => resolveBackButtonRoute(
    route.query.redirect,
    selectedUserProfileId.value,
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

  const personalFormRef = useTemplateRef<FormChild>('personalFormChild') as KycFormSectionRef;
  const financialInfoFormRef = useTemplateRef<FormChild>('financialInfoFormChild') as KycFormSectionRef;
  const investmentObjectivesFormRef = useTemplateRef<FormChild>('investmentObjectivesFormChild') as KycFormSectionRef;
  const understandingRisksFormRef = useTemplateRef<FormChild>('understandingRisksFormChild') as KycFormSectionRef;
  const formSections = [
    personalFormRef,
    financialInfoFormRef,
    investmentObjectivesFormRef,
    understandingRisksFormRef,
  ] as const;

  const isLoading = ref(false);
  const isLoadingFields = computed(() => getProfileByIdOptionsState.value.loading);
  const validation = useKycFormValidation(formSections);
  const { isValid } = validation;
  const isDisabledButton = computed(() => !isValid.value);
  const modelData = computed(() => selectedUserProfileData?.value?.data);
  const errorData = computed(() => setProfileByIdState.value.error?.data?.responseJson);
  const schemaBackend = computed(() => (
    getProfileByIdOptionsState.value.data ? structuredClone(toRaw(getProfileByIdOptionsState.value.data)) : {}
  ));

  const { submit } = useKycSubmission({
    getSelectedProfileType: () => selectedUserProfileType.value,
    getSelectedProfileId: () => selectedUserProfileId.value,
    getSelectedProfileData: () => selectedUserProfileData.value,
    getUserEmail: () => userSessionTraits.value?.email,
    saveProfile: (fields, type, id) => repositoryProfiles.setProfileById(fields, type, id),
    syncUserPhone: (phone) => repositoryProfiles.setUser({ phone }),
    refreshUser: () => repositoryProfiles.getUser(),
    launchKyc: (profileId) => repositoryKyc.handlePlaidKyc(profileId),
    createEscrow: (userId, profileId) => accreditationRepository.createEscrow(userId, profileId),
  });

  const { finishSubmission } = useKycPostSubmitNavigation({
    router,
    getBackButtonRoute: () => backButtonRoute.value,
    getProfileById: () => repositoryProfiles.getProfileById(
      selectedUserProfileType.value,
      selectedUserProfileId.value,
    ),
  });

  const handleSave = async () => {
    if (!validation.validateSections()) {
      return;
    }

    const sectionModels = collectKycSectionModels(
      personalFormRef,
      financialInfoFormRef,
      investmentObjectivesFormRef,
      understandingRisksFormRef,
    );
    const fields = collectKycSubmissionFields(sectionModels);

    let hubspotPromise: Promise<void> | null = null;
    isLoading.value = true;

    try {
      ({ hubspotPromise } = await submit(fields, sectionModels));
    } finally {
      isLoading.value = false;
    }

    await finishSubmission(hubspotPromise);
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
