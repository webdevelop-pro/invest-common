<script setup lang="ts">
import { urlSignin } from 'InvestCommon/global/links';
import { useForgotStore } from '../store/useForgot';
import VFormGroup from 'UiKit/components/Base/VForm/VFormGroup.vue';
import VFormInput from 'UiKit/components/Base/VForm/VFormInput.vue';
import VButton from 'UiKit/components/Base/VButton/VButton.vue';
import { storeToRefs } from 'pinia';

const forgotStore = useForgotStore();
const {
  model, validation, schemaBackend, isDisabledButton, setRecoveryState,
  isLoading, schemaFrontend,
} = storeToRefs(forgotStore);

const onSubmit = () => {
  forgotStore.recoveryHandler();
};
</script>

<template>
  <form
    class="VFormAuthForgot forgot-form"
    novalidate
    @submit.prevent="onSubmit()"
  >
    <VFormGroup
      v-slot="VFormGroupProps"
      :model="model"
      :validation="validation"
      :schema-back="schemaBackend"
      :schema-front="schemaFrontend"
      :error-text="setRecoveryState?.error?.email"
      path="email"
      label="Email Address"
      class="forgot-form__input"
    >
      <VFormInput
        :model-value="model.email"
        :is-error="VFormGroupProps.isFieldError"
        placeholder="Enter Address"
        name="email"
        size="large"
        type="email"
        data-testid="email"
        @update:model-value="model.email = $event"
      />
    </VFormGroup>

    <div class="forgot-form__text is--small">
      Enter your email address and we'll send you a code to reset your password.
    </div>

    <VButton
      size="large"
      block
      data-testid="button"
      :loading="isLoading"
      :disabled="isDisabledButton"
      class="forgot-form__btn"
    >
      Send Code
    </VButton>
    <VButton
      variant="link"
      size="large"
      block
      as="a"
      :href="urlSignin"
      class="forgot-form__signup-btn"
    >
      Back to Login
    </VButton>
  </form>
</template>

<style lang="scss">
.forgot-form {
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
}
</style>
