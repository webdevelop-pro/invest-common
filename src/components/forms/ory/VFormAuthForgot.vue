<script setup lang="ts">
import {
  computed, nextTick, reactive, ref, watch,
} from 'vue';
import { useAuthStore } from 'InvestCommon/store/useAuth';
import { useAuthLogicStore } from 'InvestCommon/store/useAuthLogic';
import { urlSignin } from 'InvestCommon/global/links';
import { SELFSERVICE } from 'InvestCommon/helpers/enums/auth';
import { storeToRefs } from 'pinia';
import { PrecompiledValidator } from 'UiKit/helpers/validation/PrecompiledValidator';
import { FormModelForgot, schemaForgot } from './utilsAuth';
import { isEmpty } from 'InvestCommon/helpers/general';
import VFormGroup from 'UiKit/components/Base/VForm/VFormGroup.vue';
import VFormInput from 'UiKit/components/Base/VForm/VFormInput.vue';
import VButton from 'UiKit/components/Base/VButton/VButton.vue';
import { scrollToError } from 'UiKit/helpers/validation/general';

const authStore = useAuthStore();
const { isSetRecoveryLoading, getSchemaData, setRecoveryErrorData } = storeToRefs(authStore);
const authLogicStore = useAuthLogicStore();

const model = reactive({
} as FormModelForgot);

let validator = new PrecompiledValidator<FormModelForgot>(
  getSchemaData.value,
  schemaForgot,
);
const validation = ref<unknown>();
const isValid = computed(() => isEmpty(validation.value || {}));
const isDisabledButton = computed(() => (!isValid.value || isSetRecoveryLoading.value));

const onValidate = () => {
  validation.value = validator.getFormValidationErrors(model);
};

watch(() => model, () => {
  if (!isValid.value) onValidate();
}, { deep: true });

watch(() => getSchemaData.value, () => {
  validator = new PrecompiledValidator<FormModelForgot>(
    getSchemaData.value,
    schemaForgot,
  );
});

const recoveryHandler = async () => {
  onValidate();
  if (!isValid.value) {
    nextTick(() => scrollToError('ForgotForm'));
    return;
  }

  await authLogicStore.onRecovery(model.email, SELFSERVICE.recovery);
};

</script>

<template>
  <form
    class="VFormAuthForgot forgot-form"
    novalidate
    @submit.prevent="recoveryHandler"
  >
    <VFormGroup
      v-slot="VFormGroupProps"
      :model="model"
      :validation="validation"
      :schema-back="getSchemaData"
      :schema-front="schemaForgot"
      :error-text="setRecoveryErrorData?.email"
      path="email"
      label="Enter Address"
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
      Enter your email address and we’ll send you a code to reset your password.
    </div>

    <VButton
      size="large"
      block
      data-testid="button"
      :loading="isSetRecoveryLoading"
      :disabled="isDisabledButton"
      class="forgot-form__btn"
    >
      Send code
    </VButton>
    <VButton
      variant="link"
      size="large"
      block
      as="a"
      :href="urlSignin"
      class="forgot-form__signup-btn"
    >
      Return to Login
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
