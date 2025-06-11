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
} from 'InvestCommon/global/links';
import { useSignupStore } from '../store/useSignup';
import { onMounted } from 'vue';

const signupStore = useSignupStore();
const {
  isLoading, model, validation, isDisabledButton,
  schemaBackend, schemaFrontend, setSignupState,
  queryFlow, checkbox,
} = storeToRefs(signupStore);

const onLogin = () => {
  signupStore.onLogin();
};

const isDisabled = (field: string) => queryFlow.value && (field?.length > 1);

const signupHandler = async () => {
  signupStore.signupPasswordHandler();
};

onMounted(() => {
  signupStore.onMountedHandler();
});
</script>

<template>
  <form
    class="VFormAuthSignup signup-form"
    novalidate
  >
    <div class="signup-form__wrap">
      <FormRow>
        <FormCol col2>
          <VFormGroup
            v-slot="VFormGroupProps"
            :model="model"
            :validation="validation"
            :schema-back="schemaBackend"
            :schema-front="schemaFrontend"
            :error-text="setSignupState.error?.first_name"
            path="first_name"
            label="First Name"
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
            :model="model"
            :validation="validation"
            :schema-back="schemaBackend"
            :schema-front="schemaFrontend"
            :error-text="setSignupState.error?.last_name"
            path="last_name"
            label="Last Name"
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
          :model="model"
          :validation="validation"
          :schema-back="schemaBackend"
          :schema-front="schemaFrontend"
          :error-text="setSignupState.error?.email"
          path="email"
          label="Email Address"
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
          :model="model"
          :validation="validation"
          :schema-back="schemaBackend"
          :schema-front="schemaFrontend"
          :error-text="setSignupState.error?.create_password"
          path="create_password"
          label="Create Password"
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
          :model="model"
          :validation="validation"
          :schema-back="schemaBackend"
          :schema-front="schemaFrontend"
          :error-text="setSignupState.error?.repeat_password"
          path="repeat_password"
          label="Confirm Password"
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
.signup-form {
  $root: &;

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

  &__input-icon {
    color: $gray-70;
    width: 20px;
    height: 20px;
    display: flex;
  }

  &__password-strength-bar {
    position: relative;
    height: 3px;
    margin: 8px auto 40px;
    background: $gray-30;
    border-radius: 2px;

    &::before,
    &::after {
      position: absolute;
      top: 0;
      z-index: 10;
      display: block;
      width: 25%;
      height: inherit;
      content: "";
      background: transparent;
      border-color: $white;
      border-style: solid;
    }

    &::before {
      left: 25%;
      border-width: 0 8px;
    }

    &::after {
      right: 25%;
      border-width: 0 8px 0 0;
    }
  }

  &__password-strength-bar--fill {
    position: absolute;
    width: 0;
    height: inherit;
    background: transparent;
    border-radius: inherit;
    transition: width 0.5s ease-in-out, background 0.25s;

    &[data-score="1"] {
      width: 25%;
      background-color: #ff5252;
    }

    &[data-score="2"] {
      width: 50%;
      background-color: #eec32d;
    }

    &[data-score="3"] {
      width: 75%;
      background-color: #a6cd0c;
    }

    &[data-score="4"] {
      width: 100%;
      background-color: #00d395;
    }
  }

  &__password-strength-bar-name {
    padding-top: 8px;
    text-align: end;
    color: $gray-70;
  }

  &__wrap {
    padding: 40px;
    background: $white;
    box-shadow: $box-shadow-medium;
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
  }

  &__login-label {
    color: $gray-80;
  }
}
</style>
