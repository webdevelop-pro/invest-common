<script setup lang="ts">
import {
  ref, computed, useTemplateRef,
  nextTick,
  watch,
  defineAsyncComponent,
  hydrateOnVisible,
} from 'vue';
import { useUserProfilesStore } from 'InvestCommon/store/useUserProfiles';
import { useUsersStore } from 'InvestCommon/store/useUsers';
import { useHubspotForm } from 'InvestCommon/composable/useHubspotForm';
import VButton from 'UiKit/components/Base/VButton/VButton.vue';
import { storeToRefs } from 'pinia';
import { useRouter } from 'vue-router';
import { ROUTE_DASHBOARD_ACCOUNT } from 'InvestCommon/helpers/enums/routes';
import { FormChild } from 'InvestCommon/types/form';
import { scrollToError } from 'UiKit/helpers/validation/general';
import { PROFILE_TYPES } from 'InvestCommon/global/investment.json';
import { useAccreditationStore } from 'InvestCommon/store/useAccreditation';
import env from 'InvestCommon/global';

// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
const VFormPartialCreateProfileSelectType = defineAsyncComponent({
  loader: () => import('./VFormPartialCreateProfileSelectType.vue'),
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call
  hydrate: hydrateOnVisible(),
});
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

const selectTypeFormRef = useTemplateRef<FormChild>('selectTypeFormChild');
const entityTypeFormRef = useTemplateRef<FormChild>('entityFormChild');
const sdiraTypeFormRef = useTemplateRef<FormChild>('sdiraFormChild');
const soloTypeFormRef = useTemplateRef<FormChild>('soloFormChild');
const trustTypeFormRef = useTemplateRef<FormChild>('trustFormChild');

const router = useRouter();
const accreditationStore = useAccreditationStore();
const userIdentityStore = useUserProfilesStore();
const {
  isSetUserProfileLoading,
} = storeToRefs(userIdentityStore);
const usersStore = useUsersStore();
const { selectedUserProfileData, selectedUserProfileId, userAccountData } = storeToRefs(usersStore);
const userProfilesStore = useUserProfilesStore();
const { setProfileData, isSetUserProfileError } = storeToRefs(userProfilesStore);
const userStore = useUsersStore();

const selectedType = computed(() => String(selectTypeFormRef.value?.model?.type_profile));

const childFormIsValid = computed(() => {
  if (selectedType.value.toLowerCase() === PROFILE_TYPES.ENTITY) {
    return entityTypeFormRef.value?.isValid;
  }
  if (selectedType.value.toLowerCase() === PROFILE_TYPES.SDIRA) {
    return sdiraTypeFormRef.value?.isValid;
  }
  if (selectedType.value.toLowerCase() === PROFILE_TYPES.SOLO401K) {
    return soloTypeFormRef.value?.isValid;
  }
  if (selectedType.value.toLowerCase() === PROFILE_TYPES.TRUST) {
    return trustTypeFormRef.value?.isValid;
  }
  return true;
});
const childFormModel = computed(() => {
  if (selectedType.value.toLowerCase() === PROFILE_TYPES.ENTITY) {
    return entityTypeFormRef.value?.model;
  }
  if (selectedType.value.toLowerCase() === PROFILE_TYPES.SDIRA) {
    return sdiraTypeFormRef.value?.model;
  }
  if (selectedType.value.toLowerCase() === PROFILE_TYPES.SOLO401K) {
    return soloTypeFormRef.value?.model;
  }
  if (selectedType.value.toLowerCase() === PROFILE_TYPES.TRUST) {
    return trustTypeFormRef.value?.model;
  }
  return {};
});
const onValidate = () => {
  if (selectedType.value.toLowerCase() === PROFILE_TYPES.ENTITY) {
    entityTypeFormRef.value?.onValidate();
  }
  if (selectedType.value.toLowerCase() === PROFILE_TYPES.SDIRA) {
    sdiraTypeFormRef.value?.onValidate();
  }
  if (selectedType.value.toLowerCase() === PROFILE_TYPES.SOLO401K) {
    soloTypeFormRef.value?.onValidate();
  }
  if (selectedType.value.toLowerCase() === PROFILE_TYPES.TRUST) {
    trustTypeFormRef.value?.onValidate();
  }
};

const isLoading = ref(false);
const isValid = computed(() => (selectTypeFormRef.value?.isValid && childFormIsValid.value));
const isDisabledButton = computed(() => (!isValid.value || isSetUserProfileLoading.value));

