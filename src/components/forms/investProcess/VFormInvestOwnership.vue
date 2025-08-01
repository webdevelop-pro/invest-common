<script setup lang="ts">
import {
  computed, nextTick, defineAsyncComponent,
  hydrateOnVisible, useTemplateRef,
  ref,
} from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { useInvestmentsStore } from 'InvestCommon/store/useInvestments';
import { useUserProfilesStore } from 'InvestCommon/store/useUserProfiles';
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

const router = useRouter();
const route = useRoute();
const userProfilesStore = useUserProfilesStore();
const { isSetProfileByIdError } = storeToRefs(userProfilesStore);
const investmentsStore = useInvestmentsStore();
const useRepositoryProfilesStore = useRepositoryProfiles();
const { setProfileState, getProfileByIdOptionsState } = storeToRefs(useRepositoryProfilesStore);
const {
  setOwnershipData, isSetOwnershipLoading, isSetSignatureLoading, isSetOwnershipError,
} = storeToRefs(investmentsStore);
const profilesStore = useProfilesStore();
const { selectedUserProfileData, selectedUserProfileType, selectedUserProfileId } = storeToRefs(profilesStore);

const isAlertShow = computed(() => (selectedUserProfileData.value?.kyc_status !== InvestKycTypes.approved));
const isAlertText = computed(() => 'You need to pass KYC before you can make investment with this profile.');

const individualFormRef = useTemplateRef<FormChild>('individualFormChild');
const entityTypeFormRef = useTemplateRef<FormChild>('entityFormChild');
const sdiraTypeFormRef = useTemplateRef<FormChild>('sdiraFormChild');
const soloTypeFormRef = useTemplateRef<FormChild>('soloFormChild');
const trustTypeFormRef = useTemplateRef<FormChild>('trustFormChild');

const errorData = computed(() => setProfileState.value.error?.data?.responseJson);
const schemaBackend = computed(() => getProfileByIdOptionsState.value.data);

const childFormIsValid = computed(() => {
  if (selectedUserProfileType.value.toLowerCase() === PROFILE_TYPES.INDIVIDUAL) {
    return individualFormRef.value?.isValid;
  }
  if (selectedUserProfileType.value.toLowerCase() === PROFILE_TYPES.ENTITY) {
    return entityTypeFormRef.value?.isValid;
  }
  if (selectedUserProfileType.value.toLowerCase() === PROFILE_TYPES.SDIRA) {
    return sdiraTypeFormRef.value?.isValid;
  }
  if (selectedUserProfileType.value.toLowerCase() === PROFILE_TYPES.SOLO401K) {
    return soloTypeFormRef.value?.isValid;
  }
  if (selectedUserProfileType.value.toLowerCase() === PROFILE_TYPES.TRUST) {
    return trustTypeFormRef.value?.isValid;
  }
  return true;
});
const childFormModel = computed(() => {
  if (selectedUserProfileType.value.toLowerCase() === PROFILE_TYPES.INDIVIDUAL) {
    return individualFormRef.value?.model;
  }
  if (selectedUserProfileType.value.toLowerCase() === PROFILE_TYPES.ENTITY) {
    return entityTypeFormRef.value?.model;
  }
  if (selectedUserProfileType.value.toLowerCase() === PROFILE_TYPES.SDIRA) {
    return sdiraTypeFormRef.value?.model;
  }
  if (selectedUserProfileType.value.toLowerCase() === PROFILE_TYPES.SOLO401K) {
    return soloTypeFormRef.value?.model;
  }
  if (selectedUserProfileType.value.toLowerCase() === PROFILE_TYPES.TRUST) {
    return trustTypeFormRef.value?.model;
  }
  return {};
});
const onValidate = () => {
  if (selectedUserProfileType.value.toLowerCase() === PROFILE_TYPES.INDIVIDUAL) {
    individualFormRef.value?.onValidate();
  }
  if (selectedUserProfileType.value.toLowerCase() === PROFILE_TYPES.ENTITY) {
    entityTypeFormRef.value?.onValidate();
  }
  if (selectedUserProfileType.value.toLowerCase() === PROFILE_TYPES.SDIRA) {
    sdiraTypeFormRef.value?.onValidate();
  }
  if (selectedUserProfileType.value.toLowerCase() === PROFILE_TYPES.SOLO401K) {
    soloTypeFormRef.value?.onValidate();
  }
  if (selectedUserProfileType.value.toLowerCase() === PROFILE_TYPES.TRUST) {
    trustTypeFormRef.value?.onValidate();
  }
};

const isLoading = ref(false);
const isValid = computed(() => childFormIsValid.value);
const isDisabledButton = computed(() => (!isValid.value || isAlertShow.value));
const dataUserData = computed(() => selectedUserProfileData.value?.data);

const { slug, id, profileId } = route.params;

const continueHandler = async () => {
  const model = { ...childFormModel.value };
  onValidate();
  if (!isValid.value) {
    nextTick(() => scrollToError('VFormInvestProcessOwnership'));
    return;
  }

  isLoading.value = true;
  await userProfilesStore.setProfileById(
    model,
    selectedUserProfileType.value,
    selectedUserProfileId.value,
  );
  if (!isSetProfileByIdError.value) {
    await investmentsStore.setOwnership(slug as string, id as string, String(selectedUserProfileId.value));
  }

  if (isSetOwnershipError.value) return;
  userProfilesStore.getProfileById(selectedUserProfileType.value, selectedUserProfileId.value);
  if (setOwnershipData.value) {
    router.push({
      name: ROUTE_INVEST_SIGNATURE,
    });

    // submitFormToHubspot({
    //   email: userAccountData.value?.email,
    //   firstname: model.first_name,
    //   lastname: model.last_name,
    //   invest_middle_name: model.middle_name,
    //   date_of_birth: model.dob,
    //   phone: model.phone,
    //   invest_snn: model.ssn,
    //   invest_address_1: model.address1,
    //   invest_address_2: model.address2,
    //   city: model.city,
    //   state: model.state,
    //   zip_code: model.zip_code,
    //   country: model.country,
    // });
  }

  isLoading.value = false;
};

const onAlertButtonClick = () => {
  navigateWithQueryParams(urlProfileAccount(selectedUserProfileId.value));
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
          :loading="isSetOwnershipLoading || isSetSignatureLoading"
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
