import {
  ref, computed, nextTick,
  toRaw,
  watch,
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
import { useFormValidation } from 'InvestCommon/composable/useFormValidation';
import {
  firstNameRule, lastNameRule, relationshipTypeRule, phoneRule, emailRule, dobRule, errorMessageRule,
} from 'UiKit/helpers/validation/rules';
import { JSONSchemaType } from 'ajv/dist/types/json-schema';

export const useFormTrustedContact = defineStore('useFormTrustedContact', () => {
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
      text: 'Trusted Contact',
    },
  ]);

  const isLoading = ref(false);
  const isLoadingFields = computed(() => getProfileByIdOptionsState.value.loading);
  const { submitFormToHubspot } = useHubspotForm(env.HUBSPOT_FORM_ID_TRUSTED_CONTACT);

  const errorData = computed(() => setProfileByIdState.value.error);
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
      TrustedContact: {
        properties: {
          first_name: firstNameRule,
          last_name: lastNameRule,
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
          beneficiary: { type: 'object', $ref: '#/definitions/TrustedContact' },
        },
        type: 'object',
        errorMessage: errorMessageRule,
      },
    },
    $ref: '#/definitions/Individual',
  } as unknown as JSONSchemaType<FormModeTrustedContact>));

  const {
    model, validation, isValid, onValidate,
  } = useFormValidation<FormModeTrustedContact>(
    schemaFrontend,
    schemaBackend,
      {
        beneficiary: {},
      } as FormModeTrustedContact,
  );
  const isDisabledButton = computed(() => (!isValid.value));

  watch(() => selectedUserProfileData.value?.data?.beneficiary, () => {
    if (selectedUserProfileData.value?.data?.beneficiary) {
      model.beneficiary = selectedUserProfileData.value?.data?.beneficiary;
    }
  }, { deep: true, immediate: true });

  const handleSave = async () => {
    onValidate();
    if (!isValid.value || !model.beneficiary) {
      nextTick(() => scrollToError('ViewDashboardTrustedContact'));
      return;
    }

    isLoading.value = true;
    try {
      await useRepositoryProfilesStore.setProfileById(
        {
          beneficiary: model.beneficiary,
        },
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
  };
});

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useFormTrustedContact, import.meta.hot));
}