const handleHubspot = () => {
  const model = { ...childFormModel.value };
  void useHubspotForm(env.HUBSPOT_FORM_ID_PERSONAL_INFORMATION).submitFormToHubspot({
    email: userAccountData.value?.email,
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
  void useHubspotForm(env.HUBSPOT_FORM_ID_IDENTIFICATION).submitFormToHubspot({
    email: userAccountData.value?.email,
    ...model.type_of_identification,
  });
  if (selectedType.value.toLowerCase() === PROFILE_TYPES.ENTITY) {
    void useHubspotForm(env.HUBSPOT_FORM_ID_ENTITY_INFORMATION).submitFormToHubspot({
      email: userAccountData.value?.email,
      type: model.type,
      name: model.name,
      owner_title: model.owner_title,
      solely_for_investing: model.solely_for_investing,
      tax_exempts: model.tax_exempts,
    });
    void useHubspotForm(env.HUBSPOT_FORM_ID_BUSINESS_CONTROLLER).submitFormToHubspot({
      email: userAccountData.value?.email,
      business_controller: model.business_controller,
    });
    void useHubspotForm(env.HUBSPOT_FORM_ID_BENEFICIAL_OWNERS).submitFormToHubspot({
      email: userAccountData.value?.email,
      beneficials: model.beneficials,
    });
  }
  if (selectedType.value.toLowerCase() === PROFILE_TYPES.TRUST) {
    void useHubspotForm(env.HUBSPOT_FORM_ID_TRUST_INFORMATION).submitFormToHubspot({
      email: userAccountData.value?.email,
      type: model.type,
      name: model.name,
      owner_title: model.owner_title,
      ein: model.ein,
    });
    void useHubspotForm(env.HUBSPOT_FORM_ID_BUSINESS_CONTROLLER).submitFormToHubspot({
      email: userAccountData.value?.email,
      business_controller: model.business_controller,
    });
    void useHubspotForm(env.HUBSPOT_FORM_ID_BENEFICIAL_OWNERS).submitFormToHubspot({
      email: userAccountData.value?.email,
      beneficials: model.beneficials,
    });
  }
  if (selectedType.value.toLowerCase() === PROFILE_TYPES.SDIRA) {
    void useHubspotForm(env.HUBSPOT_FORM_ID_CUSTODIAN).submitFormToHubspot({
      email: userAccountData.value?.email,
      custodian: model.type,
      account_number: model.account_number,
      full_account_name: model.full_account_name,
    });
  }
  if (selectedType.value.toLowerCase() === PROFILE_TYPES.SOLO401K) {
    void useHubspotForm(env.HUBSPOT_FORM_ID_PLAN_INFO).submitFormToHubspot({
      email: userAccountData.value?.email,
      name: model.name,
      ein: model.ein,
    });
  }
};

const saveHandler = async () => {
  const model = { ...childFormModel.value };
  onValidate();
  if (!isValid.value) {
    void nextTick(() => scrollToError('VFormCreateNewProfile'));
    return;
  }

  isLoading.value = true;

  await userProfilesStore.setProfile(
    model,
    selectedType.value,
  );

  if (!isSetUserProfileError.value) {
    handleHubspot();
    await accreditationStore.createEscrow(selectedUserProfileData.value?.user_id, setProfileData.value?.id);
    void userProfilesStore.getUser();
    userStore.setSelectedUserProfileById(Number(setProfileData.value?.id));
    void userProfilesStore.getProfileById(selectedType.value, String(setProfileData.value?.id));
    isLoading.value = false;
    void router.push({ name: ROUTE_DASHBOARD_ACCOUNT, params: { profileId: String(setProfileData.value?.id) } });
  }
  isLoading.value = false;
};

const cancelHandler = () => {
  void router.push({ name: ROUTE_DASHBOARD_ACCOUNT, params: { profileId: selectedUserProfileId.value } });
};

watch(() => selectedType.value, () => {
  void userIdentityStore.getProfileByIdOptions(selectedType.value, selectedUserProfileId.value);
});
</script>

<template>
  <div class="VFormCreateNewProfile v-form-create-new-profile">
    <div class="v-form-create-new-profile__header is--h1__title">
      Set Up Investment Account
    </div>
    <div class="v-form-create-new-profile__content">
      <VFormPartialCreateProfileSelectType
        ref="selectTypeFormChild"
        :model-data="selectedUserProfileData?.data"
      />
      <VFormProfileEntity
        v-if="selectedType === PROFILE_TYPES.ENTITY"
        ref="entityFormChild"
      />
      <VFormProfileSDIRA
        v-if="selectedType === PROFILE_TYPES.SDIRA"
        ref="sdiraFormChild"
      />
      <VFormProfileSolo
        v-if="selectedType === PROFILE_TYPES.SOLO401K"
        ref="soloFormChild"
      />
      <VFormProfileTrust
        v-if="selectedType === PROFILE_TYPES.TRUST"
        ref="trustFormChild"
      />
    </div>
    <div class="v-form-create-new-profile__footer">
      <VButton
        size="large"
        variant="outlined"
        @click="cancelHandler"
      >
        Cancel
      </VButton>
      <VButton
        size="large"
        :disabled="isDisabledButton"
        :loading="isLoading"
        data-testid="button"
        @click="saveHandler"
      >
        Save
      </VButton>
    </div>
  </div>
</template>

<style lang="scss">
.v-form-create-new-profile {
  display: flex;
  flex-direction: column;
  width: 100%;

  &__header {
    margin-bottom: 40px;
  }

  &__footer {
    display: flex;
    justify-content: flex-end;
    align-items: flex-start;
    gap: 12px;
    margin-top: 20px;
  }
}
</style>
