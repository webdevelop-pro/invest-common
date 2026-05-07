<script setup lang="ts">
import {
  onMounted,
  onUnmounted,
  ref,
} from 'vue';
import VButton from 'UiKit/components/Base/VButton/VButton.vue';
import {
  VDialog,
  VDialogContent,
  VDialogFooter,
  VDialogHeader,
  VDialogTitle,
} from 'UiKit/components/Base/VDialog';
import {
  NATIVE_PUSH_AUTH_SUCCESS_EVENT,
  rejectAndroidNativePushExplainer,
  requestAndroidNativePushPermissionConsent,
  shouldShowAndroidNativePushExplainer,
} from './nativePushBridge';

const isOpen = ref(false);
const isLoading = ref(false);

async function refreshVisibility() {
  if (isLoading.value) {
    return;
  }

  isOpen.value = await shouldShowAndroidNativePushExplainer();
}

async function accept() {
  if (isLoading.value) {
    return;
  }

  isLoading.value = true;
  try {
    await requestAndroidNativePushPermissionConsent();
    isOpen.value = false;
  } finally {
    isLoading.value = false;
  }
}

function reject() {
  rejectAndroidNativePushExplainer();
  isOpen.value = false;
}

function handleAuthSuccess() {
  void refreshVisibility();
}

onMounted(() => {
  if (typeof window === 'undefined') {
    return;
  }

  window.addEventListener(NATIVE_PUSH_AUTH_SUCCESS_EVENT, handleAuthSuccess);
});

onUnmounted(() => {
  if (typeof window === 'undefined') {
    return;
  }

  window.removeEventListener(NATIVE_PUSH_AUTH_SUCCESS_EVENT, handleAuthSuccess);
});
</script>

<template>
  <VDialog v-model:open="isOpen">
    <VDialogContent
      class="VNativePushConsentDialog native-push-consent-dialog"
      aria-describedby="native-push-consent-description"
    >
      <VDialogHeader>
        <VDialogTitle>Enable push notifications?</VDialogTitle>
      </VDialogHeader>

      <p
        id="native-push-consent-description"
        class="native-push-consent-dialog__description"
      >
        Get account, offering, wallet, and platform updates on this device.
      </p>

      <VDialogFooter class="native-push-consent-dialog__footer">
        <VButton
          type="button"
          variant="outlined"
          :disabled="isLoading"
          @click="reject"
        >
          No
        </VButton>
        <VButton
          type="button"
          :loading="isLoading"
          @click="accept"
        >
          Enable
        </VButton>
      </VDialogFooter>
    </VDialogContent>
  </VDialog>
</template>

<style lang="scss">
.native-push-consent-dialog {
  max-width: 520px;

  &__description {
    margin: 16px 0 0;
    color: $gray-80;
    font-size: 16px;
    line-height: 24px;
  }

  &__footer {
    display: flex;
    justify-content: flex-end;
    gap: 12px;
    margin-top: 28px;
  }
}
</style>
