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
import VButton from 'UiKit/components/VButton/VButton.vue';
import { storeToRefs } from 'pinia';
import { useRouter } from 'vue-router';
import { ROUTE_DASHBOARD_ACCOUNT } from 'InvestCommon/helpers/enums/routes';
import { FormChild } from 'InvestCommon/types/form';
import { scrollToError } from 'UiKit/helpers/validation/general';
import { PROFILE_TYPES } from 'InvestCommon/global/investment.json';
import { useAccreditationStore } from 'InvestCommon/store/useAccreditation';

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

const props = defineProps({
  hubsportFormId: {
    type: String,
    required: true,
  },
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

const { submitFormToHubspot } = useHubspotForm(props.hubsportFormId);

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

  if (!isSetUserProfileError.value && selectedUserProfileData.value?.user_id && setProfileData.value?.id
    && !selectedUserProfileData.value?.escrow_id) {
    await accreditationStore.createEscrow(selectedUserProfileData.value?.user_id, setProfileData.value?.id);
  }
  isLoading.value = false;
  if (!isSetUserProfileError.value) {
    void userProfilesStore.getUser();
    userStore.setSelectedUserProfileById(Number(setProfileData.value?.id));
    void userProfilesStore.getProfileById(selectedType.value, String(setProfileData.value?.id));
    void router.push({ name: ROUTE_DASHBOARD_ACCOUNT, params: { profileId: String(setProfileData.value?.id) } });
    // void submitFormToHubspot({
    //   email: userAccountData.value?.email,
    //   ...model,
    // });
  }
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
