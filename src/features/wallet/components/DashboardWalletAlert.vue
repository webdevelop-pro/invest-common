<script setup lang="ts">
import { computed } from 'vue';
import VAlert from 'UiKit/components/VAlert.vue';
import VButton from 'UiKit/components/Base/VButton/VButton.vue';
import VSpinner from 'UiKit/components/Base/VSpinner/VSpinner.vue';
import VSkeleton from 'UiKit/components/Base/VSkeleton/VSkeleton.vue';

const props = withDefaults(defineProps<{
  variant?: 'error' | 'info';
  description?: string;
  title?: string;
  buttonText?: string;
  isLoading?: boolean;
  isDataLoading?: boolean;
  isDisabled?: boolean;
}>(), {
  variant: 'info',
  description: undefined,
  title: undefined,
  buttonText: undefined,
  isLoading: false,
  isDataLoading: false,
  isDisabled: false,
});

const emit = defineEmits<{
  action: [];
  descriptionAction: [event: Event];
}>();

const buttonColor = computed(() => (props.variant === 'info' ? 'primary' : 'red'));
const hasDescriptionAction = computed(() => (
  !!props.description?.includes('data-action="contact-us"')
  || !!props.description?.includes('data-action=\'contact-us\'')
  || !!props.description?.includes('data-action="connect-bank-account"')
  || !!props.description?.includes('data-action=\'connect-bank-account\'')
));

const handleDescriptionAction = (event: Event) => {
  if (!hasDescriptionAction.value) {
    return;
  }

  emit('descriptionAction', event);
};
</script>

<template>
  <VSkeleton
    v-if="isDataLoading"
    height="72px"
    width="100%"
  />
  <div
    v-else
    class="dashboard-wallet__alert-wrapper"
  >
    <VAlert
      :variant="variant"
      data-testid="funding-alert"
      class="dashboard-wallet__alert"
    >
      <template
        v-if="title"
        #title
      >
        {{ title }}
      </template>
      <template #description>
        <!-- eslint-disable-next-line vuejs-accessibility/no-static-element-interactions, vuejs-accessibility/click-events-have-key-events -->
        <span
          v-dompurify-html="description"
          class="dashboard-wallet__alert-description"
          @click="handleDescriptionAction"
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
