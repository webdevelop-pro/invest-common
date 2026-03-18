<script setup lang="ts">
import { computed } from 'vue';
import VAlert from 'UiKit/components/VAlert.vue';

const props = defineProps<{
  isOffline: boolean;
  isReconnected?: boolean;
  isShowingCachedContent: boolean;
  lastSyncedAt?: string | null;
}>();

const bannerTitle = 'Offline mode';
const lastSyncedLabel = computed(() => {
  if (!props.lastSyncedAt) {
    return '';
  }

  const date = new Date(props.lastSyncedAt);
  if (Number.isNaN(date.getTime())) {
    return '';
  }

  return date.toLocaleString(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  });
});
const bannerText = computed(() => (
  props.isReconnected
    ? 'Connection restored. The app can refresh live content again.'
    : props.isShowingCachedContent
      ? 'You are offline and the app is now in read-only mode. Previously visited pages are available from cache.'
      : 'You are offline. Some sections may be unavailable until the connection returns.'
));
</script>

<template>
  <div
    v-if="isOffline || isReconnected"
    class="VOfflineStatusBanner v-offline-status-banner"
    role="status"
    aria-live="polite"
    data-testid="offline-status-banner"
  >
    <VAlert
      :variant="isReconnected ? 'success' : 'info'"
      class="v-offline-status-banner__alert"
    >
      <template #title>
        {{ isReconnected ? 'Back online' : bannerTitle }}
      </template>
      <template #description>
        {{ bannerText }}
        <span v-if="lastSyncedLabel">
          Last synced: {{ lastSyncedLabel }}.
        </span>
      </template>
    </VAlert>
  </div>
</template>

<style scoped lang="scss">
.v-offline-status-banner {
  width: 100%;

  &__alert {
    width: 100%;
    margin: 0;
  }
}
</style>
