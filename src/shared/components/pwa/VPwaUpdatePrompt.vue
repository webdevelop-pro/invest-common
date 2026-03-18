<script setup lang="ts">
import VAlert from 'UiKit/components/VAlert.vue';
import VButton from 'UiKit/components/Base/VButton/VButton.vue';

defineProps<{
  isUpdateReady: boolean;
  isOfflineReady: boolean;
  lifecycleState: 'idle' | 'offlineReady' | 'updateReady' | 'reloading' | 'registrationError';
  hasRegistrationError: boolean;
  appVersion?: string;
}>();

const emit = defineEmits<{
  reload: [];
  dismissUpdate: [];
  dismissOfflineReady: [];
}>();
</script>

<template>
  <div
    v-if="lifecycleState !== 'idle'"
    class="VPwaUpdatePrompt v-pwa-update-prompt"
    data-testid="pwa-update-prompt"
  >
    <VAlert
      v-if="isUpdateReady"
      variant="info"
      class="v-pwa-update-prompt__alert"
    >
      <template #title>
        App update available
      </template>
      <template #description>
        A newer version of the app is ready. Refresh to load the latest code and cached content.
        <span v-if="appVersion">
          Current build: {{ appVersion }}
        </span>
      </template>
      <div class="v-pwa-update-prompt__actions">
        <VButton
          size="small"
          color="primary"
          @click="emit('reload')"
        >
          Refresh app
        </VButton>
        <VButton
          size="small"
          variant="outlined"
          :disabled="lifecycleState === 'reloading'"
          @click="emit('dismissUpdate')"
        >
          Later
        </VButton>
      </div>
    </VAlert>

    <VAlert
      v-else-if="isOfflineReady"
      variant="success"
      class="v-pwa-update-prompt__alert"
    >
      <template #title>
        Offline mode ready
      </template>
      <template #description>
        Core app files are cached and the app can reopen previously visited pages with cached content.
      </template>
      <div class="v-pwa-update-prompt__actions">
        <VButton
          size="small"
          color="secondary"
          @click="emit('dismissOfflineReady')"
        >
          Dismiss
        </VButton>
      </div>
    </VAlert>

    <VAlert
      v-else-if="hasRegistrationError"
      variant="error"
      class="v-pwa-update-prompt__alert"
    >
      <template #title>
        Offline features unavailable
      </template>
      <template #description>
        The app could not finish service worker setup, so install, offline reopen, and in-app update prompts are temporarily unavailable.
      </template>
    </VAlert>
  </div>
</template>

<style scoped lang="scss">
.v-pwa-update-prompt {
  width: 100%;

  &__alert {
    width: 100%;
    margin: 0;
  }

  &__actions {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    margin-left: auto;
  }
}
</style>
