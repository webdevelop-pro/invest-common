<script setup lang="ts">
import VButton from 'UiKit/components/Base/VButton/VButton.vue';
import VFormGroup from 'UiKit/components/Base/VForm/VFormGroup.vue';
import VFormInput from 'UiKit/components/Base/VForm/VFormInput.vue';
import VImage from 'UiKit/components/Base/VImage/VImage.vue';
import VSkeleton from 'UiKit/components/Base/VSkeleton/VSkeleton.vue';
import { useVFormSettingsTOTP } from './logic/useVFormSettingsTOTP';

const emit = defineEmits(['close']);

const {
  qrOnMounted,
  totpQR,
  totpSecret,
  errorTotpCode,
  model,
  onSave,
  getAuthFlowState,
  isFieldRequired,
} = useVFormSettingsTOTP();

const handleSave = async () => {
  const success = await onSave();
  if (success) {
    emit('close');
  }
};
</script>

<template>
  <div class="VFormSettingsTOTP form-settings-totp">
    <p class="is--color-gray-80 is--margin-top-20">
      Scan the QR code with your authenticator app to get 6-digit code
    </p>
    <p
      v-if="(qrOnMounted !== totpQR) && !getAuthFlowState.loading"
      class="is--color-red is--small"
    >
      QR code and secret key were updated. Please refresh it in your authenticator app
    </p>
    <div class="form-settings-totp__content  is--margin-top-20">
      <VSkeleton
        v-if="getAuthFlowState.loading"
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
            :required="isFieldRequired('totp_code')"
            :error-text="errorTotpCode"
            data-testid="totp-code-group"
            label="6-Digit Verification Code"
            class="form-settings-totp__input"
          >
            <VFormInput
              :model-value="model.totp_code"
              :is-error="VFormGroupProps.isFieldError"
              placeholder="Enter Code"
              name="totp_code"
              size="large"
              data-testid="totp-code"
              @update:model-value="model.totp_code = $event"
            />
          </VFormGroup>
          <VButton
            size="large"
            :uppercase="false"
            data-testid="button"
            class="form-settings-totp__btn"
            @click="handleSave"
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
    <VSkeleton
      v-if="getAuthFlowState.loading"
      height="76px"
      width="100%"
      class="form-settings-totp__skeleton"
    />
    <div
      v-else-if="totpSecret"
      class="form-settings-totp__input-wrap is--margin-top-20"
    >
      <VFormGroup
        label="Secret key"
        class="form-settings-totp__input"
      >
        <VSkeleton
          v-if="getAuthFlowState.loading"
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
    height: 100%;
    max-height: 112px;;
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
    margin-top: 28px;
  }

  &__skeleton {
    flex-shrink: 0;
  }
}
</style>
