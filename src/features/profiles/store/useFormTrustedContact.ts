import {
  ref, computed, nextTick,
  toRaw, watch,
} from 'vue';
import { storeToRefs } from 'pinia';
import { ROUTE_DASHBOARD_ACCOUNT } from 'InvestCommon/domain/config/enums/routes';
import { useProfilesStore } from 'InvestCommon/domain/profiles/store/useProfiles';
import { useRouter } from 'vue-router';
import env from 'InvestCommon/domain/config/env';
import { useHubspotForm } from 'UiKit/composables/useHubspotForm';
import { useRepositoryProfiles } from 'InvestCommon/data/profiles/profiles.repository';
import { useSessionStore } from 'InvestCommon/domain/session/store/useSession';
import { useFormValidation } from 'UiKit/helpers/validation/useFormValidation';
import {
  relationshipTypeRule, phoneRule, emailRule, dobRule, errorMessageRule,
} from 'UiKit/helpers/validation/rules';
import { JSONSchemaType } from 'ajv/dist/types/json-schema';

export const useFormTrustedContact = () => {
  const router = useRouter();
  const userProfileStore = useProfilesStore();
  const { selectedUserProfileId, selectedUserProfileType, selectedUserProfileData } = storeToRefs(userProfileStore);
  const useRepositoryProfilesStore = useRepositoryProfiles();
  const { setProfileByIdState, getProfileByIdOptionsState } = storeToRefs(useRepositoryProfilesStore);
  const userSessionStore = useSessionStore();
  const { userSessionTraits } = storeToRefs(userSessionStore);

  const backButtonText = ref('Back to Profile Details');
  const backButtonRoute = computed(() => ({
    name: ROUTE_DASHBOARD_ACCOUNT,
    params: { profileId: selectedUserProfileId.value }
  }));

  const breadcrumbs = computed(() => [
    { text: 'Dashboard', to: backButtonRoute.value },
    { text: 'Profile Details', to: backButtonRoute.value },
    { text: 'Trusted Contact' },
  ]);

  const isLoading = ref(false);
  const isLoadingFields = computed(() => getProfileByIdOptionsState.value.loading);
  const { submitFormToHubspot } = useHubspotForm(env.HUBSPOT_FORM_ID_TRUSTED_CONTACT);

  const errorData = computed(() => setProfileByIdState.value.error?.data?.responseJson);
  const schemaBackend = computed(() => (
    getProfileByIdOptionsState.value.data ? structuredClone(toRaw(getProfileByIdOptionsState.value.data)) : null));

  interface FormModeTrustedContact {
    beneficiary: {
      first_name: string;
      last_name: string;
      relationship_type: string;
      phone: string;
      email: string;
      dob: string;
    };
  }

  const schemaFrontend = computed(() => ({
    $schema: 'http://json-schema.org/draft-07/schema#',
    definitions: {
      PersonalInformation: {
        properties: {
          first_name: {},
          last_name: {},
          relationship_type: relationshipTypeRule,
          phone: phoneRule,
          email: emailRule,
          dob: dobRule,
        },
        type: 'object',
        additionalProperties: false,
        required: ['first_name', 'last_name', 'relationship_type', 'phone', 'email', 'dob'],
      },
      Individual: {
        properties: {
          beneficiary: { type: 'object', $ref: '#/definitions/PersonalInformation' },
        },
        type: 'object',
        errorMessage: errorMessageRule,
      },
    },
    $ref: '#/definitions/Individual',
  } as unknown as JSONSchemaType<FormModeTrustedContact>));


  const fieldsPaths = ['beneficiary.first_name', 'beneficiary.last_name', 'beneficiary.relationship_type', 'beneficiary.phone', 'beneficiary.email', 'beneficiary.dob'];

  const {
    model, validation, onValidate,
    formErrors, isFieldRequired, getErrorText,
    scrollToError, isValid
  } = useFormValidation<FormModeTrustedContact>(
    schemaFrontend,
    schemaBackend,
    { beneficiary: {} } as FormModeTrustedContact,
    fieldsPaths,
  );

  const isDisabledButton = computed(() => !isValid.value);

  // Simplified watch function
  watch(
    () => selectedUserProfileData.value?.data?.beneficiary,
    (beneficiaryData) => {
      if (beneficiaryData) {
        model.beneficiary = {
          first_name: beneficiaryData.first_name || '',
          last_name: beneficiaryData.last_name || '',
          relationship_type: beneficiaryData.relationship_type || '',
          phone: beneficiaryData.phone || '',
          email: beneficiaryData.email || '',
          dob: beneficiaryData.dob || '',
        };
      }
    },
    { immediate: true }
  );

  const handleSave = async () => {
    onValidate();
    if (!isValid.value || !model.beneficiary) {
      nextTick(() => scrollToError('ViewDashboardTrustedContact'));
      return;
    }

    isLoading.value = true;
    try {
      await useRepositoryProfilesStore.setProfileById(
        { beneficiary: model.beneficiary },
        selectedUserProfileType.value,
        selectedUserProfileId.value,
      );
      submitFormToHubspot({
        email: userSessionTraits.value?.email,
        firstname: model.beneficiary.first_name,
        lastname: model.beneficiary.last_name,
        relationship_type: model.beneficiary.relationship_type,
        phone: model.beneficiary.phone,
        trusted_email: model.beneficiary.email,
        date_of_birth: model.beneficiary.dob,
      });
      useRepositoryProfilesStore.getProfileById(selectedUserProfileType.value, selectedUserProfileId.value);
      isLoading.value = false;
      router.push({ name: ROUTE_DASHBOARD_ACCOUNT, params: { profileId: selectedUserProfileId.value } });
    } finally {
      isLoading.value = false;
    }
  };

  return {
    backButtonText,
    backButtonRoute,
    breadcrumbs,
    isDisabledButton,
    isLoading,
    isLoadingFields,
    handleSave,
    model,
    schemaBackend,
    schemaFrontend,
    errorData,
    validation,
    formErrors,
    isFieldRequired,
    getErrorText,
  };
};

