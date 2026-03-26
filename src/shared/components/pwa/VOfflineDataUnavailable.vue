<script setup lang="ts">
import type { RouteLocationRaw } from 'vue-router';
import VAlert from 'UiKit/components/VAlert.vue';
import VButton from 'UiKit/components/Base/VButton/VButton.vue';

type OfflineAction = {
  label: string;
  href?: string | null;
  to?: RouteLocationRaw | null;
};

const props = withDefaults(defineProps<{
  title?: string;
  description?: string;
  primaryAction?: OfflineAction | null;
  secondaryAction?: OfflineAction | null;
}>(), {
  title: 'This page is unavailable offline',
  description: 'This screen has not been cached on this device yet. Reconnect to load it, or return to a page you opened earlier. The app stays in read-only mode while you are offline.',
  primaryAction: null,
  secondaryAction: null,
});
</script>

<template>
  <div
    class="VOfflineDataUnavailable v-offline-data-unavailable"
    data-testid="offline-data-unavailable"
  >
    <VAlert
      variant="info"
      class="v-offline-data-unavailable__alert"
    >
      <template #title>
        {{ props.title }}
      </template>
      <template #description>
        {{ props.description }}
      </template>
      <div
        v-if="props.primaryAction || props.secondaryAction"
        class="v-offline-data-unavailable__actions"
      >
        <VButton
          v-if="props.primaryAction"
          size="small"
          :as="props.primaryAction?.to ? 'router-link' : undefined"
          :to="props.primaryAction?.to ?? undefined"
          :href="props.primaryAction?.href ?? undefined"
        >
          {{ props.primaryAction?.label }}
        </VButton>
        <VButton
          v-if="props.secondaryAction"
          size="small"
          variant="outlined"
          :as="props.secondaryAction?.to ? 'router-link' : undefined"
          :to="props.secondaryAction?.to ?? undefined"
          :href="props.secondaryAction?.href ?? undefined"
        >
          {{ props.secondaryAction?.label }}
        </VButton>
      </div>
    </VAlert>
  </div>
</template>

<style scoped lang="scss">
.v-offline-data-unavailable {
  width: 100%;

  &__alert {
    width: 100%;
    margin: 0;
  }

  &__actions {
    display: flex;
    flex-wrap: wrap;
    gap: 12px;
    margin-top: 12px;
  }
}
</style>

