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

const VDialogContactUs = defineAsyncComponent({
  loader: () => import('InvestCommon/shared/components/dialogs/VDialogContactUs.vue'),
});

const useDialogsStore = useDialogs();
const {
  isDialogLogoutOpen,
  isDialogRefreshSessionOpen,
  isDialogContactUsOpen,
  dialogContactUsSubject,
} = storeToRefs(useDialogsStore);
</script>

<template>
  <div>
    <VDialogLogOut
      v-model="isDialogLogoutOpen"
    />
    <VDialogRefreshSession
      v-model="isDialogRefreshSessionOpen"
    />
    <VDialogContactUs
      v-model:open="isDialogContactUsOpen"
      :subject="dialogContactUsSubject ?? undefined"
    />
  </div>
</template>
