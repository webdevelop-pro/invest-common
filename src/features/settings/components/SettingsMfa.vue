<script setup lang="ts">
import {
  computed, defineAsyncComponent, onMounted, ref, watch,
} from 'vue';
import { SELFSERVICE } from 'InvestCommon/features/settings/utils';
import VAlert from 'UiKit/components/VAlert.vue';
import VSwitch from 'UiKit/components/VSwitch.vue';
import { navigateWithQueryParams } from 'UiKit/helpers/general';
import { urlResetPassword } from 'InvestCommon/global/links';
import { useRepositorySettings } from 'InvestCommon/data/settings/settings.repository';
import { useToast } from 'UiKit/components/Base/VToast/use-toast';
import { storeToRefs } from 'pinia';

const VDialogMfa = defineAsyncComponent({
  loader: () => import('./VDialogMfa.vue'),
});

const settingsRepository = useRepositorySettings();
const { flowId, csrfToken, setSettingsState, getAuthFlowState } = storeToRefs(settingsRepository);

const { toast } = useToast();

const isDialogMfaOpen = ref(false);


const totpUnlink = computed(() => {
  const tokenItem = getAuthFlowState.value.data?.ui?.nodes?.find((item: any) => item.attributes.name === 'totp_unlink');
  return tokenItem;
});

const isMfaEnabled = ref(false);
const mfaSwitchText = computed(() => (
  isMfaEnabled.value ? 'Multi-factor authentication is now enabled.' : 'Enable multi-factor authentication'));
const mfaInfoText = computed(() => (
  isMfaEnabled.value ? 'Your account is protected with an extra layer of security.' : 'An extra level of protection to your account during login'));

const onResetPasswordClick = () => {
  navigateWithQueryParams(urlResetPassword);
};

onMounted(async () => {
  if (!getAuthFlowState.value.data) {
    settingsRepository.getAuthFlow(SELFSERVICE.settings);
  }
});

const onMfaClick = async () => {
  if (isMfaEnabled.value && !totpUnlink.value) {
    // open MFA dialog
    isDialogMfaOpen.value = true;
  } else if (totpUnlink.value) {
    // unlink
    await settingsRepository.setSettings(flowId.value, {
        method: 'totp',
        totp_unlink: true,
        csrf_token: csrfToken.value,
    }, onMfaClick);
    await settingsRepository.getAuthFlow(SELFSERVICE.settings);

      if (!setSettingsState.value.error) {
        toast({
          title: 'Submitted',
          description: 'Unlinked',
          variant: 'success',
        });
      }
  }
};

watch(() => isDialogMfaOpen.value, () => {
  if (!isDialogMfaOpen.value) {
    isMfaEnabled.value = totpUnlink.value;
  }
});

watch(() => totpUnlink.value, () => {
  isMfaEnabled.value = totpUnlink.value;
}, { immediate: true });
</script>

<template>
  <div class="SettingsMfa settings-mfa">
    <h2>
      MFA & Password
    </h2>
    <div class="is--two-col-grid is--margin-top-40">
      <div class="settings-mfa__left">
        <h3 class="settings-mfa__subtitle is--h3__title">
          Multi-Factor Authentication
        </h3>
        <VSwitch
          v-model:checked="isMfaEnabled"
          class="is--margin-top-20"
          @click="onMfaClick"
        >
          {{ mfaSwitchText }}
        </VSwitch>
        <p class="is--small is--color-gray-70 is--margin-top-12">
          {{ mfaInfoText }}
        </p>
      </div>
      <div class="settings-mfa__right">
        <h3 class="settings-mfa__subtitle is--h3__title">
          Reset Your Password
        </h3>
        <VAlert
          variant="info"
          button-text="Reset Password"
          class="is--margin-top-20"
          @click="onResetPasswordClick"
        >
          <template #description>
            To reset your password, please enter your new credentials. Click the button to open the secure form.
          </template>
        </VAlert>
      </div>
    </div>

    <VDialogMfa
      v-model="isDialogMfaOpen"
    />
  </div>
</template>
