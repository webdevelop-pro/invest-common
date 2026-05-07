<script setup lang="ts">
import {
  onMounted,
  ref,
  watch,
} from 'vue';
import { storeToRefs } from 'pinia';
import VButton from 'UiKit/components/Base/VButton/VButton.vue';
import type {
  ButtonSize,
  ButtonVariant,
} from 'UiKit/components/Base/VButton/types';
import { useSessionStore } from 'InvestCommon/domain/session/store/useSession';
import {
  requestAndroidNativePushPermissionConsent,
  shouldShowAndroidNativePushExplainer,
} from './nativePushBridge';

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

const sessionStore = useSessionStore();
const { isSessionHydrated, userLoggedIn } = storeToRefs(sessionStore);

const showButton = ref(false);
const isLoading = ref(false);
let visibilityRequestId = 0;

const refreshVisibility = async () => {
  const requestId = ++visibilityRequestId;

  if (
    typeof window === 'undefined'
    || !isSessionHydrated.value
    || !userLoggedIn.value
  ) {
    showButton.value = false;
    return;
  }

  try {
    const shouldShow = await shouldShowAndroidNativePushExplainer();
    if (requestId === visibilityRequestId) {
      showButton.value = shouldShow;
    }
  } catch {
    if (requestId === visibilityRequestId) {
      showButton.value = false;
    }
  }
};

const requestPermission = async () => {
  if (isLoading.value) {
    return;
  }

  isLoading.value = true;
  try {
    await requestAndroidNativePushPermissionConsent();
  } finally {
    isLoading.value = false;
    void refreshVisibility();
  }
};

watch(
  [isSessionHydrated, userLoggedIn],
  () => {
    void refreshVisibility();
  },
  { immediate: true },
);

onMounted(() => {
  void refreshVisibility();
});
</script>

<template>
  <div
    v-if="showButton"
    class="VNativePushSubscribeButton native-push-subscribe-button"
  >
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
