<script setup lang="ts">
import { onMounted } from 'vue';
import { useAuthenticatorStore } from '../store/useAuthenticator';
import VFormGroup from 'UiKit/components/Base/VForm/VFormGroup.vue';
import VFormInput from 'UiKit/components/Base/VForm/VFormInput.vue';
import VButton from 'UiKit/components/Base/VButton/VButton.vue';
import { storeToRefs } from 'pinia';

const authenticatorStore = useAuthenticatorStore();
const {
  model, validation, isDisabledButton,
  isLoading, schemaFrontend,
} = storeToRefs(authenticatorStore);

onMounted(() => {
  authenticatorStore.onMoutedHandler();
});

const totpHandler = () => {
  authenticatorStore.totpHandler();
};
const onLogout = () => {
  authenticatorStore.onLogout();
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
        :model="model"
        :validation="validation"
        :schema-front="schemaFrontend"
        path="totp_code"
        label="Authentication Code"
        class="form-auth-authenticator__input"
      >
        <VFormInput
          :model-value="model.totp_code"
          :is-error="VFormGroupProps.isFieldError"
          placeholder="Enter Authentication Code"
          name="email"
          size="large"
          type="email"
          data-testid="email"
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
          Sign Out
        </VButton>
      </div>
    </div>
  </form>
</template>

<style lang="scss">
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
