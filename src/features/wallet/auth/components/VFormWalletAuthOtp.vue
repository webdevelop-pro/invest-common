<script setup lang="ts">
import { computed } from 'vue';
import VFormGroup from 'UiKit/components/Base/VForm/VFormGroup.vue';
import VFormInputOtp from 'UiKit/components/Base/VForm/VInputOtp/VFormInputOtp.vue';
import VButton from 'UiKit/components/Base/VButton/VButton.vue';

type WalletAuthOtpFormProps = {
  description?: string;
  inputLabel?: string;
  inputPlaceholder?: string;
  inputHelperText?: string;
  inputTestId?: string;
  isBusy: boolean;
  isOtpStep: boolean;
  isMfaStep?: boolean;
  isErrorStep: boolean;
  isSubmitDisabled?: boolean;
  mode?: 'page' | 'dialog';
  showRetryButton?: boolean;
  submitButtonText?: string;
};

const props = withDefaults(defineProps<WalletAuthOtpFormProps>(), {
  description: '',
  inputLabel: 'Email Verification Code',
  inputPlaceholder: 'Enter email code',
  inputHelperText: 'Enter the 6-digit code we sent to your email.',
  inputTestId: 'wallet-auth-page-otp',
  isMfaStep: false,
  isSubmitDisabled: undefined,
  mode: 'page',
  showRetryButton: false,
  submitButtonText: 'Continue',
});

const codeValue = defineModel<string>('codeValue', { required: true });

const emit = defineEmits<{
  retry: [];
  submit: [];
}>();

const isCodeStep = computed(() => props.isOtpStep || props.isMfaStep);
const resolvedSubmitDisabled = computed(() => props.isSubmitDisabled ?? (isCodeStep.value && !codeValue.value));
const showCodeField = computed(() => isCodeStep.value);
</script>

<template>
  <form
    class="VFormWalletAuthOtp wallet-auth-otp-form"
    novalidate
    data-testid="wallet-auth-otp-form"
    @submit.prevent="emit('submit')"
  >
    <div
      class="wallet-auth-otp-form__wrap"
      :class="{ 'wallet-auth-otp-form__wrap--dialog': props.mode === 'dialog' }"
    >
      <p
        v-if="description"
        class="wallet-auth-otp-form__description"
      >
        {{ description }}
      </p>

      <VFormGroup
        v-if="showCodeField"
        v-slot="VFormGroupProps"
        :label="inputLabel"
        :helper-text="inputHelperText"
        required
        class="wallet-auth-otp-form__input"
        data-testid="wallet-auth-otp-group"
      >
        <VFormInputOtp
          v-model="codeValue"
          :is-error="VFormGroupProps.isFieldError"
          :data-testid="inputTestId"
          class="wallet-auth-otp-form__input-otp"
          @complete="emit('submit')"
        />
      </VFormGroup>

      <VButton
        v-if="isErrorStep && showRetryButton"
        variant="outlined"
        size="large"
        block
        class="wallet-auth-otp-form__retry"
        @click.prevent="emit('retry')"
      >
        Send New Code
      </VButton>

      <VButton
        type="submit"
        size="large"
        block
        :loading="isBusy"
        :disabled="resolvedSubmitDisabled"
        class="wallet-auth-otp-form__submit"
      >
        {{ submitButtonText }}
      </VButton>
    </div>
  </form>
</template>

<style lang="scss">
@use 'UiKit/styles/_variables.scss' as *;

.wallet-auth-otp-form {
  &__wrap {
    padding: 40px;
    background: $white;
    box-shadow: $box-shadow-medium;

    @media screen and (width < $tablet) {
      padding: 20px;
    }
  }

  &__wrap--dialog {
    padding: 0;
    background: transparent;
    box-shadow: none;
  }

  &__description {
    margin: 0 0 16px;
    color: $gray-70;
  }

  &__submit {
    margin-top: 40px;
  }

  &__retry {
    margin-top: 24px;
  }
}
</style>
