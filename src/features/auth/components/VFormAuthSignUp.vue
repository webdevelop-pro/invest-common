<script setup lang="ts">
import { storeToRefs } from 'pinia';
import VFormGroup from 'UiKit/components/Base/VForm/VFormGroup.vue';
import VFormInput from 'UiKit/components/Base/VForm/VFormInput.vue';
import VFormInputPassword from 'UiKit/components/Base/VForm/VFormInputPassword.vue';
import VButton from 'UiKit/components/Base/VButton/VButton.vue';
import VFormCheckbox from 'UiKit/components/Base/VForm/VFormCheckbox.vue';
import FormRow from 'UiKit/components/Base/VForm/VFormRow.vue';
import FormCol from 'UiKit/components/Base/VForm/VFormCol.vue';
import {
  urlTerms, urlPrivacy, urlBlog,
} from 'InvestCommon/domain/config/links';
import { useSignupStore } from '../store/useSignup';
import { onMounted, ref, watch } from 'vue';
import { useGlobalLoader } from 'UiKit/store/useGlobalLoader';

const signupStore = useSignupStore();
const {
  isLoading, model, isDisabledButton,
  setSignupState, queryFlow, checkbox,
} = storeToRefs(signupStore);

const globalLoader = useGlobalLoader();
const { isLoading: isGlobalLoading } = storeToRefs(globalLoader);
const isAuthLoading = ref(false);

const onLogin = () => {
  signupStore.onLogin();
};

const isDisabled = (field: string) => queryFlow.value && (field?.length > 1);

const signupHandler = async () => {
  signupStore.signupPasswordHandler();
};

const syncAuthLoading = (active: boolean) => {
  isAuthLoading.value = active;
  if (!active || typeof document === 'undefined') {
    return;
  }
  const activeElement = document.activeElement as HTMLElement | null;
  activeElement?.blur?.();
};

onMounted(() => {
  signupStore.onMountedHandler();
  syncAuthLoading(isGlobalLoading.value);
});

watch(isGlobalLoading, (active) => {
  syncAuthLoading(active);
});
</script>

