<script setup lang="ts">
import { computed } from 'vue';
import VAlert from 'UiKit/components/VAlert.vue';
import VButton from 'UiKit/components/Base/VButton/VButton.vue';
import VSkeleton from 'UiKit/components/Base/VSkeleton/VSkeleton.vue';

const props = withDefaults(defineProps<{
  variant?: 'error' | 'info';
  title?: string;
  description?: string;
  buttonText?: string;
  isLoading?: boolean;
  isDisabled?: boolean;
}>(), {
  variant: 'info',
  title: undefined,
  description: undefined,
  buttonText: undefined,
  isLoading: false,
  isDisabled: false,
});

const emit = defineEmits<{
  action: [];
  descriptionAction: [event: Event];
}>();

const buttonColor = computed(() => (props.variant === 'info' ? 'primary' : 'red'));
const hasDescriptionAction = computed(() => !!props.description?.includes('data-action="contact-us"'));

const handleDescriptionAction = (event: Event) => {
  if (!hasDescriptionAction.value) return;
  emit('descriptionAction', event);
};
</script>

<template>
  <VSkeleton
    v-if="isLoading && !title"
    height="72px"
    width="100%"
  />
  <VAlert
    v-else
    :variant="variant"
    class="VAccreditationAlert v-accreditation-alert"
    @click="handleDescriptionAction($event)"
  >
    <template #title>
      {{ title }}
    </template>
    <template #description>
      <span v-dompurify-html="description" />
    </template>
    <VButton
      v-if="buttonText"
      size="small"
      :color="buttonColor"
      :loading="isLoading"
      :disabled="isDisabled"
      class="v-accreditation-alert__button is--margin-top-0"
      @click="emit('action')"
    >
      {{ buttonText }}
    </VButton>
  </VAlert>
</template>

<style lang="scss">
.v-accreditation-alert {
  margin: 0;
}
</style>
