<script setup lang="ts">
import { SELFSERVICE } from 'InvestCommon/helpers/enums/auth';
import VButton from 'UiKit/components/Base/VButton/VButton.vue';
import VFormGroup from 'UiKit/components/Base/VForm/VFormGroup.vue';
import VFormInput from 'UiKit/components/Base/VForm/VFormInput.vue';
import VImage from 'UiKit/components/Base/VImage/VImage.vue';
import {
  computed, nextTick, onMounted, reactive, ref, watch,
} from 'vue';
import { useAuthLogicStore } from 'InvestCommon/store/useAuthLogic';
import { useAuthStore } from 'InvestCommon/store/useAuth';
import { storeToRefs } from 'pinia';
import { JSONSchemaType } from 'ajv/dist/types/json-schema';
import { PrecompiledValidator } from 'UiKit/helpers/validation/PrecompiledValidator';
import { isEmpty } from 'UiKit/helpers/general';
import { scrollToError } from 'UiKit/helpers/validation/general';
import VSkeleton from 'UiKit/components/Base/VSkeleton/VSkeleton.vue';

const emit = defineEmits(['close']);

const authLogicStore = useAuthLogicStore();
const authStore = useAuthStore();
const { getFlowData, setSettingsErrorData, isGetFlowLoading } = storeToRefs(authStore);

const qrOnMounted = ref(false);

const totpQR = computed(() => {
  const tokenItem = getFlowData.value?.ui?.nodes?.find((item) => item.attributes.id === 'totp_qr');
  return tokenItem?.attributes?.src ?? '';
});
const totpSecret = computed(() => {
  const tokenItem = getFlowData.value?.ui?.nodes?.find((item) => item.attributes.id === 'totp_secret_key');
  return tokenItem?.attributes?.text?.text ?? '';
});

const totpCodeError = computed(() => {
  const tokenItem = setSettingsErrorData.value?.ui?.nodes?.find((item) => item.attributes.name === 'totp_code');
  return tokenItem?.messages?.[0]?.text;
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
  if (!setSettingsErrorData.value) emit('close');
};

watch(() => model, () => {
  if (!isValid.value) onValidate();
}, { deep: true });

onMounted(async () => {
  await authStore.fetchAuthHandler(SELFSERVICE.settings);
  qrOnMounted.value = totpQR.value;
  setSettingsErrorData.value = null;
});
</script>

<template>
  <div class="VFormSettingsTOTP form-settings-totp">
    <p class="is--color-gray-80 is--margin-top-20">
      Scan the QR code with your authenticator app to get 6-digit code
    </p>
    <p
      v-if="(qrOnMounted !== totpQR) && !isGetFlowLoading"
      class="is--color-red is--small"
    >
      QR code and secret key were updated. Please refresh it in your authenticator app
    </p>
    <div class="form-settings-totp__content  is--margin-top-20">
      <VSkeleton
        v-if="isGetFlowLoading"
        height="112px"
        width="112px"
        class="form-settings-totp__skeleton"
      />
      <VImage
        v-else-if="totpQR"
        :src="totpQR"
        alt="totp qr"
        class="form-settings-totp__qr"
      />
      <div class="form-settings-totp__right">
        <div class="form-settings-totp__input-wrap">
          <VFormGroup
            v-slot="VFormGroupProps"
            :model="model"
            :validation="validation"
            :schema-front="schema"
            :error-text="totpCodeError"
            path="totp_code"
            label="6-Digit Verification Code"
            class="form-settings-totp__input"
          >
            <VFormInput
              :model-value="model.totp_code"
              :is-error="VFormGroupProps.isFieldError"
              placeholder="Enter Code"
              name="totp_code"
              size="large"
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
            Verify
          </VButton>
        </div>
        <p class="is--small is--color-gray-70 is--margin-top-4">
          Enter the verification code to confirm setup
        </p>
      </div>
    </div>
    <p class="is--color-gray-80 is--margin-top-30">
      Or use the Authenticator secret key:
    </p>
    <div
      v-if="totpSecret"
      class="form-settings-totp__input-wrap is--margin-top-20"
    >
      <VFormGroup
        label="Secret key"
        class="form-settings-totp__input"
      >
        <VSkeleton
          v-if="isGetFlowLoading"
          height="48px"
          width="100%"
        />
        <VFormInput
          v-else
          :model-value="totpSecret"
          size="large"
          readonly
        />
      </VFormGroup>
    </div>
  </div>
</template>

<style lang="scss">
.form-settings-totp {
  &__qr {
    max-width: 112px;
    width: 100%;
  }

  &__right {
    width: 100%;
  }

  &__input {
    width: 100%;
  }

  &__input-wrap {
    width: 100%;
    display: flex;
    gap: 4px;
  }

  &__content {
    width: 100%;
    display: flex;
    gap: 20px;
  }

  &__btn {
    margin-top: 35px;
  }

  &__skeleton {
    flex-shrink: 0;
  }
}
</style>
