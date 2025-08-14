<script setup lang="ts">
import {
  ref, computed, useTemplateRef,
  nextTick,
} from 'vue';
import { useProfilesStore } from 'InvestCommon/domain/profiles/store/useProfiles';
import { useHubspotForm } from 'InvestCommon/composable/useHubspotForm';
import VButton from 'UiKit/components/Base/VButton/VButton.vue';
import { storeToRefs } from 'pinia';
import { useRouter } from 'vue-router';
import { FormChild } from 'InvestCommon/types/form';
import { scrollToError } from 'UiKit/helpers/validation/general';
import env from 'InvestCommon/global';
import VFormPartialAccount from './VFormPartialAccount.vue';
import { ROUTE_SETTINGS_MFA } from 'InvestCommon/helpers/enums/routes';
import { useToast } from 'UiKit/components/Base/VToast/use-toast';
import { useSessionStore } from 'InvestCommon/domain/session/store/useSession';
import { useRepositoryProfiles } from 'InvestCommon/data/profiles/profiles.repository';

const { toast } = useToast();

const TOAST_OPTIONS = {
  title: 'Submitted!',
  variant: 'success',
};

const personalFormRef = useTemplateRef<FormChild>('personalFormChild');

const router = useRouter();
const useRepositoryProfilesStore = useRepositoryProfiles();
const { setUserState } = storeToRefs(useRepositoryProfilesStore);
const profilesStore = useProfilesStore();
const { selectedUserProfileId } = storeToRefs(profilesStore);
const userSessionStore = useSessionStore();
const { userSessionTraits } = storeToRefs(userSessionStore);

const { submitFormToHubspot } = useHubspotForm(env.HUBSPOT_FORM_ID_ACCOUNT);

const isLoading = ref(false);
const isValid = computed(() => (personalFormRef.value?.isValid));
const isDisabledButton = computed(() => (!isValid.value || setUserState.value.loading));

const saveHandler = async () => {
  personalFormRef.value?.onValidate();
  if (!isValid.value) {
    nextTick(() => scrollToError('VFormAccount'));
    return;
  }

  isLoading.value = true;
  const model = { ...personalFormRef.value?.model };
  delete model.email;
  await useRepositoryProfilesStore.setUser(model);
  if (setUserState.value.error) {
    isLoading.value = false;
    return;
  }
  await useRepositoryProfilesStore.getUser();
  isLoading.value = false;
  submitFormToHubspot({
    ...personalFormRef.value?.model,
  });
  toast(TOAST_OPTIONS);
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
        :model-data="userSessionTraits"
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
