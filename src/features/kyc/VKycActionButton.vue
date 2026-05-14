<script setup lang="ts">
import { useKycAlertViewModel } from './logic/useKycAlertViewModel';
import VButton from 'UiKit/components/Base/VButton/VButton.vue';

withDefaults(defineProps<{
  size?: 'small' | 'large';
}>(), {
  size: 'small',
});

const {
  alertModel,
  onPrimaryAction,
} = useKycAlertViewModel();
</script>

<template>
  <VButton
    v-if="alertModel.buttonText"
    :size="size"
    :loading="alertModel.isLoading"
    :disabled="alertModel.isDisabled"
    @click="onPrimaryAction"
  >
    {{ alertModel.buttonText }}
  </VButton>
</template>
