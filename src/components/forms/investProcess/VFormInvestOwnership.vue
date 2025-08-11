<script setup lang="ts">
import {
  computed, nextTick, defineAsyncComponent,
  hydrateOnVisible, useTemplateRef,
  ref,
} from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { useProfilesStore } from 'InvestCommon/domain/profiles/store/useProfiles';
import { ROUTE_INVEST_SIGNATURE, ROUTE_INVEST_AMOUNT } from 'InvestCommon/helpers/enums/routes';
import FormRow from 'UiKit/components/Base/VForm/VFormRow.vue';
import FormCol from 'UiKit/components/Base/VForm/VFormCol.vue';
import VButton from 'UiKit/components/Base/VButton/VButton.vue';
import { storeToRefs } from 'pinia';
import { navigateWithQueryParams } from 'InvestCommon/helpers/general';
import arrowLeft from 'UiKit/assets/images/arrow-left.svg';
import { scrollToError } from 'UiKit/helpers/validation/general';
import { urlOfferSingle, urlProfileAccount } from 'InvestCommon/global/links';
import VProfileSelectList from 'InvestCommon/features/profiles/VProfileSelectList.vue';
import { InvestKycTypes } from 'InvestCommon/types/api/invest';
import { PROFILE_TYPES } from 'InvestCommon/global/investment.json';
import { FormChild } from 'InvestCommon/types/form';
import { useRepositoryProfiles } from 'InvestCommon/data/profiles/profiles.repository';
import { useRepositoryInvestment } from 'InvestCommon/data/investment/investment.repository';

// Async components
const VFormProfileEntity = defineAsyncComponent({
  loader: () => import('InvestCommon/features/profiles/components/VFormProfileEntity.vue'),
  hydrate: hydrateOnVisible(),
});
const VFormProfileSDIRA = defineAsyncComponent({
  loader: () => import('InvestCommon/features/profiles/components/VFormProfileSDIRA.vue'),
  hydrate: hydrateOnVisible(),
});
const VFormProfileSolo = defineAsyncComponent({
  loader: () => import('InvestCommon/features/profiles/components/VFormProfileSolo.vue'),
  hydrate: hydrateOnVisible(),
});
const VFormProfileTrust = defineAsyncComponent({
  loader: () => import('InvestCommon/features/profiles/components/VFormProfileTrust.vue'),
  hydrate: hydrateOnVisible(),
});
const VFormPartialPersonalInformation = defineAsyncComponent({
  loader: () => import('InvestCommon/components/forms/VFormPartialPersonalInformation.vue'),
  hydrate: hydrateOnVisible(),
});
const VAlert = defineAsyncComponent({
  loader: () => import('UiKit/components/VAlert.vue'),
  hydrate: hydrateOnVisible(),
});

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
const dataUserData = computed(() => selectedUserProfileData.value?.data);

// Route params with type safety
const slug = route.params.slug as string;
const id = route.params.id as string;
const profileId = route.params.profileId as string;

// State
const isLoading = ref(false);

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

  isLoading.value = true;
  
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
    isLoading.value = false;
  }
};

const onAlertButtonClick = () => {
  if (selectedUserProfileId.value) {
    navigateWithQueryParams(urlProfileAccount(selectedUserProfileId.value));
  }
};
</script>

<template>
  <div class="VFormInvestProcessOwnership invest-form-ownership-wrap">
    <FormRow>
      <FormCol>
        <VProfileSelectList
          label="Investment Profile"
        />
      </FormCol>
    </FormRow>
    
    <FormRow v-if="isAlertShow">
      <FormCol>
        <VAlert
          v-if="isAlertShow"
          variant="error"
          data-testid="funding-alert"
          class="dashboard-wallet__alert"
          button-text="Go to account page"
          @click="onAlertButtonClick"
        >
          <template #title>
            Identity verification is needed.
          </template>
          <template #description>
            <span v-html="isAlertText" />
          </template>
        </VAlert>
      </FormCol>
    </FormRow>
    
    <template v-else>
      <!-- Individual Profile Form -->
      <template v-if="selectedUserProfileType === PROFILE_TYPES.INDIVIDUAL">
        <div class="invest-form-ownership__subtitle is--h3__title">
          Personal Information
        </div>
        <VFormPartialPersonalInformation
          ref="individualFormChild"
          :model-data="dataUserData"
          :loading="isLoading"
          :schema-backend="schemaBackend"
          :error-data="errorData"
        />
      </template>
      
      <!-- Other Profile Forms -->
      <VFormProfileEntity
        v-if="selectedUserProfileType === PROFILE_TYPES.ENTITY"
        ref="entityFormChild"
        :model-data="dataUserData"
        :loading="isLoading"
        :schema-backend="schemaBackend"
        :error-data="errorData"
      />
      <VFormProfileSDIRA
        v-if="selectedUserProfileType === PROFILE_TYPES.SDIRA"
        ref="sdiraFormChild"
        :model-data="dataUserData"
        :loading="isLoading"
        :schema-backend="schemaBackend"
        :error-data="errorData"
      />
      <VFormProfileSolo
        v-if="selectedUserProfileType === PROFILE_TYPES.SOLO401K"
        ref="soloFormChild"
        :model-data="dataUserData"
        :loading="isLoading"
        :schema-backend="schemaBackend"
        :error-data="errorData"
      />
      <VFormProfileTrust
        v-if="selectedUserProfileType === PROFILE_TYPES.TRUST"
        ref="trustFormChild"
        :model-data="dataUserData"
        :loading="isLoading"
        :schema-backend="schemaBackend"
        :error-data="errorData"
      />
    </template>

    <div class="invest-form-ownership__footer">
      <VButton
        variant="link"
        size="large"
        as="router-link"
        :to="{ name: ROUTE_INVEST_AMOUNT, params: { slug, id, profileId } }"
      >
        <arrowLeft
          alt="arrow left"
          class="invest-form-funding__back-icon"
        />
        Back
      </VButton>
      <div class="invest-form-ownership__btn">
        <VButton
          variant="outlined"
          size="large"
          as="a"
          :href="urlOfferSingle(slug)"
        >
          Cancel
        </VButton>
        <VButton
          :disabled="isDisabledButton"
          :loading="setOwnershipState.loading"
          size="large"
          data-testid="button"
          @click="continueHandler"
        >
          Continue
        </VButton>
      </div>
    </div>
  </div>
</template>

<style lang="scss">
@use 'UiKit/styles/_variables.scss' as *;
.invest-form-ownership {
  &__btn {
    display: flex;
    justify-content: flex-end;
    gap: 12px;

    @media screen and (max-width: $tablet){
      flex-direction: column;
    }
  }

  &__footer {
    margin-top: 20px;
    display: flex;
    justify-content: space-between;

    @media screen and (max-width: $tablet){
      flex-direction: column;
      gap: 12px;
    }
  }

  &__back-icon {
    width: 20px;
  }

  &__subtitle {
    margin-bottom: 20px;
    margin-top: 12px;
  }
}
</style>
