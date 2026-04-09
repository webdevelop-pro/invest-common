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

const VDialogWalletAuth = defineAsyncComponent({
  loader: () => import('InvestCommon/features/wallet/components/VDialogWalletAuth.vue'),
});

const useDialogsStore = useDialogs();
const {
  isDialogLogoutOpen,
  isDialogRefreshSessionOpen,
  isDialogContactUsOpen,
  isDialogWalletAuthOpen,
  dialogContactUsSubject,
} = storeToRefs(useDialogsStore);
</script>

<template>
  <div class="v-dialogs">
    <div
      id="alchemy-signer-iframe-container"
      class="v-dialogs__wallet-auth-iframe"
    />
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
    <VDialogWalletAuth
      v-model:open="isDialogWalletAuthOpen"
    />
  </div>
</template>

<style lang="scss" scoped>
.v-dialogs {
  &__wallet-auth-iframe {
    width: 0;
    height: 0;
    overflow: hidden;
  }
}
</style>
