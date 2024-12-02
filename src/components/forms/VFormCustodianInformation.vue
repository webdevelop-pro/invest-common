<!-- eslint-disable @typescript-eslint/no-unsafe-assignment -->
<script setup lang="ts">
import {
  ref, computed, nextTick,
  useTemplateRef,
} from 'vue';
import { useUserProfilesStore } from 'InvestCommon/store/useUserProfiles';
import { useUsersStore } from 'InvestCommon/store/useUsers';
import { useHubspotForm } from 'InvestCommon/composable/useHubspotForm';
import VButton from 'UiKit/components/VButton/VButton.vue';
import { storeToRefs } from 'pinia';
import { scrollToError } from 'UiKit/helpers/validation/general';
import { ROUTE_DASHBOARD_ACCOUNT } from 'InvestCommon/helpers/enums/routes';
import { useRouter } from 'vue-router';
import { FormChild } from 'InvestCommon/types/form';
import VFormPartialCustodian from './VFormPartialCustodian.vue';

const props = defineProps({
  hubsportFormId: String,
});

const custodianRef = useTemplateRef<FormChild>('custodianInformationFormChild');
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

const { submitFormToHubspot } = useHubspotForm(props.hubsportFormId);

const isLoading = ref(false);
const isValid = computed(() => custodianRef.value?.isValid);
const isDisabledButton = computed(() => (!isValid.value || isSetProfileByIdLoading.value));


const saveHandler = async () => {
  custodianRef.value?.onValidate();
  if (!isValid.value) {
    void nextTick(() => scrollToError('VFormPlanInformation'));
    return;
  }

  isLoading.value = true;
  await userProfilesStore.setProfileById(
    custodianRef.value?.model,
    selectedUserProfileType.value,
    selectedUserProfileId.value,
  );
  isLoading.value = false;
  if (props.hubsportFormId && !isSetProfileByIdError.value) {
    void submitFormToHubspot({
      email: userAccountData.value?.email,
      ...custodianRef.value?.model,
    });
  }
  void userProfilesStore.getProfileById(selectedUserProfileType.value, selectedUserProfileId.value);
  void router.push({ name: ROUTE_DASHBOARD_ACCOUNT, params: { profileId: selectedUserProfileId.value } });
};

const cancelHandler = () => {
  void router.push({ name: ROUTE_DASHBOARD_ACCOUNT, params: { profileId: selectedUserProfileId.value } });
};
</script>

<template>
  <div class="VFormCustodianInformation v-form-custodian-information">
    <div class="v-form-custodian-information__header is--h1__title">
      Custodian
    </div>
    <VFormPartialCustodian
      ref="custodianInformationFormChild"
      :model-data="selectedUserProfileData?.data"
    />
    <div class="v-form-custodian-information__footer">
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
.v-form-custodian-information {
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
