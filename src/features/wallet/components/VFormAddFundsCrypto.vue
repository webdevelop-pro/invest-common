<script setup lang="ts">
import VFormGroup from 'UiKit/components/Base/VForm/VFormGroup.vue';
import VFormInput from 'UiKit/components/Base/VForm/VFormInput.vue';
import VFormSelect from 'UiKit/components/Base/VForm/VFormSelect.vue';
import FormRow from 'UiKit/components/Base/VForm/VFormRow.vue';
import FormCol from 'UiKit/components/Base/VForm/VFormCol.vue';
import VButton from 'UiKit/components/Base/VButton/VButton.vue';
import VImage from 'UiKit/components/Base/VImage/VImage.vue';
import VSkeleton from 'UiKit/components/Base/VSkeleton/VSkeleton.vue';

defineProps<{
  address?: string | null | undefined;
  qrCodeDataURL: string;
  isGeneratingQR: boolean;
  copied: boolean;
  assetOptions: { value: string; text: string }[];
  selectedAsset: string;
  selectedAssetWarning: string;
  depositNetworkLabel: string;
}>();

const emit = defineEmits<{
  'update:selectedAsset': [value: string];
  copy: [];
}>();
</script>

<template>
  <div class="VFormAddFundsCrypto v-form-add-funds-crypto">
    <FormRow>
      <FormCol>
        <VFormGroup
          label="Asset to Deposit"
          helper-text="Choose the specific asset you are sending to this wallet."
          required
          class="v-form-add-funds-crypto__input"
        >
          <VFormSelect
            :model-value="selectedAsset"
            :options="assetOptions"
            item-label="text"
            item-value="value"
            placeholder="Select"
            readonly
            dropdown-absolute
            data-testid="add-funds-asset"
            @update:model-value="emit('update:selectedAsset', $event as string)"
          />
        </VFormGroup>
      </FormCol>
    </FormRow>

    <FormRow>
      <div class="v-form-add-funds-crypto__content">
        <VSkeleton
          v-if="isGeneratingQR"
          height="200px"
          width="200px"
          class="v-form-add-funds-crypto__skeleton"
        />
        <VImage
          v-else-if="qrCodeDataURL"
          :src="qrCodeDataURL"
          alt="wallet qr code"
          class="v-form-add-funds-crypto__qr"
        />
        <div class="v-form-add-funds-crypto__right">
          <VFormGroup
            label="Deposit Network"
            helper-text="Scan the QR code with your external wallet app to send funds."
            class="v-form-add-funds-crypto__input"
          >
            <VFormInput
              :model-value="depositNetworkLabel"
              readonly
            />
          </VFormGroup>
        </div>
      </div>
    </FormRow>
    <FormRow>
      <FormCol>
        <VFormGroup
          label="Your Unique Deposit Address"
          :helper-text="selectedAssetWarning"
          class="v-form-add-funds-crypto__input v-form-add-funds-crypto__address-wrap"
        >
          <div class="v-form-add-funds-crypto__input-wrap">
            <VFormInput
              :model-value="address ?? undefined"
              size="large"
              :loading="!address"
              readonly
            />
            <VButton
              size="large"
              :uppercase="false"
              data-testid="add-funds-copy"
              class="v-form-add-funds-crypto__btn"
              @click="emit('copy')"
            >
              <span v-if="!copied">Copy</span>
              <span v-else>Copied!</span>
            </VButton>
          </div>
        </VFormGroup>
      </FormCol>
    </FormRow>
  </div>
</template>

<style lang="scss" scoped>
.v-form-add-funds-crypto {
  &__input {
    width: 100%;
  }

  &__content {
    display: flex;
    gap: 20px;
    align-items: center;
    flex-wrap: wrap;
    width: 100%;

    @media screen and (width < $tablet) {
      flex-direction: column;
      align-items: flex-start;
      gap: 12px;
    }
  }

  &__right {
    flex: 1;
  }

  &__qr {
    max-width: 150px;
    width: 100%;
    height: auto;
    max-height: 150px;
    flex-shrink: 0;
  }

  &__skeleton {
    flex-shrink: 0;
  }

  &__address-wrap {
    margin-top: 12px;
  }

  &__input-wrap {
    display: flex;
    gap: 8px;
    align-items: flex-start;
    width: 100%;
  }

  &__input-wrap :deep(.v-form-input) {
    flex: 1;
    min-width: 0;
  }

  &__btn {
    flex-shrink: 0;
  }
}
</style>
