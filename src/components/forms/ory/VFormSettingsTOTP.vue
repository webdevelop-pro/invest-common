<script setup lang="ts">
import { SELFSERVICE } from 'InvestCommon/helpers/enums/auth';
import VButton from 'UiKit/components/Base/VButton/VButton.vue';
import VFormGroup from 'UiKit/components/Base/VForm/VFormGroup.vue';
import VFormInput from 'UiKit/components/Base/VForm/VFormInput.vue';
import VImage from 'UiKit/components/Base/VImage/VImage.vue';
import {
  computed, nextTick, reactive, ref, watch,
} from 'vue';
import { useAuthLogicStore } from 'InvestCommon/store/useAuthLogic';
import { useAuthStore } from 'InvestCommon/store/useAuth';
import { storeToRefs } from 'pinia';
import { JSONSchemaType } from 'ajv/dist/types/json-schema';
import { PrecompiledValidator } from 'UiKit/helpers/validation/PrecompiledValidator';
import { isEmpty } from 'UiKit/helpers/general';
import { scrollToError } from 'UiKit/helpers/validation/general';

const authLogicStore = useAuthLogicStore();
const authStore = useAuthStore();
const { getFlowData } = storeToRefs(authStore);

const totpQR = computed(() => {
  const tokenItem = getFlowData.value?.ui?.nodes.find((item) => item.attributes.id === 'totp_qr');
  return tokenItem?.attributes.src ?? '';
});
const totpSecret = computed(() => {
  const tokenItem = getFlowData.value?.ui?.nodes.find((item) => item.attributes.id === 'totp_secret_key');
  return tokenItem?.attributes?.text?.text ?? '';
});

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
    nextTick(() => scrollToError('VFormSettingsTOTP'));
  }

  await authLogicStore.setSettingsTOTP(SELFSERVICE.settings, { totp_code: model.totp_code.toString(), method: 'totp' });
};

watch(() => model, () => {
  if (!isValid.value) onValidate();
}, { deep: true });
</script>

<template>
  <div class="VFormSettingsTOTP form-settings-totp">
    <h2 class="form-settings-totp__title is--h3__title">
      Authenticator App
    </h2>
    <p>
      Manage your authenticator app secret. Add or remove the app for enhanced account security.
    </p>
    <VImage
      :src="totpQR"
      alt="totp qr"
      class="form-settings-totp__qr"
    />
    Authenticator secret
    <div>
      {{ totpSecret }}
    </div>

    <VFormGroup
      v-slot="VFormGroupProps"
      :model="model"
      :validation="validation"
      :schema-front="schema"
      path="totp_code"
      label="Verify code"
      class="form-settings-totp__input"
    >
      <VFormInput
        :model-value="model.totp_code"
        :is-error="VFormGroupProps.isFieldError"
        placeholder="Enter Address"
        name="email"
        size="large"
        type="email"
        data-testid="email"
        @update:model-value="model.totp_code = $event"
      />
    </VFormGroup>
    <VButton
      size="large"
      :uppercase="false"
      data-testid="button"
      class="form-settings-totp__btn"
      @click="onSave"
    >
      Save
    </VButton>
  </div>
</template>

<style lang="scss">
.form-settings-totp {
  &__qr {
    max-width: 200px;
    width: 100%;
  }
}
</style>
