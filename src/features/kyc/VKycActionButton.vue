<script setup lang="ts">
import { computed } from 'vue';
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

const buttonText = computed(() => alertModel.value.buttonText);
</script>

<template>
  <VButton
    v-if="buttonText"
    :size="size"
    :loading="alertModel.isLoading"
    :disabled="alertModel.isDisabled"
    @click="onPrimaryAction"
  >
    {{ buttonText }}
  </VButton>
</template>
