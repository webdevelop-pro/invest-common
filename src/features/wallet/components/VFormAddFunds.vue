<script setup lang="ts">
import { computed } from 'vue';
import VFormGroup from 'UiKit/components/Base/VForm/VFormGroup.vue';
import VFormSelect from 'UiKit/components/Base/VForm/VFormSelect.vue';
import VFormAddFundsFiat from './VFormAddFundsFiat.vue';
import VFormAddFundsCrypto from './VFormAddFundsCrypto.vue';
import { useVFormAddFunds } from './logic/useVFormAddFunds';
import type { IEvmWalletDataFormatted } from 'InvestCommon/data/evm/evm.types';
import { currency } from 'InvestCommon/helpers/currency';

const emit = defineEmits(['close']);

const props = defineProps<{
  data?: IEvmWalletDataFormatted | Record<string, unknown> | null;
}>();

const evmData = computed(() => props.data);

const {
  depositMethod,
  fiatModel,
  fundingSourceFormatted,
  isFiatSubmitDisabled,
  fiatSubmitHandler,
  addTransactionState,
  maxFiatAmount,
  qrCodeDataURL,
  isGeneratingQR,
  copied,
  onCopyClick,
  assetOptions,
  selectedAsset,
  selectedAssetWarning,
  depositNetworkLabel,
} = useVFormAddFunds(evmData, () => emit('close'));

const depositMethodOptions = [
  { value: 'fiat', text: 'Fiat' },
  { value: 'crypto', text: 'Crypto' },
];

const maxFiatAmountFormatted = computed(() => currency(maxFiatAmount));

const cryptoAddress = computed(() => (evmData?.value?.address as string | undefined) ?? null);
</script>

<template>
  <div class="VFormAddFunds v-form-add-funds-unified">
    <VFormGroup
      label="Deposit Method"
      required
      class="v-form-add-funds-unified__method"
    >
      <VFormSelect
        v-model="depositMethod"
        :options="depositMethodOptions"
        item-label="text"
        item-value="value"
        placeholder="Select"
        dropdown-absolute
      />
    </VFormGroup>

    <VFormAddFundsFiat
      v-if="depositMethod === 'fiat'"
      :amount="fiatModel.amount"
      :funding-source-id="fiatModel.funding_source_id"
      :funding-source-options="fundingSourceFormatted"
      :max-fiat-amount-formatted="maxFiatAmountFormatted"
      :loading="addTransactionState.loading"
      :disabled="isFiatSubmitDisabled"
      @update:amount="fiatModel.amount = $event"
      @update:funding-source-id="fiatModel.funding_source_id = $event"
      @submit="fiatSubmitHandler"
      @cancel="emit('close')"
    />

    <VFormAddFundsCrypto
      v-else
      :address="cryptoAddress"
      :qr-code-data-u-r-l="qrCodeDataURL"
      :is-generating-q-r="isGeneratingQR"
      :copied="copied"
      :asset-options="assetOptions"
      :selected-asset="selectedAsset"
      :selected-asset-warning="selectedAssetWarning"
      :deposit-network-label="depositNetworkLabel"
      @update:selected-asset="selectedAsset = $event"
      @copy="onCopyClick"
    />
  </div>
</template>

<style lang="scss" scoped>
.v-form-add-funds-unified {
  &__method {
    margin-bottom: 20px;
  }
}
</style>
