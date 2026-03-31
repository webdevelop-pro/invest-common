<script setup lang="ts">
import VAlert from 'UiKit/components/VAlert.vue';
import VButton from 'UiKit/components/Base/VButton/VButton.vue';

defineProps<{
  isVisible: boolean;
  isLoading?: boolean;
}>();

const emit = defineEmits<{
  accept: [];
  dismiss: [];
}>();
</script>

<template>
  <div
    v-if="isVisible"
    class="VNativePushPrompt v-native-push-prompt"
    role="status"
    aria-live="polite"
    data-testid="native-push-prompt"
  >
    <VAlert
      variant="info"
      class="v-native-push-prompt__alert"
    >
      <template #title>
        Enable push notifications
      </template>
      <template #description>
        Turn on push notifications to receive account, offering, wallet, and platform updates on this device.
      </template>
      <div class="v-native-push-prompt__actions">
        <VButton
          size="small"
          color="primary"
          :loading="isLoading"
          :disabled="isLoading"
          @click="emit('accept')"
        >
          Enable
        </VButton>
        <VButton
          size="small"
          variant="outlined"
          :disabled="isLoading"
          @click="emit('dismiss')"
        >
          Not now
        </VButton>
      </div>
    </VAlert>
  </div>
</template>

<style scoped lang="scss">
.v-native-push-prompt {
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
