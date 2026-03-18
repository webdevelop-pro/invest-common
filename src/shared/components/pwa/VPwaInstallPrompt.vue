<script setup lang="ts">
import VAlert from 'UiKit/components/VAlert.vue';
import VButton from 'UiKit/components/Base/VButton/VButton.vue';

defineProps<{
  canInstall: boolean;
  installState: 'hidden' | 'native' | 'manual-ios';
}>();

const emit = defineEmits<{
  install: [];
  dismiss: [];
}>();
</script>

<template>
  <div
    v-if="installState !== 'hidden'"
    class="VPwaInstallPrompt v-pwa-install-prompt"
    data-testid="pwa-install-prompt"
  >
    <VAlert
      variant="info"
      class="v-pwa-install-prompt__alert"
    >
      <template #title>
        {{ canInstall ? 'Install app' : 'Add to Home Screen' }}
      </template>
      <template #description>
        {{
          canInstall
            ? 'Install Invest PRO for faster launch, standalone navigation, and a more native app experience.'
            : 'On iPhone or iPad, open the Share menu in Safari and choose "Add to Home Screen" to install Invest PRO.'
        }}
      </template>
      <div class="v-pwa-install-prompt__actions">
        <VButton
          v-if="canInstall"
          size="small"
          color="primary"
          @click="emit('install')"
        >
          Install
        </VButton>
        <VButton
          size="small"
          :variant="canInstall ? 'outlined' : undefined"
          :color="canInstall ? undefined : 'secondary'"
          @click="emit('dismiss')"
        >
          {{ canInstall ? 'Not now' : 'Got it' }}
        </VButton>
      </div>
    </VAlert>
  </div>
</template>

<style scoped lang="scss">
.v-pwa-install-prompt {
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
