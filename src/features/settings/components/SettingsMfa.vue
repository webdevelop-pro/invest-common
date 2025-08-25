<script setup lang="ts">
import { defineAsyncComponent, onMounted } from 'vue';
import VAlert from 'UiKit/components/VAlert.vue';
import VSwitch from 'UiKit/components/VSwitch.vue';
import { useSettingsMfa } from './logic/useSettingsMfa';

const VDialogMfa = defineAsyncComponent({
  loader: () => import('./VDialogMfa.vue'),
});

const {
  isDialogMfaOpen,
  isMfaEnabled,
  mfaSwitchText,
  mfaInfoText,
  onResetPasswordClick,
  onMfaClick,
  initializeMfa,
} = useSettingsMfa();

onMounted(() => {
  initializeMfa();
});
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
