<script setup lang="ts">
import VFormWalletAuthOtp from './components/VFormWalletAuthOtp.vue';
import { useWalletAuthOtpPage } from './composables/useWalletAuthOtpPage';

const {
  title,
  codeValue,
  description,
  inputLabel,
  inputPlaceholder,
  inputHelperText,
  submitButtonText,
  isBusy,
  isOtpStep,
  isMfaStep,
  isErrorStep,
  isSubmitDisabled,
  retry,
  submitCurrentStep,
} = useWalletAuthOtpPage();
</script>

<template>
  <div class="ViewWalletAuthOtp view-wallet-auth-otp">
    <div class="view-wallet-auth-otp__wrap">
      <h1 class="view-wallet-auth-otp__title">
        {{ title }}
      </h1>

      <VFormWalletAuthOtp
        v-model:code-value="codeValue"
        class="view-wallet-auth-otp__form"
        :description="description"
        :input-label="inputLabel"
        :input-placeholder="inputPlaceholder"
        :input-helper-text="inputHelperText"
        :submit-button-text="submitButtonText"
        :is-busy="isBusy"
        :is-otp-step="isOtpStep"
        :is-mfa-step="isMfaStep"
        :is-error-step="isErrorStep"
        :is-submit-disabled="isSubmitDisabled"
        :show-retry-button="isErrorStep"
        @retry="retry"
        @submit="submitCurrentStep"
      />
    </div>
  </div>
</template>

<style lang="scss">
@use 'UiKit/styles/_variables.scss' as *;

.view-wallet-auth-otp {
  width: 100%;
  min-height: 100vh;
  padding-top: $header-height;

  &__wrap {
    max-width: 558px;
    margin: 40px auto 130px;

    @media screen and (width < $tablet) {
      margin: 40px auto 100px;
      padding: 0 15px;
    }
  }

  &__title {
    margin-bottom: 40px;
    text-align: center;
  }
}
</style>
