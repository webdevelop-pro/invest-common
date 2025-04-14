<script setup lang="ts">
import {
  computed, nextTick, onMounted, reactive, ref, watch,
} from 'vue';
import { useAuthLogicStore } from 'InvestCommon/store/useAuthLogic';
import { useAuthStore } from 'InvestCommon/store/useAuth';
import { SELFSERVICE } from 'InvestCommon/helpers/enums/auth';
import { storeToRefs } from 'pinia';
import { PrecompiledValidator } from 'UiKit/helpers/validation/PrecompiledValidator';
import { FormModelSignIn, schemaSignIn } from './utilsAuth';
import { isEmpty } from 'InvestCommon/helpers/general';
import { navigateWithQueryParams } from 'UiKit/helpers/general';
import VFormGroup from 'UiKit/components/Base/VForm/VFormGroup.vue';
import VFormInput from 'UiKit/components/Base/VForm/VFormInput.vue';
import VButton from 'UiKit/components/Base/VButton/VButton.vue';
import { scrollToError } from 'UiKit/helpers/validation/general';
import {
  urlForgot, urlSignup, urlSettings, urlProfile,
} from 'InvestCommon/global/links';
import eyeOff from 'UiKit/assets/images/eye-off.svg';
import eye from 'UiKit/assets/images/eye.svg';

const props = defineProps({
  refresh: {
    type: Boolean,
    default: false,
  },
});

const emit = defineEmits(['cancel']);

const queryParams = computed(() => new URLSearchParams(window?.location?.search));
const onSignup = () => {
  if (queryParams.value) return navigateWithQueryParams(urlSignup, queryParams.value);
  return navigateWithQueryParams(urlSignup);
};

const authLogicStore = useAuthLogicStore();
const { loading } = storeToRefs(authLogicStore);
const authStore = useAuthStore();
const {
  getSchemaLoginData, setLoginErrorData, getLoginData, isGetFlowError,
  getFlowData,
} = storeToRefs(authStore);
const showCreatePassword = ref(true);

const queryFlow = computed(() => {
  if (getFlowData.value?.id) return getFlowData.value?.id;
  if (import.meta.env.SSR) return null;
  return (window && window?.location?.search) ? new URLSearchParams(window?.location?.search).get('flow') : null;
});
const queryRefresh = computed(() => {
  if (props.refresh) return true;
  if (import.meta.env.SSR) return null;
  return (window && window?.location?.search) ? new URLSearchParams(window?.location?.search).get('refresh') : null;
});
const queryRedirect = computed(() => {
  if (import.meta.env.SSR) return null;
  return (window && window?.location?.search) ? new URLSearchParams(window?.location?.search).get('redirect') : null;
});
const queryType = computed(() => {
  if (import.meta.env.SSR) return null;
  return (window && window?.location?.search) ? new URLSearchParams(window?.location?.search).get('type') : null;
});

const model = reactive({
} as FormModelSignIn);

let validator = new PrecompiledValidator<FormModelSignIn>(
  getSchemaLoginData.value,
  schemaSignIn,
);
const validation = ref<unknown>();
const isValid = computed(() => isEmpty(validation.value || {}));
const isDisabledButton = computed(() => (!isValid.value || loading.value));

const onValidate = () => {
  validation.value = validator.getFormValidationErrors(model);
};

const loginHandler = async () => {
  onValidate();
  if (!isValid.value) {
    nextTick(() => scrollToError('LogInForm'));
    return;
  }

  const data = {
    identifier: model.email,
    password: model.password,
    method: 'password',
  };
  const query = { refresh: queryRefresh.value };
  if (queryRefresh.value) {
    await authLogicStore.onLogin(data, SELFSERVICE.login, query);
    emit('cancel');
  } else {
    await authLogicStore.onLogin(data, SELFSERVICE.login);
  }
};

watch(() => getSchemaLoginData.value, () => {
  validator = new PrecompiledValidator<FormModelSignIn>(
    getSchemaLoginData.value,
    schemaSignIn,
  );
});

watch(() => model, () => {
  if (!isValid.value) onValidate();
}, { deep: true });

// onMounted(async () => {
//   if (props.refresh && !getLoginData.value && queryFlow.value) authStore.getLogin(queryFlow.value);
// });
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
        :schema-back="getSchemaLoginData"
        :schema-front="schemaSignIn"
        :error-text="setLoginErrorData?.email"
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
        :schema-back="getSchemaLoginData"
        :schema-front="schemaSignIn"
        :error-text="setLoginErrorData?.password"
        path="password"
        label="Password"
        class="login-form__input"
      >
        <VFormInput
          :model-value="model.password"
          :is-error="VFormGroupProps.isFieldError"
          placeholder="Password"
          name="password"
          size="large"
          prepend
          data-testid="password"
          :type="showCreatePassword ? 'password' : 'text'"
          @update:model-value="model.password = $event"
        >
          <template #prepend>
            <div
              v-show="showCreatePassword"
              class="login-form__icon-wrap"
              @click="showCreatePassword = !showCreatePassword"
            >
              <eyeOff
                class="login-form__input-icon"
                alt="signup form input icon eye"
              />
            </div>

            <div
              v-show="!showCreatePassword"
              class="login-form__icon-wrap"
              @click="showCreatePassword = !showCreatePassword"
            >
              <eye
                class="login-form__input-icon"
                alt="signup form input icon eye"
              />
            </div>
          </template>
        </VFormInput>
      </VFormGroup>

      <a
        v-if="!props.refresh"
        :href="urlForgot"
        class="login-form__forgot is--link-2"
      >
        Forgot password?
      </a>

      <VButton
        block
        size="large"
        :loading="loading"
        :disabled="isDisabledButton"
        data-testid="signup"
        class="login-form__btn"
        @click.stop.prevent="loginHandler"
      >
        Log In
      </VButton>

      <div
        v-if="!props.refresh"
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

      <VButton
        v-if="props.refresh"
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
