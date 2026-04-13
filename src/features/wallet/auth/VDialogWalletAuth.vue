<script setup lang="ts">
import {
  VDialog,
  VDialogContent,
  VDialogHeader,
  VDialogTitle,
  VDialogFooter,
} from 'UiKit/components/Base/VDialog';
import VButton from 'UiKit/components/Base/VButton/VButton.vue';
import VFormWalletAuthOtp from './components/VFormWalletAuthOtp.vue';
import { useVDialogWalletAuth } from './composables/useVDialogWalletAuth';

const open = defineModel<boolean>('open');

const {
  codeValue,
  isBusy,
  isCodeStep,
  isOtpStep,
  isMfaStep,
  isSuccessStep,
  dialogTitle,
  stepDescription,
  inputLabel,
  inputPlaceholder,
  inputHelperText,
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
        <VFormWalletAuthOtp
          v-if="isCodeStep"
          v-model:code-value="codeValue"
          :description="stepDescription"
          :input-label="inputLabel"
          :input-placeholder="inputPlaceholder"
          :input-helper-text="inputHelperText"
          :input-test-id="isMfaStep ? 'wallet-auth-mfa' : 'wallet-auth-otp'"
          :submit-button-text="primaryButtonText"
          :is-busy="isBusy"
          :is-otp-step="isOtpStep"
          :is-mfa-step="isMfaStep"
          :is-error-step="false"
          :is-submit-disabled="isPrimaryDisabled"
          mode="dialog"
          @submit="handlePrimaryClick"
        />

        <p
          v-else
          class="v-dialog-wallet-auth__description"
        >
          {{ stepDescription }}
        </p>
      </div>

      <VDialogFooter class="v-dialog-wallet-auth__footer">
        <VButton
          variant="outlined"
          @click="closeDialog"
        >
          {{ isSuccessStep ? 'Close' : 'Cancel' }}
        </VButton>
        <VButton
          v-if="!isCodeStep"
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
}
</style>
