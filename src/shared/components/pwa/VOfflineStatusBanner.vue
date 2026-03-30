<script setup lang="ts">
import { computed } from 'vue';
import VAlert from 'UiKit/components/VAlert.vue';
import VButton from 'UiKit/components/Base/VButton/VButton.vue';

const props = defineProps<{
  isOffline: boolean;
  isReconnected?: boolean;
  isShowingCachedContent: boolean;
  lastSyncedAt?: string | null;
}>();

const emit = defineEmits<{
  dismiss: [];
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
      ? 'You are offline and seeing saved content in read-only mode.'
      : 'You are offline. Sections that were not saved on this device may be unavailable until the connection returns.'
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
      <div class="v-offline-status-banner__actions">
        <VButton
          size="small"
          variant="outlined"
          @click="emit('dismiss')"
        >
          OK
        </VButton>
      </div>
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

  &__actions {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    margin-left: auto;
  }
}
</style>
