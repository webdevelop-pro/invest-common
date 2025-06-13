<script setup lang="ts">
import { defineAsyncComponent } from 'vue';
import { useDialogs } from '../store/useDialogs';
import { storeToRefs } from 'pinia';

const VDialogLogOut = defineAsyncComponent({
  loader: () => import('InvestCommon/features/auth/components/VDialogLogOut.vue'),
});

const VDialogRefreshSession = defineAsyncComponent({
  loader: () => import('InvestCommon/features/auth/components/VDialogRefreshSession.vue'),
});

const useDialogsStore = useDialogs();
const { isDialogLogoutOpen, isDialogRefreshSessionOpen } = storeToRefs(useDialogsStore);
</script>

<template>
  <div>
    <VDialogLogOut
      v-model="isDialogLogoutOpen"
    />
    <VDialogRefreshSession
      v-model="isDialogRefreshSessionOpen"
    />
  </div>
</template>
