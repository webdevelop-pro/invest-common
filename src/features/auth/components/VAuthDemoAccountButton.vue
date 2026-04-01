<script setup lang="ts">
import VButton from 'UiKit/components/Base/VButton/VButton.vue';

defineProps<{
  disabled?: boolean;
  loading?: boolean;
  visible: boolean;
}>();

const emit = defineEmits<{
  click: [];
}>();
</script>

<template>
  <VButton
    v-if="visible"
    block
    size="large"
    color="secondary"
    :loading="loading"
    :disabled="disabled"
    class="VAuthDemoAccountButton auth-demo-account-button"
    data-testid="demo-account-button"
    @click.stop.prevent="emit('click')"
  >
    Try Demo Account
  </VButton>
</template>

<style lang="scss">
.auth-demo-account-button {
  margin-top: 12px;
}
</style>
