<!-- eslint-disable @typescript-eslint/no-unsafe-assignment -->
<script setup lang="ts">
import {
  ref, computed, nextTick,
  useTemplateRef,
} from 'vue';
import { useUserProfilesStore } from 'InvestCommon/store/useUserProfiles';
import { useUsersStore } from 'InvestCommon/store/useUsers';
import { useHubspotForm } from 'InvestCommon/composable/useHubspotForm';
import VButton from 'UiKit/components/Base/VButton/VButton.vue';
import { storeToRefs } from 'pinia';
import { scrollToError } from 'UiKit/helpers/validation/general';
import { ROUTE_DASHBOARD_ACCOUNT } from 'InvestCommon/helpers/enums/routes';
import { useRouter } from 'vue-router';
import { FormChild } from 'InvestCommon/types/form';
import VFormPartialPlanInformation from './VFormPartialPlanInformation.vue';
import env from 'InvestCommon/global';

const planInformationRef = useTemplateRef<FormChild>('planInformationFormChild');
const router = useRouter();
const userProfilesStore = useUserProfilesStore();
const {
  isSetProfileByIdLoading, isSetProfileByIdError,
} = storeToRefs(userProfilesStore);
const usersStore = useUsersStore();
const {
  selectedUserProfileData, selectedUserProfileId,
  selectedUserProfileType, userAccountData,
} = storeToRefs(usersStore);

const { submitFormToHubspot } = useHubspotForm(env.HUBSPOT_FORM_ID_PLAN_INFO);

const isLoading = ref(false);
const isValid = computed(() => planInformationRef.value?.isValid);
const isDisabledButton = computed(() => (!isValid.value || isSetProfileByIdLoading.value));

const saveHandler = async () => {
  planInformationRef.value?.onValidate();
  if (!isValid.value) {
    nextTick(() => scrollToError('VFormPlanInformation'));
    return;
  }

  isLoading.value = true;
  await userProfilesStore.setProfileById(
    planInformationRef.value?.model,
    selectedUserProfileType.value,
    selectedUserProfileId.value,
  );
  if (!isSetProfileByIdError.value) {
    submitFormToHubspot({
      email: userAccountData.value?.email,
      ...planInformationRef.value?.model,
    });
  }
  userProfilesStore.getProfileById(selectedUserProfileType.value, selectedUserProfileId.value);
  isLoading.value = false;
  router.push({ name: ROUTE_DASHBOARD_ACCOUNT, params: { profileId: selectedUserProfileId.value } });
};

const cancelHandler = () => {
  router.push({ name: ROUTE_DASHBOARD_ACCOUNT, params: { profileId: selectedUserProfileId.value } });
};
</script>

<template>
  <div class="VFormPlanInformation v-form-plan-information">
    <div class="v-form-plan-information__header is--h1__title">
      Plan Information
    </div>
    <VFormPartialPlanInformation
      ref="planInformationFormChild"
      :model-data="selectedUserProfileData?.data"
    />
    <div class="v-form-plan-information__footer">
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
.v-form-plan-information {
  display: flex;
  flex-direction: column;
  margin: 0 auto;
  width: 100%;

  &__header {
    margin-bottom: 40px;
  }

  &__subtitle {
    margin-top: 12px;
    margin-bottom: 20px;
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
