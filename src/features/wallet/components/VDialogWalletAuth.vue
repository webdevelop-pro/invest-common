<script setup lang="ts">
import {
  VDialog,
  VDialogContent,
  VDialogHeader,
  VDialogTitle,
  VDialogFooter,
} from 'UiKit/components/Base/VDialog';
import VButton from 'UiKit/components/Base/VButton/VButton.vue';
import VFormInput from 'UiKit/components/Base/VForm/VFormInput.vue';
import { useVDialogWalletAuth } from './logic/useVDialogWalletAuth';

const open = defineModel<boolean>('open');

const {
  otpCode,
  mfaCode,
  isBusy,
  isOtpStep,
  isMfaStep,
  isSuccessStep,
  dialogTitle,
  stepDescription,
  primaryButtonText,
  isPrimaryDisabled,
  closeDialog,
  handlePrimaryClick,
} = useVDialogWalletAuth({
  open,
});
</script>

<template>
  <VDialog
    v-model:open="open"
    query-key="popup"
    query-value="wallet-auth"
  >
    <VDialogContent
      :aria-describedby="undefined"
      class="v-dialog-wallet-auth"
    >
      <VDialogHeader>
        <VDialogTitle>
          {{ dialogTitle }}
        </VDialogTitle>
      </VDialogHeader>

      <div class="v-dialog-wallet-auth__body is--margin-top-20">
        <p class="v-dialog-wallet-auth__description">
          {{ stepDescription }}
        </p>

        <VFormInput
          v-if="isOtpStep"
          v-model="otpCode"
          placeholder="Enter email code"
          data-testid="wallet-auth-otp"
          allow-integer-only
          class="v-dialog-wallet-auth__input"
        />

        <VFormInput
          v-if="isMfaStep"
          v-model="mfaCode"
          placeholder="Enter authenticator code"
          data-testid="wallet-auth-mfa"
          allow-integer-only
          class="v-dialog-wallet-auth__input"
        />

        <div
          id="alchemy-signer-iframe-container"
          class="v-dialog-wallet-auth__iframe"
        />
      </div>

      <VDialogFooter class="v-dialog-wallet-auth__footer">
        <VButton
          variant="outlined"
          @click="closeDialog"
        >
          {{ isSuccessStep ? 'Close' : 'Cancel' }}
        </VButton>
        <VButton
          :loading="isBusy"
          :disabled="isPrimaryDisabled"
          @click="handlePrimaryClick"
        >
          {{ primaryButtonText }}
        </VButton>
      </VDialogFooter>
    </VDialogContent>
  </VDialog>
</template>

<style lang="scss">
.v-dialog-wallet-auth {
  width: 100%;
  max-width: 560px;

  &__body {
    display: flex;
    flex-direction: column;
    gap: 16px;
  }

  &__description {
    margin: 0;
    color: $gray-70;
  }

  &__footer {
    display: flex;
    justify-content: flex-end;
    gap: 12px;
    margin-top: 24px;
  }

  &__iframe {
    width: 0;
    height: 0;
    overflow: hidden;
  }
}
</style>
