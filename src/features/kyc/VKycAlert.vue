<script setup lang="ts">
import { computed } from 'vue';
import { storeToRefs } from 'pinia';
import VAlert from 'UiKit/components/VAlert.vue';
import { useKycStatus } from './store/useKycStatus';

const props = defineProps<{
  variant: 'error' | 'info';
  title: string;
  description: string;
  buttonText?: string;
}>();

const kycStatusStore = useKycStatus();
const { dataAlert } = storeToRefs(kycStatusStore);

const resolvedTitle = computed(() => dataAlert.value.title || props.title);
const resolvedDescription = computed(() => dataAlert.value.description || props.description);
const resolvedButtonText = computed(() => props.buttonText || dataAlert.value.buttonText);
</script>

<template>
  <VAlert
    :variant="variant"
    :button-text="resolvedButtonText"
    class="VKycAlert v-kyc-alert"
    @click="kycStatusStore.onClick"
  >
    <template #title>
      {{ resolvedTitle }}
    </template>
    <template #description>
      <span
        v-dompurify-html="resolvedDescription"
        role="button"
        tabindex="0"
        @click="kycStatusStore.onAlertDescriptionClick($event)"
        @keydown.enter="kycStatusStore.onAlertDescriptionClick($event)"
        @keydown.space.prevent="kycStatusStore.onAlertDescriptionClick($event)"
      />
    </template>
  </VAlert>
</template>

<style lang="scss">
.v-kyc-alert {
  margin: 0;
}
</style>
