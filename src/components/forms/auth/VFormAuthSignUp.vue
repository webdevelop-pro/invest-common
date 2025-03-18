<script setup lang="ts">
import {
  ref, watch, computed, onMounted, reactive, nextTick,
} from 'vue';
import { checkStrength, scorePassword } from 'InvestCommon/helpers/calculatePasswordStrength';
import { useAuthLogicStore } from 'InvestCommon/store/useAuthLogic';
import { useAuthStore } from 'InvestCommon/store/useAuth';
import { SELFSERVICE } from 'InvestCommon/helpers/enums/auth';
import { storeToRefs } from 'pinia';
import { PrecompiledValidator } from 'UiKit/helpers/validation/PrecompiledValidator';
import { isEmpty } from 'InvestCommon/helpers/general';
import { navigateWithQueryParams } from 'UiKit/helpers/general';
import { FormModelSignUp, schemaSignUp } from './utilsAuth';
import VFormGroup from 'UiKit/components/Base/VForm/VFormGroup.vue';
import VFormInput from 'UiKit/components/Base/VForm/VFormInput.vue';
import VButton from 'UiKit/components/Base/VButton/VButton.vue';
import VFormCheckbox from 'UiKit/components/Base/VForm/VFormCheckbox.vue';
import FormRow from 'UiKit/components/Base/VForm/VFormRow.vue';
import FormCol from 'UiKit/components/Base/VForm/VFormCol.vue';
import { scrollToError } from 'UiKit/helpers/validation/general';
import {
  urlTerms, urlPrivacy, urlBlog, urlSignin,
} from 'InvestCommon/global/links';
import eyeOff from 'UiKit/assets/images/eye-off.svg';
import eye from 'UiKit/assets/images/eye.svg';

const authStore = useAuthStore();
const { getSignupData, getSchemaSignupData, setSignupErrorData } = storeToRefs(authStore);
const authLogicStore = useAuthLogicStore();
const { loading } = storeToRefs(authLogicStore);

const showCreatePassword = ref(true);
const showRepeatPassword = ref(true);
const passwordStrength = ref('');
const passwordScore = ref(0);
const showStrengthMeter = ref(false);
const checkbox = ref(false);

const queryParams = computed(() => new URLSearchParams(window.location.search));
const onLogin = () => {
  if (queryParams.value) return navigateWithQueryParams(urlSignin, queryParams.value);
  return navigateWithQueryParams(urlSignin);
};

const queryFlow = computed(() => (
  (window && window.location.search) ? new URLSearchParams(window.location.search).get('flow') : null));

const model = reactive({
} as FormModelSignUp);

let validator = new PrecompiledValidator<FormModelSignUp>(
  getSchemaSignupData.value,
  schemaSignUp,
);
const validation = ref<unknown>();
const isValid = computed(() => isEmpty(validation.value || {}));
const isDisabledButton = computed(() => (!isValid.value || loading.value || !checkbox.value));

const onValidate = () => {
  validation.value = validator.getFormValidationErrors(model);
};

watch(() => model.create_password, (pass: string) => {
  showStrengthMeter.value = true;
  if (!pass) return null;
  passwordStrength.value = checkStrength(pass);
  passwordScore.value = scorePassword(pass);
  return true;
});

watch(() => getSchemaSignupData.value, () => {
  validator = new PrecompiledValidator<FormModelSignUp>(
    getSchemaSignupData.value,
    schemaSignUp,
  );
});

watch(() => model, () => {
  if (!isValid.value) onValidate();
}, { deep: true });

onMounted(async () => {
  if (queryFlow.value) {
    if (!getSignupData.value) await authStore.getSignup(queryFlow.value);
    if (getSignupData.value && getSignupData.value.ui) {
      getSignupData.value.ui.nodes.forEach((item) => {
        const { name } = item.attributes;
        const { value } = item.attributes;

        if (name === 'traits.email') model.email = value ?? '';
        else if (name === 'traits.first_name') model.first_name = value ?? '';
        else if (name === 'traits.last_name') model.last_name = value ?? '';
      });
    }
  }
});

const signUpHandler = async () => {
  if (!checkbox.value) return;
  onValidate();
  if (!isValid.value) {
    void nextTick(() => scrollToError('SignUpForm'));
    return;
  }

  await authLogicStore.onSignUp(
    model.first_name,
    model.last_name,
    model.email,
    model.repeat_password,
    SELFSERVICE.registration,
  );
};
</script>

