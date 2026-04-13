<script setup lang="ts">
import VDialogWalletAuth from '../auth/VDialogWalletAuth.vue';

const open = defineModel<boolean>('open');
</script>

<template>
  <VDialogWalletAuth v-model:open="open" />
</template>
