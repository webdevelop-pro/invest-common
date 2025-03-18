<script setup lang="ts">
import {
  computed, nextTick, reactive, ref, watch,
} from 'vue';
import { useAuthStore } from 'InvestCommon/store/useAuth';
import { useAuthLogicStore } from 'InvestCommon/store/useAuthLogic';
import { SELFSERVICE } from 'InvestCommon/helpers/enums/auth';
import { storeToRefs } from 'pinia';
import { PrecompiledValidator } from 'UiKit/helpers/validation/PrecompiledValidator';
import { FormModelCode, schemaCode } from './utilsAuth';
import { isEmpty } from 'InvestCommon/helpers/general';
import VFormGroup from 'UiKit/components/Base/VForm/VFormGroup.vue';
import VFormInput from 'UiKit/components/Base/VForm/VFormInput.vue';
import VButton from 'UiKit/components/Base/VButton/VButton.vue';
import { scrollToError } from 'UiKit/helpers/validation/general';

const authStore = useAuthStore();
const { isSetVerificationLoading, setVerificationErrorData } = storeToRefs(authStore);
const authLogicStore = useAuthLogicStore();

const flowId = computed(() => (
  (window && window.location.search) ? new URLSearchParams(window.location.search).get('flowId') : null));
const email = computed(() => (
  (window && window.location.search) ? new URLSearchParams(window.location.search).get('email') : null));

const model = reactive({
} as FormModelCode);

const validator = new PrecompiledValidator<FormModelCode>(
  schemaCode,
);
const validation = ref<unknown>();
const isValid = computed(() => isEmpty(validation.value || {}));
const isDisabledButton = computed(() => (!isValid.value || isSetVerificationLoading.value));

const onValidate = () => {
  validation.value = validator.getFormValidationErrors(model);
};

watch(() => model, () => {
  if (!isValid.value) onValidate();
}, { deep: true });

const verificationHandler = async () => {
  onValidate();
  if (!isValid.value) {
    void nextTick(() => scrollToError('VerificationForm'));
    return;
  }

  await authLogicStore.onVerification(flowId.value, model.code, SELFSERVICE.recovery);
};

const resendHandler = async () => {
  await authLogicStore.onRecovery(email.value, SELFSERVICE.recovery);
};
</script>

<template>
  <form
    class="VFormAuthVerification verification-form"
    novalidate
  >
    <VFormGroup
      v-slot="VFormGroupProps"
      :model="model"
      :validation="validation"
      :schema-front="schemaCode"
      :error-text="setVerificationErrorData?.code"
      path="code"
      label="Recovery Code"
      class="verification-form__input"
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
      Enter the recover code we just sent you on your email address
    </div>

    <VButton
      size="large"
      block
      data-testid="button"
      :loading="isSetVerificationLoading"
      :disabled="isDisabledButton"
      class="verification-form__btn"
      @click.prevent="verificationHandler"
    >
      Recover Email
    </VButton>

    <div class="verification-form__login-wrap  is--no-margin">
      <span class="verification-form__login-label is--body">
        Didn't receive the email?
      </span>

      <VButton
        variant="link"
        size="large"
        class="verification-form__login-btn"
        @click.prevent="resendHandler"
      >
        Resend Code
      </VButton>
    </div>
  </form>
</template>

<style lang="scss">
.verification-form {
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
