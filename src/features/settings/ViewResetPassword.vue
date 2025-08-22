<script setup lang="ts">
import VFormGroup from 'UiKit/components/Base/VForm/VFormGroup.vue';
import VFormInputPassword from 'UiKit/components/Base/VForm/VFormInputPassword.vue';
import VButton from 'UiKit/components/Base/VButton/VButton.vue';
import FormRow from 'UiKit/components/Base/VForm/VFormRow.vue';
import FormCol from 'UiKit/components/Base/VForm/VFormCol.vue';
import { useResetPassword } from './logic/useResetPassword';

const {
  isLoading,
  isDisabledButton,
  errorData,
  model,
  validation,
  schema,
  resetHandler,
  backButtonUrl,
} = useResetPassword();
</script>

<template>
  <div class="ViewForgot view-forgot">
    <div class="view-forgot__wrap">
      <h1 class="view-forgot__title">
        Reset Password
      </h1>

      <form
        class="VFormSettingsResetPassword v-form-reset-password "
        novalidate
        @submit.prevent="resetHandler"
      >
        <FormRow>
          <FormCol>
            <VFormGroup
              v-slot="VFormGroupProps"
              :model="model"
              :validation="validation"
              :schema-front="schema"
              :error-text="errorData?.create_password"
              path="create_password"
              label="Enter Your New Password"
            >
              <VFormInputPassword
                :model-value="model.create_password"
                :is-error="VFormGroupProps.isFieldError"
                placeholder="Enter New Password"
                name="createPassword"
                size="large"
                :show-strength="true"
                @update:model-value="model.create_password = $event.trim()"
              />
            </VFormGroup>
          </FormCol>
        </FormRow>
        <FormRow>
          <FormCol>
            <VFormGroup
              v-slot="VFormGroupProps"
              :model="model"
              :validation="validation"
              :schema-front="schema"
              :error-text="errorData?.repeat_password"
              path="repeat_password"
              label="Confirm Your New Password"
            >
              <VFormInputPassword
                :model-value="model.repeat_password"
                :is-error="VFormGroupProps.isFieldError"
                placeholder="Confirm New Password"
                name="repeatPassword"
                size="large"
                @update:model-value="model.repeat_password = $event.trim()"
              />
            </VFormGroup>
          </FormCol>
        </FormRow>
        <VButton
          size="large"
          block
          data-testid="button"
          :loading="isLoading"
          :disabled="isDisabledButton"
          class="v-form-reset-password__btn"
        >
          Reset Password
        </VButton>
        <VButton
          size="large"
          as="a"
          :href="backButtonUrl"
          block
          variant="link"
          class="v-form-reset-password__btn"
        >
          Back to Settings
        </VButton>
      </form>
    </div>
  </div>
</template>

<style lang="scss">
@use 'UiKit/styles/_variables.scss' as *;

.view-forgot {
  width: 100%;
  padding-top: $header-height;

  &__wrap {
    max-width: 558px;
    margin: 40px auto 130px;
  }

  &__title {
    text-align: center;
    margin-bottom: 40px;
  }
}

.v-form-reset-password {
  padding: 40px;
  background: $white;
  box-shadow: $box-shadow-medium;

  &__btn {
    margin-top: 24px;
    flex-shrink: 0;
    @media screen and (max-width: $tablet){
      margin-top: 0;
    }

    & + & {
      margin-top: 16px;
    }
  }
}
</style>
