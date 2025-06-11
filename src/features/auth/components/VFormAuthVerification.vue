<script setup lang="ts">
import { storeToRefs } from 'pinia';
import { useVerificationStore } from '../store/useVerification';
import VFormGroup from 'UiKit/components/Base/VForm/VFormGroup.vue';
import VFormInput from 'UiKit/components/Base/VForm/VFormInput.vue';
import VButton from 'UiKit/components/Base/VButton/VButton.vue';

const verificationStore = useVerificationStore();
const {
  model,
  validation,
  isLoading,
  isDisabledButton,
  setRecoveryState,
  schemaFrontend,
} = storeToRefs(verificationStore);

const verificationHandler = async () => {
  verificationStore.verificationHandler();
};
const resendHandler = async () => {
  verificationStore.resendHandler();
};
</script>

<template>
  <form
    class="VFormAuthVerification verification-form"
    novalidate
  >
    <VFormGroup
      v-slot="VFormGroupProps"
      :model="model"
      :validation="validation"
      :schema-front="schemaFrontend"
      :error-text="setRecoveryState?.code"
      path="code"
      label="Verification Code"
      class="verification-form__input"
    >
      <VFormInput
        :model-value="model.code"
        :is-error="VFormGroupProps.isFieldError"
        placeholder="Enter code"
        name="code"
        size="large"
        data-testid="code"
        @update:model-value="model.code = $event"
      />
    </VFormGroup>

    <div class="verification-form__text is--small">
      Enter the verification code we just sent you on your email address
    </div>

    <VButton
      size="large"
      block
      data-testid="button"
      :loading="isLoading"
      :disabled="isDisabledButton"
      class="verification-form__btn"
      @click.prevent="verificationHandler"
    >
      Verify Code
    </VButton>

    <div class="verification-form__login-wrap is--no-margin">
      <span class="verification-form__login-label is--body">
        Didn't receive the email?
      </span>

      <VButton
        variant="link"
        size="large"
        class="verification-form__login-btn"
        @click.prevent="resendHandler"
      >
        Resend Code
      </VButton>
    </div>
  </form>
</template>

<style lang="scss">
.verification-form {
  padding: 40px;
  background: $white;
  box-shadow: $box-shadow-medium;

  &__text {
    color: $gray-70;
    margin-top: 4px;
  }

  &__btn {
    margin-top: 40px;
  }

  &__signup-btn {
    margin-top: 12px;
  }

  &__login-wrap {
    display: flex;
    align-items: center;
    justify-content: center;
    margin-top: 12px;
    gap: 12px;
  }

  &__login-label {
    color: $gray-80;
  }
}
</style>
