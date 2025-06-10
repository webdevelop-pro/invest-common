<script setup lang="ts">
import { storeToRefs } from 'pinia';
import VFormGroup from 'UiKit/components/Base/VForm/VFormGroup.vue';
import VFormInput from 'UiKit/components/Base/VForm/VFormInput.vue';
import VFormInputPassword from 'UiKit/components/Base/VForm/VFormInputPassword.vue';
import VButton from 'UiKit/components/Base/VButton/VButton.vue';
import { urlForgot } from 'InvestCommon/global/links';
import { useLoginStore } from '../store/useLogin';

const loginStore = useLoginStore();
const {
  isLoading, model, validation, isDisabledButton,
  schemaBackend, schemaFrontend, setLoginState,
} = storeToRefs(loginStore);

const onSignup = () => {
  loginStore.onSignup();
};

const loginHandler = async () => {
  loginStore.loginPasswordHandler();
};
</script>

<template>
  <form
    class="LogInForm login-form"
    novalidate
    data-testid="login-form"
  >
    <div class="login-form__wrap">
      <VFormGroup
        v-slot="VFormGroupProps"
        :model="model"
        :validation="validation"
        :schema-back="schemaBackend"
        :schema-front="schemaFrontend"
        :error-text="setLoginState.error?.email"
        path="email"
        label="Email Address"
        class="login-form__input"
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
      <VFormGroup
        v-slot="VFormGroupProps"
        :model="model"
        :validation="validation"
        :schema-back="schemaBackend"
        :schema-front="schemaFrontend"
        :error-text="setLoginState.error?.password"
        path="password"
        label="Password"
        class="login-form__input"
      >
        <VFormInputPassword
          :model-value="model.password"
          :is-error="VFormGroupProps.isFieldError"
          placeholder="Password"
          name="password"
          size="large"
          data-testid="password"
          @update:model-value="model.password = $event"
        />
      </VFormGroup>

      <a
        :href="urlForgot"
        class="login-form__forgot is--link-2"
      >
        Forgot password?
      </a>

      <VButton
        block
        size="large"
        :loading="isLoading"
        :disabled="isDisabledButton"
        data-testid="signup"
        class="login-form__btn"
        @click.stop.prevent="loginHandler"
      >
        Log In
      </VButton>

      <div
        class="login-form__signup-wrap  is--no-margin"
      >
        <span class="login-form__signup-label is--body">
          Don't have an account?
        </span>

        <VButton
          variant="link"
          size="large"
          class="login-form__signup-btn"
          @click.prevent="onSignup"
        >
          Sign Up
        </VButton>
      </div>
    </div>
  </form>
</template>

<style lang="scss">
.login-form {

  &__forgot {
    margin-top: 4px;
    display: block;
  }

  &__signup-wrap {
    display: flex;
    align-items: center;
    justify-content: center;
    margin-top: 12px;
    gap: 12px;
  }

  &__signup-label {
    color: $gray-80;
  }

  &__btn {
    margin-top: 40px;
  }

  &__input {
    & + & {
      margin-top: 20px;
    }
  }

  &__input-icon {
    color: $gray-70;
    width: 20px;
    height: 20px;
    display: flex;
  }

  &__wrap {
    padding: 40px;
    background: $white;
    box-shadow: $box-shadow-medium;
  }
}
</style>
