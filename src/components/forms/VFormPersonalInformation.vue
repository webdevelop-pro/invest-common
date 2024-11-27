<script setup lang="ts">
import {
  ref, computed, useTemplateRef,
  nextTick,
} from 'vue';
import { useUserProfilesStore } from 'InvestCommon/store/useUserProfiles';
import { useUsersStore } from 'InvestCommon/store/useUsers';
import { useAccreditationStore } from 'InvestCommon/store/useAccreditation';
import { useHubspotForm } from 'InvestCommon/composable/useHubspotForm';
import VButton from 'UiKit/components/VButton/VButton.vue';
import { storeToRefs } from 'pinia';
import { useRouter } from 'vue-router';
import { ROUTE_ACCREDITATION_UPLOAD, ROUTE_DASHBOARD_ACCOUNT } from 'InvestCommon/helpers/enums/routes';
import VFormPartialPersonalInformation from './VFormPartialPersonalInformation.vue';
import { FormChild, FormModelPersonalInformation } from 'InvestCommon/types/form';
import { scrollToError } from 'UiKit/helpers/validation/general';

const props = defineProps({
  accreditation: Boolean,
  hubsportFormId: {
    type: String,
    required: true,
  },
  readOnly: Boolean,
});
const personalFormRef = useTemplateRef<FormChild>('personalFormChild');

const router = useRouter();
const userIdentityStore = useUserProfilesStore();
const accreditationStore = useAccreditationStore();
const {
  isSetUserProfileLoading, isSetUserProfileError,
} = storeToRefs(userIdentityStore);
const usersStore = useUsersStore();
const {
  selectedUserProfileData, selectedUserProfileId, userAccountData,
  selectedUserProfileType,
} = storeToRefs(usersStore);

const { submitFormToHubspot } = useHubspotForm(props.hubsportFormId);

const isLoading = ref(false);
const isDisabledButton = computed(() => (!personalFormRef.value?.isValid || isSetUserProfileLoading.value));

const saveHandler = async () => {
  personalFormRef.value?.onValidate();
  if (!personalFormRef.value?.isValid) {
    void nextTick(() => scrollToError('VFormPersonalInformation'));
    return;
  }

  isLoading.value = true;
  const model = { ...personalFormRef.value?.model } as FormModelPersonalInformation;
  await userIdentityStore.setProfileById(model, selectedUserProfileType.value, selectedUserProfileId.value);

  if (!isSetUserProfileError.value && selectedUserProfileData.value?.user_id && selectedUserProfileData.value?.id
    && !selectedUserProfileData.value?.escrow_id) {
    await accreditationStore.createEscrow(selectedUserProfileData.value?.user_id, selectedUserProfileData.value?.id);
  }
  isLoading.value = false;
  void submitFormToHubspot({
    email: userAccountData.value?.email,
    ...model,
    date_of_birth: model?.dob,
  });
  void userIdentityStore.getProfileById(selectedUserProfileType.value, selectedUserProfileId.value);
  if (props.accreditation) {
    void router.push({ name: ROUTE_ACCREDITATION_UPLOAD, params: { profileId: selectedUserProfileId.value } });
  } else {
    void router.push({ name: ROUTE_DASHBOARD_ACCOUNT, params: { profileId: selectedUserProfileId.value } });
  }
};

const cancelHandler = () => {
  void router.push({ name: ROUTE_DASHBOARD_ACCOUNT, params: { profileId: selectedUserProfileId.value } });
};
</script>

<template>
  <div class="VFormPersonalInformation form-personal-information">
    <div class="form-personal-information__header is--h1__title">
      Personal Information
    </div>
    <div class="form-personal-information__content">
      <VFormPartialPersonalInformation
        ref="personalFormChild"
        :read-only="readOnly"
        :model-data="selectedUserProfileData?.data"
      />
    </div>
    <div class="form-personal-information__footer">
      <VButton
        size="large"
        variant="outlined"
        @click="cancelHandler"
      >
        Cancel
      </VButton>
      <VButton
        size="large"
        :disabled="isDisabledButton || readOnly"
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
.form-personal-information {
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