<template>
  <form
    class="VFormAuthLogIn signup-form"
    novalidate
  >
    <div class="signup-form__wrap">
      <FormRow>
        <FormCol col2>
          <VFormGroup
            v-slot="VFormGroupProps"
            :model="model"
            :validation="validation"
            :schema-back="getSchemaSignupData"
            :schema-front="schemaSignUp"
            :error-text="setSignupErrorData?.first_name"
            path="first_name"
            label="First Name"
          >
            <VFormInput
              :model-value="model.first_name"
              :is-error="VFormGroupProps.isFieldError"
              placeholder="First Name"
              name="first-name"
              size="large"
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
            :schema-back="getSchemaSignupData"
            :schema-front="schemaSignUp"
            :error-text="setSignupErrorData?.last_name"
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
          :schema-back="getSchemaSignupData"
          :schema-front="schemaSignUp"
          :error-text="setSignupErrorData?.email"
          path="email"
          label="Enter Address"
        >
          <VFormInput
            :model-value="model.email"
            :is-error="VFormGroupProps.isFieldError"
            placeholder="Enter Address"
            name="email"
            size="large"
            data-testid="email"
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
          :schema-back="getSchemaSignupData"
          :schema-front="schemaSignUp"
          :error-text="setSignupErrorData?.create_password"
          path="create_password"
          label="Create Password"
        >
          <VFormInput
            :model-value="model.create_password"
            :is-error="VFormGroupProps.isFieldError"
            placeholder="Create Password"
            name="createPassword"
            :type="showCreatePassword ? 'password' : 'text'"
            class="signup-form__input"
            prepend
            data-testid="create-password"
            size="large"
            @update:model-value="model.create_password = $event.trim()"
          >
            <template #prepend>
              <div
                v-show="showCreatePassword"
                class="signup-form__icon-wrap"
                @click="showCreatePassword = !showCreatePassword"
              >
                <eyeOff
                  class="signup-form__input-icon"
                  alt="signup form input icon eye"
                />
              </div>

              <div
                v-show="!showCreatePassword"
                class="signup-form__icon-wrap"
                @click="showCreatePassword = !showCreatePassword"
              >
                <eye
                  class="signup-form__input-icon"
                  alt="signup form input icon eye"
                />
              </div>
            </template>
          </VFormInput>
        </VFormGroup>

        <div
          class="signup-form__password-strength-bar"
        >
          <div
            class="signup-form__password-strength-bar--fill"
            :data-score="passwordScore"
          />
          <div class="signup-form__password-strength-bar-name is--small">
            At least 8 symbols
          </div>
        </div>
      </div>

      <div class="signup-form__input-wrap">
        <VFormGroup
          v-slot="VFormGroupProps"
          :model="model"
          :validation="validation"
          :schema-back="getSchemaSignupData"
          :schema-front="schemaSignUp"
          :error-text="setSignupErrorData?.repeat_password"
          path="repeat_password"
          label="Confirm Password"
        >
          <VFormInput
            :model-value="model.repeat_password"
            :is-error="VFormGroupProps.isFieldError"
            placeholder="Confirm Password"
            name="repeatPassword"
            prepend
            size="large"
            data-testid="repeat-password"
            class="signup-form__input"
            :type="showRepeatPassword ? 'password' : 'text'"
            @update:model-value="model.repeat_password = $event.trim();"
          >
            <template #prepend>
              <div
                v-show="showRepeatPassword"
                class="signup-form__icon-wrap"
                @click="showRepeatPassword = !showRepeatPassword"
              >
                <eyeOff
                  class="signup-form__input-icon"
                  alt="signup form input icon eye"
                />
              </div>

              <div
                v-show="!showRepeatPassword"
                class="signup-form__icon-wrap"
                @click="showRepeatPassword = !showRepeatPassword"
              >
                <eye
                  class="signup-form__input-icon"
                  alt="signup form input icon eye"
                />
              </div>
            </template>
          </VFormInput>
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
        :loading="loading"
        :disabled="isDisabledButton"
        data-testid="button"
        class="signup-form__btn"
        @click.stop.prevent="signUpHandler"
      >
        Sign Up
      </VButton>

      <div class="signup-form__login-wrap  is--no-margin">
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
      margin-top: 20px;
    }
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
