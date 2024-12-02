<script setup lang="ts">
import {
  computed, nextTick, defineAsyncComponent,
  hydrateOnVisible, useTemplateRef,
} from 'vue';
import { useRouter, useRoute } from 'vue-router';
import {
  useInvestmentsStore, useUserProfilesStore, useUsersStore,
} from 'InvestCommon/store';
import { useHubspotForm } from 'InvestCommon/composable';
import { ROUTE_INVEST_SIGNATURE, ROUTE_INVEST_AMOUNT } from 'InvestCommon/helpers/enums/routes';
import FormRow from 'InvestCommon/components/VForm/VFormRow.vue';
import FormCol from 'InvestCommon/components/VForm/VFormCol.vue';
import VButton from 'UiKit/components/VButton/VButton.vue';
import { storeToRefs } from 'pinia';
import { navigateWithQueryParams } from 'InvestCommon/helpers/general';
import { VSvgIcon } from 'UiKit/components/VSvgIcon';
import { scrollToError } from 'UiKit/helpers/validation/general';
import { urlOfferSingle, urlProfileAccount } from 'InvestCommon/global/links';
import VProfileSelectList from 'InvestCommon/components/VProfileSelectList.vue';
import { InvestKycTypes } from 'InvestCommon/types/api/invest';
import { PROFILE_TYPES } from 'InvestCommon/global/investment.json';
import { FormChild } from 'InvestCommon/types/form';


// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
const VFormProfileEntity = defineAsyncComponent({
  loader: () => import('./VFormProfileEntity.vue'),
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call
  hydrate: hydrateOnVisible(),
});
// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
const VFormProfileSDIRA = defineAsyncComponent({
  loader: () => import('./VFormProfileSDIRA.vue'),
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call
  hydrate: hydrateOnVisible(),
});
// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
const VFormProfileSolo = defineAsyncComponent({
  loader: () => import('./VFormProfileSolo.vue'),
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call
  hydrate: hydrateOnVisible(),
});
// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
const VFormProfileTrust = defineAsyncComponent({
  loader: () => import('./VFormProfileTrust.vue'),
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call
  hydrate: hydrateOnVisible(),
});
// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
const VFormPartialPersonalInformation = defineAsyncComponent({
  loader: () => import('./VFormPartialPersonalInformation.vue'),
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call
  hydrate: hydrateOnVisible(),
});
// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
const VNotificationInline = defineAsyncComponent({
  loader: () => import('UiKit/components/VNotificationInline/VNotificationInline.vue'),
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call
  hydrate: hydrateOnVisible(),
});

const router = useRouter();
const route = useRoute();
const userProfilesStore = useUserProfilesStore();
const { isSetProfileByIdError } = storeToRefs(userProfilesStore);
const { submitFormToHubspot } = useHubspotForm('df0f5fa3-5789-475c-b364-b189a8319446');
const investmentsStore = useInvestmentsStore();
const {
  setOwnershipData, isSetOwnershipLoading, isSetSignatureLoading, isSetOwnershipError,
} = storeToRefs(investmentsStore);
const usersStore = useUsersStore();
const {
  selectedUserProfileData, selectedUserProfileType,
  selectedUserProfileId,
} = storeToRefs(usersStore);


const isAlertShow = computed(() => (selectedUserProfileData.value?.kyc_status !== InvestKycTypes.approved));
const isAlertText = computed(() => 'You need to pass KYC before you can make investment with this profile.');

const individualFormRef = useTemplateRef<FormChild>('individualFormChild');
const entityTypeFormRef = useTemplateRef<FormChild>('entityFormChild');
const sdiraTypeFormRef = useTemplateRef<FormChild>('sdiraFormChild');
const soloTypeFormRef = useTemplateRef<FormChild>('soloFormChild');
const trustTypeFormRef = useTemplateRef<FormChild>('trustFormChild');

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

const isValid = computed(() => childFormIsValid.value);
const isDisabledButton = computed(() => (!isValid.value || isAlertShow.value));
const dataUserData = computed(() => selectedUserProfileData.value?.data);

const { slug, id, profileId } = route.params;


const continueHandler = async () => {
  const model = { ...childFormModel.value };
  onValidate();
  if (!isValid.value) {
    void nextTick(() => scrollToError('VFormInvestProcessOwnership'));
    return;
  }

  await userProfilesStore.setProfileById(
    model,
    selectedUserProfileType.value,
    selectedUserProfileId.value,
  );
  if (!isSetProfileByIdError.value) {
    await investmentsStore.setOwnership(slug as string, id as string, String(selectedUserProfileId.value));
  }

  if (isSetOwnershipError.value) return;
  void userProfilesStore.getProfileById(selectedUserProfileType.value, selectedUserProfileId.value);
  if (setOwnershipData.value) {
    void router.push({
      name: ROUTE_INVEST_SIGNATURE,
    });

    // void submitFormToHubspot({
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
};

const onAlertButtonClick = () => {
  navigateWithQueryParams(urlProfileAccount(selectedUserProfileId.value));
};
</script>

<template>
  <div class="VFormInvestProcessOwnership invest-form-ownership-wrap">
    <FormRow>
      <FormCol>
        <VProfileSelectList />
      </FormCol>
    </FormRow>
    <FormRow v-if="isAlertShow">
      <FormCol>
        <VNotificationInline
          type="error"
          icon
          data-testid="funding-alert"
          class="dashboard-wallet__alert"
          :show="isAlertShow"
          button-text="Go to account page"
          @click="onAlertButtonClick"
        >
          <template #title>
            Identity verification is needed.
          </template>
          <span v-html="isAlertText" />
        </VNotificationInline>
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
        />
      </template>
      <VFormProfileEntity
        v-if="selectedUserProfileType === PROFILE_TYPES.ENTITY"
        ref="entityFormChild"
        :model-data="dataUserData"
      />
      <VFormProfileSDIRA
        v-if="selectedUserProfileType === PROFILE_TYPES.SDIRA"
        ref="sdiraFormChild"
        :model-data="dataUserData"
      />
      <VFormProfileSolo
        v-if="selectedUserProfileType === PROFILE_TYPES.SOLO401K"
        ref="soloFormChild"
        :model-data="dataUserData"
      />
      <VFormProfileTrust
        v-if="selectedUserProfileType === PROFILE_TYPES.TRUST"
        ref="trustFormChild"
        :model-data="dataUserData"
      />
    </template>

    <div class="invest-form-ownership__footer">
      <VButton
        variant="link"
        size="large"
        icon-placement="left"
        tag="router-link"
        :to="{ name: ROUTE_INVEST_AMOUNT, params: { slug, id, profileId } }"
      >
        <VSvgIcon
          name="arrow-left"
          alt="arrow left"
          class="invest-form-funding__back-icon"
        />
        Back
      </VButton>
      <div class="invest-form-ownership__btn">
        <VButton
          variant="outlined"
          size="large"
          tag="a"
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
.invest-form-ownership {
  &__btn {
    display: flex;
    justify-content: flex-end;
    gap: 12px;
  }

  &__footer {
    margin-top: 20px;
    display: flex;
    justify-content: space-between;
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
