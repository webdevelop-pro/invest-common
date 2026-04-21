<script setup lang="ts">
import { ref } from 'vue';
import VButton from 'UiKit/components/Base/VButton/VButton.vue';
import type {
  ButtonSize,
  ButtonVariant,
} from 'UiKit/components/Base/VButton/types';
import { requestAndroidNativePushPermissionConsent } from './nativePushBridge';

const props = withDefaults(defineProps<{
  label?: string;
  size?: ButtonSize;
  variant?: ButtonVariant;
  block?: boolean;
  showExplainer?: boolean;
}>(), {
  label: 'Subscribe to notifications',
  size: 'medium',
  variant: 'outlined',
  block: false,
  showExplainer: false,
});

const isLoading = ref(false);

const requestPermission = async () => {
  if (isLoading.value) {
    return;
  }

  isLoading.value = true;
  try {
    await requestAndroidNativePushPermissionConsent();
  } finally {
    isLoading.value = false;
  }
};
</script>

<template>
  <div
    class="VNativePushSubscribeButton native-push-subscribe-button"
  >
  <h1>Native Push Subscribe Button</h1>
    <VButton
      type="button"
      :size="props.size"
      :variant="props.variant"
      :block="props.block"
      :loading="isLoading"
      @click="requestPermission"
    >
      {{ props.label }}
    </VButton>
    <p
      v-if="props.showExplainer"
      class="native-push-subscribe-button__explainer"
    >
      Enable push notifications for account, offering, wallet, and platform updates.
    </p>
  </div>
</template>

<style lang="scss">
.native-push-subscribe-button {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 8px;
  min-width: 0;

  &__explainer {
    max-width: 520px;
    margin: 0;
    color: $gray-80;
    font-size: 14px;
    line-height: 20px;
  }
}
</style>
