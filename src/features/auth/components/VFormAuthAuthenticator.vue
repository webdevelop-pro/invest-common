<script setup lang="ts">
import { onMounted } from 'vue';
import { useAuthenticatorStore } from '../store/useAuthenticator';
import { useLogoutStore } from '../store/useLogout';
import VFormGroup from 'UiKit/components/Base/VForm/VFormGroup.vue';
import VFormInput from 'UiKit/components/Base/VForm/VFormInput.vue';
import VButton from 'UiKit/components/Base/VButton/VButton.vue';
import { storeToRefs } from 'pinia';

const authenticatorStore = useAuthenticatorStore();
const logoutStore = useLogoutStore();
const {
  model, isDisabledButton,
  isLoading, isFieldRequired,
  getErrorText, setLoginState,
} = storeToRefs(authenticatorStore);

onMounted(() => {
  authenticatorStore.onMountedHandler();
});

const totpHandler = () => {
  authenticatorStore.totpHandler();
};
const onLogout = () => {
  logoutStore.logoutHandler();
};
</script>

<template>
  <form
    class="VFormAuthAuthenticator form-auth-authenticator"
    novalidate
    data-testid="form-auth-authenticator"
  >
    <div class="form-auth-authenticator__wrap">
      <VFormGroup
        v-slot="VFormGroupProps"
        :required="isFieldRequired('totp_code')"
        :error-text="getErrorText('totp_code', setLoginState.error?.data?.responseJson)"
        label="Authentication Code"
        class="form-auth-authenticator__input"
        data-testid="totp-code-group"
      >
        <VFormInput
          :model-value="model.totp_code"
          :is-error="VFormGroupProps.isFieldError"
          placeholder="Enter Authentication Code"
          name="totp_code"
          size="large"
          type="text"
          data-testid="totp-code"
          @update:model-value="model.totp_code = $event"
        />
      </VFormGroup>
      <VButton
        size="large"
        block
        :loading="isLoading"
        :disabled="isDisabledButton"
        data-testid="button"
        class="form-auth-authenticator__btn"
        @click.prevent="totpHandler"
      >
        Verify
      </VButton>

      <div class="form-auth-authenticator__signup-wrap  is--no-margin">
        <span class="form-auth-authenticator__signup-label is--body">
          Something's not working?
        </span>

        <VButton
          variant="link"
          size="large"
          class="form-auth-authenticator__signup-btn"
          @click.prevent="onLogout"
        >
          Log Out
        </VButton>
      </div>
    </div>
  </form>
</template>

<style lang="scss">
@use 'UiKit/styles/_variables.scss' as *;

.form-auth-authenticator {

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