<template>
  <form
    class="VFormAuthSignup signup-form"
    :class="{ 'is--auth-loading': isAuthLoading }"
    novalidate
  >
    <div class="signup-form__wrap">
      <FormRow>
        <FormCol col2>
          <VFormGroup
            v-slot="VFormGroupProps"
            :required="signupStore.isFieldRequired('first_name')"
            :error-text="signupStore.getErrorText('first_name', setSignupState.error?.data?.responseJson)"
            label="First Name"
            data-testid="first-name-group"
          >
            <VFormInput
              :model-value="model.first_name"
              :is-error="VFormGroupProps.isFieldError"
              placeholder="First Name"
              name="first-name"
              size="large"
              :disabled="isDisabled(model.first_name)"
              data-testid="first-name"
              class="signup-form__input"
              @update:model-value="model.first_name = $event.trim()"
            />
          </VFormGroup>
        </FormCol>
        <FormCol col2>
          <VFormGroup
            v-slot="VFormGroupProps"
            :required="signupStore.isFieldRequired('last_name')"
            :error-text="signupStore.getErrorText('last_name', setSignupState.error?.data?.responseJson)"
            label="Last Name"
            data-testid="last-name-group"
          >
            <VFormInput
              :model-value="model.last_name"
              :is-error="VFormGroupProps.isFieldError"
              placeholder="Last Name"
              name="last-name"
              data-testid="last-name"
              size="large"
              :disabled="isDisabled(model.last_name)"
              class="signup-form__input"
              @update:model-value="model.last_name = $event.trim()"
            />
          </VFormGroup>
        </FormCol>
      </FormRow>

      <div class="signup-form__input-wrap">
        <VFormGroup
          v-slot="VFormGroupProps"
          :required="signupStore.isFieldRequired('email')"
          :error-text="signupStore.getErrorText('email', setSignupState.error?.data?.responseJson)"
          label="Email Address"
          data-testid="email-group"
        >
          <VFormInput
            :model-value="model.email"
            :is-error="VFormGroupProps.isFieldError"
            placeholder="Enter Address"
            name="email"
            size="large"
            data-testid="email"
            :disabled="isDisabled(model.email)"
            type="email"
            class="signup-form__input"
            @update:model-value="model.email = $event.trim()"
          />
        </VFormGroup>
      </div>

      <div class="signup-form__input-wrap">
        <VFormGroup
          v-slot="VFormGroupProps"
          :required="signupStore.isFieldRequired('create_password')"
          :error-text="signupStore.getErrorText('create_password', setSignupState.error?.data?.responseJson)"
          label="Create Password"
          data-testid="create-password-group"
        >
          <VFormInputPassword
            :model-value="model.create_password"
            :is-error="VFormGroupProps.isFieldError"
            placeholder="Create Password"
            name="createPassword"
            size="large"
            :show-strength="true"
            data-testid="create-password"
            class="signup-form__input"
            @update:model-value="model.create_password = $event.trim()"
          />
        </VFormGroup>
      </div>

      <div class="signup-form__input-wrap">
        <VFormGroup
          v-slot="VFormGroupProps"
          :required="signupStore.isFieldRequired('repeat_password')"
          :error-text="signupStore.getErrorText('repeat_password', setSignupState.error?.data?.responseJson)"
          label="Confirm Password"
          data-testid="repeat-password-group"
        >
          <VFormInputPassword
            :model-value="model.repeat_password"
            :is-error="VFormGroupProps.isFieldError"
            placeholder="Confirm Password"
            name="repeatPassword"
            size="large"
            data-testid="repeat-password"
            class="signup-form__input"
            @update:model-value="model.repeat_password = $event.trim()"
          />
        </VFormGroup>
      </div>

      <VFormCheckbox
        v-model="checkbox"
        data-testid="V-checkbox"
        class="signup-form__checkbox"
      >
        <div class="signup-form__checkbox-text is--small">
          I agree with
          <a
            :href="urlTerms"
            target="_blank"
            rel="noopener noreferrer"
            class="is--link-2"
          >
            terms of use
          </a>
          and
          <a
            :href="urlPrivacy"
            target="_blank"
            rel="noopener noreferrer"
            class="is--link-2"
          >
            privacy policy
          </a>
          and I consent to the electronic delivery of all information
          pertaining to my use of this platform including, but not limited to,
          <a
            :href="urlBlog"
            target="_blank"
            rel="noopener noreferrer"
            class="is--link-2"
          >
            educational materials
          </a>,
          notices, and transaction confirmations.
        </div>
      </VFormCheckbox>

      <VButton
        block
        size="large"
        :loading="isLoading"
        :disabled="isDisabledButton"
        data-testid="button"
        class="signup-form__btn"
        @click.stop.prevent="signupHandler"
      >
        Sign Up
      </VButton>

      <div
        v-if="!queryFlow"
        class="signup-form__login-wrap  is--no-margin"
      >
        <span class="signup-form__login-label is--body">
          Already have an account?
        </span>

        <VButton
          variant="link"
          size="large"
          as="a"
          class="signup-form__login-btn"
          @click.prevent="onLogin"
        >
          Log In
        </VButton>
      </div>
    </div>
  </form>
</template>

<style lang="scss">
@use 'UiKit/styles/_variables.scss' as *;

.signup-form {
  $root: &;

  &.is--auth-loading,
  &.is--auth-loading input,
  &.is--auth-loading textarea {
    caret-color: transparent;
  }

  &__signup-wrap {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin: 70px 0;
  }

  &__signup-btn {
    max-width: 139px;
  }

  &__signup-label {
    font-size: 14px;
    line-height: 100%;
    color: $gray-80;
  }

  &__checkbox {
    margin-top: 20px;
  }

  &__btn {
    margin-top: 40px;
  }

  &__input-wrap {
    position: relative;

    & + & {
      margin-top: 25px;
    }
  }

  &__input {
    width: 100%;
  }

  &__wrap {
    padding: 40px;
    background: $white;
    box-shadow: $box-shadow-medium;

    @media screen and (width < $tablet){
      padding: 20px;
    }
  }

  &__checkbox-text {
    color: $gray-80;
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
