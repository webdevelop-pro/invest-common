<script setup lang="ts">
import { computed } from 'vue';
import VAlert from 'UiKit/components/VAlert.vue';
import VButton from 'UiKit/components/Base/VButton/VButton.vue';

const props = withDefaults(defineProps<{
  variant: 'error' | 'info';
  title: string;
  description: string;
  buttonText?: string;
  isLoading?: boolean;
  isDisabled?: boolean;
}>(), {
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
));

const handleDescriptionAction = (event: Event) => {
  if (!hasDescriptionAction.value) {
    return;
  }

  emit('descriptionAction', event);
};
</script>

<template>
  <VAlert
    :variant="variant"
    class="VKycAlert v-kyc-alert"
    @click="handleDescriptionAction($event)"
  >
    <template #title>
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
      class="v-kyc-alert__button is--margin-top-0"
      @click="emit('action')"
    >
      {{ buttonText }}
    </VButton>
  </VAlert>
</template>

<style lang="scss">
.v-kyc-alert {
  margin: 0;
}
</style>
