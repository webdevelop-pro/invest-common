<script setup lang="ts">
import {
  ref, computed, useTemplateRef,
  nextTick,
} from 'vue';
import { useUserProfilesStore } from 'InvestCommon/store/useUserProfiles';
import { useUsersStore } from 'InvestCommon/store/useUsers';
import { useHubspotForm } from 'InvestCommon/composable/useHubspotForm';
import VButton from 'UiKit/components/Base/VButton/VButton.vue';
import { storeToRefs } from 'pinia';
import { useRouter } from 'vue-router';
import { FormChild } from 'InvestCommon/types/form';
import { scrollToError } from 'UiKit/helpers/validation/general';
import env from 'InvestCommon/global';
import VFormPartialAccount from './VFormPartialAccount.vue';
import { ROUTE_SETTINGS_MFA } from 'InvestCommon/helpers/enums/routes';

const personalFormRef = useTemplateRef<FormChild>('personalFormChild');

const router = useRouter();
const userIdentityStore = useUserProfilesStore();
const { isSetUserLoading } = storeToRefs(userIdentityStore);
const usersStore = useUsersStore();
const { selectedUserProfileId, userAccountData } = storeToRefs(usersStore);

const { submitFormToHubspot } = useHubspotForm(env.HUBSPOT_FORM_ID_ACCOUNT);

const isLoading = ref(false);
const isValid = computed(() => (personalFormRef.value?.isValid));
const isDisabledButton = computed(() => (!isValid.value || isSetUserLoading.value));

const saveHandler = async () => {
  personalFormRef.value?.onValidate();
  if (!isValid.value) {
    nextTick(() => scrollToError('VFormPersonalInformation'));
    return;
  }

  isLoading.value = true;
  const model = { ...personalFormRef.value?.model };
  delete model.email;
  await userIdentityStore.setUser(model);

  submitFormToHubspot({
    ...personalFormRef.value?.model,
  });
  userIdentityStore.getUser();
  isLoading.value = false;
  router.push({ name: ROUTE_SETTINGS_MFA, params: { profileId: selectedUserProfileId.value } });
};

const cancelHandler = () => {
  router.push({ name: ROUTE_SETTINGS_MFA, params: { profileId: selectedUserProfileId.value } });
};
</script>

<template>
  <div class="VFormAccount form-account">
    <div class="form-account__content">
      <VFormPartialAccount
        ref="personalFormChild"
        :model-data="userAccountData"
      />
    </div>
    <div class="form-account__footer">
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
.form-account {
  display: flex;
  flex-direction: column;
  width: 100%;

  &__header {
    margin-bottom: 40px;
    min-height: 75px;
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
