<script setup lang="ts">
import {
  ref, watch, computed, nextTick,
  reactive,
} from 'vue';
import { checkStrength, scorePassword } from 'InvestCommon/helpers/calculatePasswordStrength';
import { useAuthStore } from 'InvestCommon/store/useAuth';
import { useAuthLogicStore } from 'InvestCommon/store/useAuthLogic';
import { SELFSERVICE } from 'InvestCommon/helpers/enums/auth';
import { storeToRefs } from 'pinia';
import VFormGroup from 'UiKit/components/Base/VForm/VFormGroup.vue';
import VFormInput from 'UiKit/components/Base/VForm/VFormInput.vue';
import VButton from 'UiKit/components/Base/VButton/VButton.vue';
import FormRow from 'InvestCommon/components/VForm/VFormRow.vue';
import FormCol from 'InvestCommon/components/VForm/VFormCol.vue';
import { scrollToError } from 'UiKit/helpers/validation/general';
import { errorMessageRule, passwordRule } from 'UiKit/helpers/validation/rules';
import { JSONSchemaType } from 'ajv';
import { FormModelResetPassword } from 'InvestCommon/types/form';
import { PrecompiledValidator } from 'UiKit/helpers/validation/PrecompiledValidator';
import { isEmpty } from 'UiKit/helpers/general';
import eyeOff from 'UiKit/assets/images/eye-off.svg';
import eye from 'UiKit/assets/images/eye.svg';

const authStore = useAuthStore();
const { isSetPasswordLoading, setPasswordErrorData } = storeToRefs(authStore);
const authLogicStore = useAuthLogicStore();

const showCreatePassword = ref(true);
const showRepeatPassword = ref(true);
const passwordStrength = ref('');
const passwordScore = ref(0);
const showStrengthMeter = ref(false);

const schema = {
  $schema: 'http://json-schema.org/draft-07/schema#',
  definitions: {
    Auth: {
      properties: {
        create_password: passwordRule,
        repeat_password: {
          const: {
            $data: '1/create_password',
          },
          ...passwordRule,
          errorMessage: {
            const: 'Passwords do not match',
          },
        },
      },
      type: 'object',
      required: ['create_password', 'repeat_password'],
      errorMessage: errorMessageRule,
    },
  },
  $ref: '#/definitions/Auth',
} as unknown as JSONSchemaType<FormModelResetPassword>;

const model = reactive<FormModelResetPassword>({});
let validator = new PrecompiledValidator<FormModelResetPassword>(schema);
const validation = ref<unknown>();
const isValid = computed(() => isEmpty(validation.value || {}));

const onValidate = () => {
  validation.value = validator.getFormValidationErrors(model);
};

const isDisabledButton = computed(() => (!isValid.value || isSetPasswordLoading.value));


watch(() => model.create_password, (pass: string) => {
  showStrengthMeter.value = true;
  if (!pass) return null;
  passwordStrength.value = checkStrength(pass);
  passwordScore.value = scorePassword(pass);
  return true;
});

const resetHandler = async () => {
  onValidate();
  if (!isValid.value) {
    void nextTick(() => scrollToError('VFormResetPassword'));
    return;
  }

  await authLogicStore.onReset(model.create_password, SELFSERVICE.settings);
};


watch(() => model, () => {
  if (!isValid.value) onValidate();
}, { deep: true });

watch(() => [schema], () => {
  validator = new PrecompiledValidator<FormModelResetPassword>(
    schema,
  );
});
</script>

