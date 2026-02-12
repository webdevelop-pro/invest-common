<script setup lang="ts">
import VButton from 'UiKit/components/Base/VButton/VButton.vue';

defineProps<{
  primaryLabel: string;
  cancelLabel?: string;
  disabled?: boolean;
  loading?: boolean;
  primaryTestId?: string;
  cancelTestId?: string;
  footerClass?: string;
}>();

const emit = defineEmits<{
  submit: [];
  cancel: [];
}>();
</script>

<template>
  <div
    class="VLayoutDialogForm v-layout-dialog-form"
    :class="{ 'is--loading': loading }"
  >
    <div class="v-layout-dialog-form__content">
      <slot />
    </div>
    <div
      class="v-layout-dialog-form__footer"
      :class="footerClass"
    >
      <VButton
        variant="outlined"
        :data-testid="cancelTestId"
        @click="emit('cancel')"
      >
        {{ cancelLabel ?? 'Cancel' }}
      </VButton>
      <VButton
        :disabled="disabled"
        :loading="loading"
        :data-testid="primaryTestId"
        @click="emit('submit')"
      >
        {{ primaryLabel }}
      </VButton>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.v-layout-dialog-form {
  $root: &;

  &.is--loading {
    cursor: wait !important;

    #{$root}__content {
      opacity: 0.5;
      pointer-events: none;
    }
  }

  &__content {
    width: 100%;
  }

  &__footer {
    display: flex;
    justify-content: flex-end;
    align-items: center;
    gap: 12px;
    margin-top: 20px;
    margin-bottom: 4px;
  }
}
</style>

