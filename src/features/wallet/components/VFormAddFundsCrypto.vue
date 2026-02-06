<script setup lang="ts">
import VFormGroup from 'UiKit/components/Base/VForm/VFormGroup.vue';
import VFormInput from 'UiKit/components/Base/VForm/VFormInput.vue';
import VFormSelect from 'UiKit/components/Base/VForm/VFormSelect.vue';
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
    <VFormGroup
      label="Asset to Deposit"
      required
      class="v-form-add-funds-crypto__input"
    >
      <VFormSelect
        :model-value="selectedAsset"
        :options="assetOptions"
        item-label="text"
        item-value="value"
        placeholder="Select"
        dropdown-absolute
        data-testid="add-funds-asset"
        @update:model-value="emit('update:selectedAsset', $event as string)"
      />
    </VFormGroup>
    <div class="v-form-add-funds-crypto__helper v-form-add-funds-crypto__helper--asset">
      Choose the specific asset you are sending to this wallet.
    </div>

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
        <div class="v-form-add-funds-crypto__network-wrap">
          <span class="v-form-add-funds-crypto__network-label">Deposit Network</span>
          <span class="v-form-add-funds-crypto__network-value">{{ depositNetworkLabel }}</span>
        </div>
        <div class="v-form-add-funds-crypto__helper v-form-add-funds-crypto__helper--scan">
          Scan the QR code with your external wallet app to send funds.
        </div>
        <VFormGroup
          label="Your Unique Deposit Address"
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
        <p class="v-form-add-funds-crypto__warning">
          {{ selectedAssetWarning }}
        </p>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.v-form-add-funds-crypto {
  &__input {
    width: 100%;
  }

  &__helper {
    color: $gray-70;
    font-size: 14px;
    margin-top: 4px;
  }

  &__helper--asset {
    margin-bottom: 20px;
  }

  &__helper--scan {
    margin-bottom: 12px;
  }

  &__content {
    display: flex;
    gap: 20px;
    align-items: flex-start;
    margin-top: 20px;
    flex-wrap: wrap;
  }

  &__qr {
    max-width: 200px;
    width: 100%;
    height: auto;
    max-height: 200px;
    flex-shrink: 0;
  }

  &__skeleton {
    flex-shrink: 0;
  }

  &__right {
    flex: 1;
    min-width: 280px;
  }

  &__network-wrap {
    display: flex;
    flex-direction: column;
    gap: 4px;
    margin-bottom: 8px;
  }

  &__network-label {
    font-size: 14px;
    color: $gray-70;
  }

  &__network-value {
    display: inline-block;
    padding: 8px 12px;
    background: $gray-10;
    border-radius: 4px;
    font-size: 14px;
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
    min-width: 101px;
    flex-shrink: 0;
  }

  &__warning {
    margin-top: 16px;
    font-size: 14px;
    color: $gray-70;
    line-height: 1.4;
  }
}
</style>
