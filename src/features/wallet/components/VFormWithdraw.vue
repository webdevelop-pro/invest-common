<script setup lang="ts">
import VFormGroup from 'UiKit/components/Base/VForm/VFormGroup.vue';
import VFormSelect from 'UiKit/components/Base/VForm/VFormSelect.vue';
import VFormWithdrawFiat from './VFormWithdrawFiat.vue';
import VFormWithdrawCrypto from './VFormWithdrawCrypto.vue';
import { useVFormWithdraw } from './logic/useVFormWithdraw';

const emit = defineEmits(['close']);

const {
  withdrawalMethod,
  withdrawalMethodOptions,
  fiatModel,
  fundingSourceFormatted,
  isFiatSubmitDisabled,
  fiatSubmitHandler,
  addTransactionState,
  maxFiatAmountFormatted,
  numberFormatter,
  model: cryptoModel,
  tokenFormatted,
  text: cryptoAvailableText,
  fiatErrorData,
  fiatIsFieldRequired,
  fiatGetErrorText,
  errorData,
  isFieldRequired,
  getErrorText,
  withdrawFundsState,
  saveHandler: cryptoSaveHandler,
  cancelHandler: cryptoCancelHandler,
  isDisabledButton: cryptoDisabled,
} = useVFormWithdraw(() => emit('close'));

</script>

<template>
  <div class="VFormWithdraw v-form-withdraw">
    <VFormGroup
      label="Withdrawal Method"
      required
      class="v-form-withdraw__method"
    >
      <VFormSelect
        v-model="withdrawalMethod"
        :options="withdrawalMethodOptions"
        item-label="text"
        item-value="value"
        placeholder="Select"
        dropdown-absolute
      />
    </VFormGroup>

    <VFormWithdrawFiat
      v-if="withdrawalMethod === 'fiat'"
      :amount="fiatModel.amount"
      :funding-source-id="fiatModel.funding_source_id"
      :funding-source-options="fundingSourceFormatted"
      :max-fiat-amount-formatted="maxFiatAmountFormatted"
      :loading="addTransactionState.loading"
      :disabled="isFiatSubmitDisabled"
      :error-data="fiatErrorData"
      :is-field-required="fiatIsFieldRequired"
      :get-error-text="fiatGetErrorText"
      @update:amount="fiatModel.amount = $event"
      @update:funding-source-id="fiatModel.funding_source_id = $event"
      @submit="fiatSubmitHandler"
      @cancel="emit('close')"
    />

    <VFormWithdrawCrypto
      v-else
      :token="cryptoModel.token"
      :amount="cryptoModel.amount"
      :to="cryptoModel.to"
      :token-options="tokenFormatted"
      :available-text="cryptoAvailableText"
      :error-data="errorData"
      :is-field-required="isFieldRequired"
      :get-error-text="getErrorText"
      :number-formatter="numberFormatter"
      :loading="withdrawFundsState.loading"
      :disabled="cryptoDisabled"
      @update:token="cryptoModel.token = $event"
      @update:amount="cryptoModel.amount = $event as number"
      @update:to="cryptoModel.to = $event"
      @submit="cryptoSaveHandler"
      @cancel="cryptoCancelHandler"
    />
  </div>
</template>

<style lang="scss" scoped>
.v-form-withdraw {
  &__method {
    margin-bottom: 20px;
  }
}
</style>
