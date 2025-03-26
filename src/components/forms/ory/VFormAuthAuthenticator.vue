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
import { JSONSchemaType } from 'ajv/dist/types/json-schema';

const authLogicStore = useAuthLogicStore();
const { flowId, csrfToken } = storeToRefs(authLogicStore);
const authStore = useAuthStore();

type FormModelTOTP = {
  totp_code: number;
}
const schema = {
  $schema: 'http://json-schema.org/draft-07/schema#',
  definitions: {
    Auth: {
      properties: {
        totp_code: {},
      },
      type: 'object',
      required: ['totp_code'],
    },
  },
  $ref: '#/definitions/Auth',
} as unknown as JSONSchemaType<FormModelTOTP>;

const model = reactive<FormModelTOTP>({});
const validator = new PrecompiledValidator<FormModelTOTP>(schema);
const validation = ref<unknown>();
const isValid = computed(() => isEmpty(validation.value || {}));

const onValidate = () => {
  validation.value = validator.getFormValidationErrors(model);
};

const onSave = async () => {
  onValidate();
  if (!isValid.value) {
    nextTick(() => scrollToError('VFormAuthAuthenticator'));
  }
  const data = {
    totp_code: model.totp_code.toString(),
    method: 'totp',
  };
  await authLogicStore.onLogin(data, SELFSERVICE.login, undefined, true);
};

watch(() => model, () => {
  if (!isValid.value) onValidate();
}, { deep: true });

const onLogout = () => {
  authLogicStore.onLogout();
};

onMounted(() => {
  authStore.fetchAuthHandler(`${SELFSERVICE.login}?aal=aal2`);
});
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
        :schema-front="schema"
        path="totp_code"
        label="Authentication code"
        class="form-auth-authenticator__input"
      >
        <VFormInput
          :model-value="model.totp_code"
          :is-error="VFormGroupProps.isFieldError"
          placeholder="Authentication code"
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
        :uppercase="false"
        data-testid="button"
        class="form-auth-authenticator__btn"
        @click.prevent="onSave"
      >
        Use Authenticator
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
