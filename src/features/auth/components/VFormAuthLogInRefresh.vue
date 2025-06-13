<script setup lang="ts">
import { storeToRefs } from 'pinia';
import VFormGroup from 'UiKit/components/Base/VForm/VFormGroup.vue';
import VFormInput from 'UiKit/components/Base/VForm/VFormInput.vue';
import VFormInputPassword from 'UiKit/components/Base/VForm/VFormInputPassword.vue';
import VButton from 'UiKit/components/Base/VButton/VButton.vue';
import { useLoginRefreshStore } from '../store/useLoginRefresh';


const emit = defineEmits(['cancel']);

const loginRefreshStore = useLoginRefreshStore();
const {
  isLoading, model, validation, isDisabledButton,
  schemaBackend, schemaFrontend, setLoginState,
} = storeToRefs(loginRefreshStore);

const loginHandler = async () => {
  loginRefreshStore.loginPasswordHandler();
};
</script>

<template>
  <form
    class="VFormAuthLogInRefresh v-form-auth-login-refresh"
    novalidate
    data-testid="v-form-auth-login-refresh"
  >
    <div class="v-form-auth-login-refresh__wrap">
      <VFormGroup
        v-slot="VFormGroupProps"
        :model="model"
        :validation="validation"
        :schema-back="schemaBackend"
        :schema-front="schemaFrontend"
        :error-text="setLoginState.error?.email"
        path="email"
        label="Email Address"
        class="v-form-auth-login-refresh__input"
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
        class="v-form-auth-login-refresh__input"
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

      <VButton
        block
        size="large"
        :loading="isLoading"
        :disabled="isDisabledButton"
        data-testid="signup"
        class="v-form-auth-login-refresh__btn"
        @click.stop.prevent="loginHandler"
      >
        Log In
      </VButton>


      <VButton
        block
        size="large"
        variant="link"
        class="is--margin-top-12"
        @click.stop.prevent="emit('cancel')"
      >
        Cancel
      </VButton>
    </div>
  </form>
</template>

<style lang="scss">
@use 'UiKit/styles/_variables.scss' as *;

.v-form-auth-login-refresh {
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

    @media screen and (width < $tablet){
      flex-direction: column;
      margin-top: 20px;
    }
  }

  &__signup-label {
    color: $gray-80;
  }

  &__signup-btn {
    @media screen and (width < $tablet){
      width: 100%;
    }
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

    @media screen and (width < $tablet){
      padding: 20px;
    }
  }
}
</style>