<template>
  <form
    class="VFormResetPassword v-form-reset-password "
    novalidate
    @submit.prevent="resetHandler"
  >
    <h2 class="v-form-reset-password__title is--h3__title">
      Reset Your Password
    </h2>
    <div class="v-form-reset-password__wrap">
      <FormRow>
        <FormCol col2>
          <VFormGroup
            v-slot="VFormGroupProps"
            :model="model"
            :validation="validation"
            :schema-front="schema"
            :error-text="setPasswordErrorData?.create_password"
            path="create_password"
            label="Enter Your New Password"
            class="v-form-reset-password__input"
          >
            <VFormInput
              :model-value="model.create_password"
              :is-error="VFormGroupProps.isFieldError"
              placeholder="Enter New Password"
              name="createPassword"
              prepend
              size="large"
              data-testid="create-password"
              :type="showCreatePassword ? 'password' : 'text'"
              @update:model-value="model.create_password = $event"
            >
              <template #prepend>
                <div
                  v-show="showCreatePassword"
                  class="v-form-reset-password__icon-wrap"
                  @click="showCreatePassword = !showCreatePassword"
                >
                  <eyeOff
                    class="v-form-reset-password__input-icon"
                    alt="reset password form input icon"
                  />
                </div>

                <div
                  v-show="!showCreatePassword"
                  class="v-form-reset-password__icon-wrap"
                  @click="showCreatePassword = !showCreatePassword"
                >
                  <eye
                    class="v-form-reset-password__input-icon"
                    alt="reset password form input icon"
                  />
                </div>
              </template>
            </VFormInput>
          </VFormGroup>

          <div
            class="v-form-reset-password__password-strength-bar"
          >
            <div
              class="v-form-reset-password__password-strength-bar--fill"
              :data-score="passwordScore"
            />
            <div class="v-form-reset-password__password-strength-bar-name is--small">
              At least 8 symbols
            </div>
          </div>
        </FormCol>
        <FormCol col2>
          <VFormGroup
            v-slot="VFormGroupProps"
            :model="model"
            :validation="validation"
            :schema-front="schema"
            :error-text="setPasswordErrorData?.repeat_password"
            path="repeat_password"
            label="Confirm Your New Password"
            class="v-form-reset-password__input"
          >
            <VFormInput
              :model-value="model.repeat_password"
              :is-error="VFormGroupProps.isFieldError"
              placeholder="Confirm New Password"
              name="repeatPassword"
              prepend
              data-testid="repeat-password"
              size="large"
              :type="showRepeatPassword ? 'password' : 'text'"
              @update:model-value="model.repeat_password = $event"
            >
              <template #prepend>
                <div
                  v-show="showRepeatPassword"
                  class="v-form-reset-password__icon-wrap"
                  @click="showRepeatPassword = !showRepeatPassword"
                >
                  <eyeOff
                    class="v-form-reset-password__input-icon"
                    alt="reset password form input icon"
                  />
                </div>

                <div
                  v-show="!showRepeatPassword"
                  class="v-form-reset-password__icon-wrap"
                  @click="showRepeatPassword = !showRepeatPassword"
                >
                  <eye
                    class="v-form-reset-password__input-icon"
                    alt="reset password form input icon"
                  />
                </div>
              </template>
            </VFormInput>
          </VFormGroup>
        </FormCol>
      </FormRow>
      <VButton
        size="large"
        :uppercase="false"
        data-testid="button"
        :loading="isSetPasswordLoading"
        :disabled="isDisabledButton"
        class="v-form-reset-password__btn"
      >
        Reset Password
      </VButton>
    </div>
  </form>
</template>

<style lang="scss">
.v-form-reset-password {
  $root: &;

  &__title {
    color: $black;
    margin-bottom: 20px;
  }

  &__wrap {
    display: flex;
    align-items: flex-start;
    gap: 20px;
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

    &[data-score="3"] + #{$root}__password-strength-bar-name {
      color: #a6cd0c;
    }

    &[data-score="4"] {
      width: 100%;
      background-color: #00d395;
    }

    &[data-score="4"] + #{$root}__password-strength-bar-name {
      color: #00d395;
    }
  }

  &__password-strength-bar-name {
    padding-top: 8px;
    text-align: end;
    color: $gray-70;
  }

  &__btn {
    margin-top: 29px !important;
    flex-shrink: 0;
  }
}
</style>
