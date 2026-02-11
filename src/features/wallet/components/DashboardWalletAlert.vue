<script setup lang="ts">
import VAlert from 'UiKit/components/VAlert.vue';
import { useDashboardWalletAlert, type DashboardWalletAlertEmit } from './logic/useDashboardWalletAlert';

defineProps<{
  show: boolean;
  variant: string;
  alertText?: string;
  alertTitle?: string;
  buttonText?: string;
}>();

const emit = defineEmits<{
  click: [];
  contactUsClick: [event: Event];
}>();

const { handleDescriptionClick } = useDashboardWalletAlert(emit as DashboardWalletAlertEmit);
</script>

<template>
  <VAlert
    v-if="show"
    :variant="variant"
    data-testid="funding-alert"
    class="dashboard-wallet__alert"
    :button-text="buttonText"
    @click="emit('click')"
  >
    <template
      v-if="alertTitle"
      #title
    >
      {{ alertTitle }}
    </template>
    <template
      v-if="alertText"
      #description
    >
      <span
        v-dompurify-html="alertText"
        role="button"
        tabindex="0"
        @click="handleDescriptionClick"
        @keydown.enter="handleDescriptionClick"
        @keydown.space.prevent="handleDescriptionClick"
      />
    </template>
  </VAlert>
</template>
