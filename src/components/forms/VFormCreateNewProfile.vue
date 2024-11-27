<script setup lang="ts">
import {
  ref, computed, useTemplateRef,
  nextTick,
  watch,
} from 'vue';
import { useUserProfilesStore } from 'InvestCommon/store/useUserProfiles';
import { useUsersStore } from 'InvestCommon/store/useUsers';
import { useHubspotForm } from 'InvestCommon/composable/useHubspotForm';
import VButton from 'UiKit/components/VButton/VButton.vue';
import { storeToRefs } from 'pinia';
import { useRouter } from 'vue-router';
import { ROUTE_DASHBOARD_ACCOUNT } from 'InvestCommon/helpers/enums/routes';
import VFormPartialCreateProfileSelectType from './VFormPartialCreateProfileSelectType.vue';
import VFormProfileEntity from './VFormProfileEntity.vue';
import { FormChild } from 'InvestCommon/types/form';
import { scrollToError } from 'UiKit/helpers/validation/general';
import { PROFILE_TYPES } from 'InvestCommon/global/investment.json';

const props = defineProps({
  hubsportFormId: {
    type: String,
    required: true,
  },
});
const selectTypeFormRef = useTemplateRef<FormChild>('selectTypeFormChild');
const entityTypeFormRef = useTemplateRef<FormChild>('entityFormChild');

const router = useRouter();
const userIdentityStore = useUserProfilesStore();
const {
  isSetUserProfileLoading,
} = storeToRefs(userIdentityStore);
const usersStore = useUsersStore();
const { selectedUserProfileData, selectedUserProfileId } = storeToRefs(usersStore);
const userProfilesStore = useUserProfilesStore();

const { submitFormToHubspot } = useHubspotForm(props.hubsportFormId);

const selectedType = computed(() => String(selectTypeFormRef.value?.model?.type_profile));

const childFormIsValid = computed(() => {
  if (selectedType.value.toLowerCase() === 'entity') {
    return entityTypeFormRef.value?.isValid;
  }
  return true;
});
const childFormModel = computed(() => {
  if (selectedType.value.toLowerCase() === 'entity') {
    return entityTypeFormRef.value?.model;
  }
  return {};
});
const onValidate = () => {
  if (selectedType.value.toLowerCase() === 'entity') {
    entityTypeFormRef.value?.onValidate();
  }
};

const isLoading = ref(false);
const isValid = computed(() => (selectTypeFormRef.value?.isValid && childFormIsValid.value));
const isDisabledButton = computed(() => (!isValid.value || isSetUserProfileLoading.value));

const saveHandler = async () => {
  const model = { ...childFormModel.value };
  delete model.ssn; // todo - remove !!!
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
  isLoading.value = false;
  void userProfilesStore.getProfileById(selectedType.value, selectedUserProfileId.value);
  void router.push({ name: ROUTE_DASHBOARD_ACCOUNT, params: { profileId: selectedUserProfileId.value } });
  // void submitFormToHubspot({
  //   email: userAccountData.value?.email,
  //   ...model,
  // });
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
