<script setup lang="ts">
import {
  ref, computed, useTemplateRef,
  nextTick,
} from 'vue';
import { useUserProfilesStore } from 'InvestCommon/store/useUserProfiles';
import { useUsersStore } from 'InvestCommon/store/useUsers';
import { useHubspotForm } from 'InvestCommon/composable/useHubspotForm';
import VButton from 'UiKit/components/VButton/VButton.vue';
import { storeToRefs } from 'pinia';
import { useRouter } from 'vue-router';
import { ROUTE_DASHBOARD_ACCOUNT } from 'InvestCommon/helpers/enums/routes';
import VFormPartialCreateProfileSelectType from './VFormPartialCreateProfileSelectType.vue';
import VFormPartialIdentification from './VFormPartialIdentification.vue';
import { FormChild } from 'InvestCommon/types/form';
import { scrollToError } from 'UiKit/helpers/validation/general';

const props = defineProps({
  hubsportFormId: {
    type: String,
    required: true,
  },
});
const selectTypeFormRef = useTemplateRef<FormChild>('selectTypeFormChild');

const router = useRouter();
const userIdentityStore = useUserProfilesStore();
const {
  isSetUserProfileLoading,
} = storeToRefs(userIdentityStore);
const usersStore = useUsersStore();
const { selectedUserProfileData, selectedUserProfileId, userAccountData } = storeToRefs(usersStore);

const { submitFormToHubspot } = useHubspotForm(props.hubsportFormId);

const isLoading = ref(false);
const isValid = computed(() => (selectTypeFormRef.value?.isValid));
const isDisabledButton = computed(() => (!isValid.value || isSetUserProfileLoading.value));

const saveHandler = async () => {
  const model = { ...selectTypeFormRef.value?.model };
  selectTypeFormRef.value?.onValidate();
  if (!isValid.value) {
    void nextTick(() => scrollToError('VFormPersonalInformation'));
    return;
  }

  isLoading.value = true;

  isLoading.value = false;
  void submitFormToHubspot({
    email: userAccountData.value?.email,
    ...model,
  });
};

const cancelHandler = () => {
  void router.push({ name: ROUTE_DASHBOARD_ACCOUNT, params: { profileId: selectedUserProfileId.value } });
};
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
      <VFormPartialIdentification/>
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
