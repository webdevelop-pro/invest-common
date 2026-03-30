<script setup lang="ts">
import { computed } from 'vue';
import { storeToRefs } from 'pinia';
import VAlert from 'UiKit/components/VAlert.vue';
import { useAccreditationStatus } from './store/useAccreditationStatus';

const props = defineProps<{
  variant: 'error' | 'info';
  title: string;
  description: string;
  buttonText?: string;
}>();

const accreditationButtonStore = useAccreditationStatus();
const { dataAlert } = storeToRefs(accreditationButtonStore);

const resolvedTitle = computed(() => dataAlert.value.title || props.title);
const resolvedDescription = computed(() => dataAlert.value.description || props.description);
const resolvedButtonText = computed(() => props.buttonText);
</script>

<template>
  <VAlert
    :variant="variant"
    :button-text="resolvedButtonText"
    class="VAccreditationAlert v-accreditation-alert"
    @click="accreditationButtonStore.onClick"
  >
    <template #title>
      {{ resolvedTitle }}
    </template>
    <template #description>
      <span
        v-dompurify-html="resolvedDescription"
        role="button"
        tabindex="0"
        @click="accreditationButtonStore.onAlertDescriptionClick($event)"
        @keydown.enter="accreditationButtonStore.onAlertDescriptionClick($event)"
        @keydown.space.prevent="accreditationButtonStore.onAlertDescriptionClick($event)"
      />
    </template>
  </VAlert>
</template>

<style lang="scss">
.v-accreditation-alert {
  margin: 0;
}
</style>
