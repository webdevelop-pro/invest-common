<script setup lang="ts">
import { computed } from 'vue';
import VAlert from 'UiKit/components/VAlert.vue';
import VButton from 'UiKit/components/Base/VButton/VButton.vue';
import VSpinner from 'UiKit/components/Base/VSpinner/VSpinner.vue';

const props = withDefaults(defineProps<{
  variant: 'error' | 'info';
  description: string;
  title?: string;
  buttonText?: string;
  isLoading?: boolean;
  isDisabled?: boolean;
}>(), {
  title: undefined,
  buttonText: undefined,
  isLoading: false,
  isDisabled: false,
});

const emit = defineEmits<{
  action: [];
  descriptionAction: [event: Event];
}>();

const buttonColor = computed(() => (props.variant === 'info' ? 'primary' : 'red'));
const hasDescriptionAction = computed(() => (
  props.description.includes('data-action="contact-us"')
  || props.description.includes('data-action=\'contact-us\'')
  || props.description.includes('bank-accounts')
));

const handleDescriptionAction = (event: Event) => {
  if (!hasDescriptionAction.value) {
    return;
  }

  emit('descriptionAction', event);
};
</script>

<template>
  <div class="dashboard-wallet__alert-wrapper">
    <VAlert
      :variant="variant"
      data-testid="funding-alert"
      class="dashboard-wallet__alert"
      @click="handleDescriptionAction($event)"
    >
      <template
        v-if="title"
        #title
      >
        {{ title }}
      </template>
      <template #description>
        <span
          v-dompurify-html="description"
        />
      </template>
      <VButton
        v-if="buttonText"
        size="small"
        :color="buttonColor"
        :loading="isLoading"
        :disabled="isDisabled"
        class="dashboard-wallet__alert-button is--margin-top-0"
        @click="emit('action')"
      >
        {{ buttonText }}
      </VButton>
    </VAlert>

    <VSpinner
      :show="isLoading"
    />
  </div>
</template>
