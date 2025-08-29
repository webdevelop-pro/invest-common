<script setup lang="ts">
import { storeToRefs } from 'pinia';
import { useVerificationStore } from '../store/useVerification';
import VFormGroup from 'UiKit/components/Base/VForm/VFormGroup.vue';
import VFormInput from 'UiKit/components/Base/VForm/VFormInput.vue';
import VButton from 'UiKit/components/Base/VButton/VButton.vue';
import { urlForgot } from 'InvestCommon/global/links';

const verificationStore = useVerificationStore();
const {
  model, isLoading, isDisabledButton,
  setRecoveryState,
} = storeToRefs(verificationStore);

const verificationHandler = async () => {
  verificationStore.verificationHandler();
};
</script>

<template>
  <form
    class="VFormAuthVerification verification-form"
    novalidate
    @submit.prevent="verificationHandler()"
  >
    <VFormGroup
      v-slot="VFormGroupProps"
      :required="verificationStore.isFieldRequired('code')"
      :error-text="verificationStore.getErrorText('code', setRecoveryState.error?.data?.responseJson)"
      label="Verification Code"
      class="verification-form__input"
      data-testid="code-group"
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
      type="submit"
      size="large"
      block
      :loading="isLoading"
      :disabled="isDisabledButton"
      class="verification-form__btn"
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
        as="a"
        :href="urlForgot"
        class="verification-form__login-btn"
      >
        Resend Code
      </VButton>
    </div>
  </form>
</template>

<style lang="scss">
@use 'UiKit/styles/_variables.scss' as *;

.verification-form {
  padding: 40px;
  background: $white;
  box-shadow: $box-shadow-medium;

  @media screen and (width < $tablet){
      padding: 20px;
  }

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

    @media screen and (width < $tablet){
      flex-direction: column;
      margin-top: 20px;
    }
  }

  &__login-label {
    color: $gray-80;
  }

  &__login-btn {
    @media screen and (width < $tablet){
      width: 100%;
    }
  }
}
</style>
