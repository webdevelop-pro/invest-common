<script setup lang="ts">
import { computed } from 'vue';
import { useOfflineStatus } from 'InvestCommon/domain/pwa/useOfflineStatus';
import { usePwaBannerDismissals } from 'InvestCommon/domain/pwa/usePwaBannerDismissals';
import { usePwaOfflineDataStatus } from 'InvestCommon/domain/pwa/usePwaOfflineDataStatus';
import { usePwaInstallPrompt } from 'InvestCommon/domain/pwa/usePwaInstallPrompt';
import { usePwaStandalone } from 'InvestCommon/domain/pwa/usePwaStandalone';
import { usePwaTelemetry } from 'InvestCommon/domain/pwa/usePwaTelemetry';
import { usePwaUpdatePrompt } from 'InvestCommon/domain/pwa/usePwaUpdatePrompt';
import env from 'InvestCommon/config/env';
import VOfflineStatusBanner from './VOfflineStatusBanner.vue';
import VPwaInstallPrompt from './VPwaInstallPrompt.vue';
import VPwaUpdatePrompt from './VPwaUpdatePrompt.vue';

const props = withDefaults(defineProps<{
  usesMobileShell: boolean;
  hasFooterMenu?: boolean;
}>(), {
  hasFooterMenu: false,
});

const { isStandalone } = usePwaStandalone();
const { isOffline, isReconnected, isShowingCachedContent } = useOfflineStatus();
const { lastSyncedAt } = usePwaOfflineDataStatus();
const {
  canInstall,
  installState,
  promptInstall,
  dismissInstallPrompt,
} = usePwaInstallPrompt();
const {
  isUpdateReady,
  isOfflineReady,
  lifecycleState,
  registrationError,
  reloadApp,
  dismissOfflineReady,
  dismissUpdateReady,
} = usePwaUpdatePrompt();
const {
  handleInstall,
  handleDismissInstall,
  handleReloadApp,
  handleDismissUpdate,
  handleDismissOfflineReady,
} = usePwaTelemetry({
  canInstall,
  installState,
  isUpdateReady,
  isOfflineReady,
  isOffline,
  isReconnected,
  registrationError,
  promptInstall,
  dismissInstallPrompt,
  reloadApp,
  dismissUpdateReady,
  dismissOfflineReady,
});
const appVersion = computed(() => env.APP_VERSION || '');
const hasRegistrationError = computed(() => Boolean(registrationError.value));
const canShowInteractiveUpdatePrompt = computed(() => !isOffline.value);
const shouldShowInstallPrompt = computed(() => installState.value !== 'hidden');
const shouldShowPwaPrompts = computed(() => isStandalone.value);
const activeOfflineBannerKey = computed(() => {
  if (isOffline.value) {
    return 'offline' as const;
  }

  if (isReconnected.value) {
    return 'reconnected' as const;
  }

  return null;
});
const {
  isBannerVisible: shouldShowOfflineBanner,
  dismissActiveBanner: dismissOfflineBanner,
} = usePwaBannerDismissals(activeOfflineBannerKey);
const shouldShowUpdatePrompt = computed(() => (
  canShowInteractiveUpdatePrompt.value
  && shouldShowPwaPrompts.value
  && (
    lifecycleState.value === 'reloading'
    || isUpdateReady.value
    || isOfflineReady.value
    || hasRegistrationError.value
  )
));
const shouldRenderStack = computed(() => (
  shouldShowInstallPrompt.value
  || shouldShowUpdatePrompt.value
  || shouldShowOfflineBanner.value
));
const shouldOffsetForFooterMenu = computed(() => (
  props.usesMobileShell && props.hasFooterMenu
));
</script>

<template>
  <div
    v-if="shouldRenderStack"
    class="VPwaStatusStack v-pwa-status-stack"
    :class="{ 'is--footer-offset': shouldOffsetForFooterMenu }"
  >
    <VPwaInstallPrompt
      v-if="shouldShowInstallPrompt"
      :can-install="canInstall"
      :install-state="installState"
      @install="handleInstall"
      @dismiss="handleDismissInstall"
    />
    <VPwaUpdatePrompt
      v-if="shouldShowUpdatePrompt"
      :is-update-ready="isUpdateReady"
      :is-offline-ready="isOfflineReady"
      :lifecycle-state="lifecycleState"
      :has-registration-error="hasRegistrationError"
      :app-version="appVersion"
      @reload="handleReloadApp"
      @dismiss-update="handleDismissUpdate"
      @dismiss-offline-ready="handleDismissOfflineReady"
    />
    <VOfflineStatusBanner
      v-if="shouldShowOfflineBanner"
      :is-offline="isOffline"
      :is-reconnected="isReconnected"
      :is-showing-cached-content="isShowingCachedContent"
      :last-synced-at="lastSyncedAt"
      @dismiss="dismissOfflineBanner"
    />
  </div>
</template>

<style scoped lang="scss">
.v-pwa-status-stack {
  position: fixed;
  right: 0;
  bottom: 0;
  left: 0;
  z-index: 140;
  display: flex;
  flex-direction: column;
  gap: 12px;
  width: 100%;
  margin: 0 auto;
  pointer-events: none;

  > * {
    pointer-events: auto;
  }

  &.is--footer-offset {
    bottom: var(--pwa-footer-safe-offset);
  }
}
</style>
