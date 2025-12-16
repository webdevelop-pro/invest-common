<script setup lang="ts">
import { useRoute } from 'vue-router';
import { useInvestAmount } from 'InvestCommon/features/investProcess/logic/useInvestAmount';
import InvestStep from 'InvestCommon/features/investProcess/components/InvestStep.vue';
import VFormInvestAmount from 'InvestCommon/features/investProcess/components/VFormInvestAmount.vue';
import VFormInvestOwnership from 'InvestCommon/features/investProcess/components/VFormInvestOwnership.vue';
import VFormInvestFunding from 'InvestCommon/features/investProcess/components/VFormInvestFunding.vue';
import { urlOfferSingle } from 'InvestCommon/domain/config/links';

const route = useRoute();

const {
  errorData,
  schemaBackend,
  getInvestUnconfirmedOne,
  formModel,
  handleContinue,
  amountFormRef,
  ownershipFormRef,
  fundingFormRef,
  getWalletState,
  walletId,
  getEvmWalletState,
  evmWalletId,
  selectedUserProfileData,
  isBtnDisabled,
  isLoading,
} = useInvestAmount();

</script>

<template>
  <div class="ViewInvestAmount view-invest-amount is--no-margin">
    <InvestStep
      title="Investment"
      :step-number="1"
      :is-loading="isLoading"
      :footer="{
        cancel: { href: urlOfferSingle(route.params.slug as string) },
        primary: {
          text: 'Continue',
          disabled: isBtnDisabled,
          loading: isLoading,
        }
      }"
      @footer-primary="handleContinue"
    >
      <div class="FormInvestAmount form-invest-amount">
        <VFormInvestAmount
          ref="amountFormRef"
          v-model="formModel"
          :error-data="errorData"
          :data="getInvestUnconfirmedOne"
          :backend-schema="schemaBackend"
          :is-loading="isLoading"
        />

        <div class="view-invest-amount__subtitle is--h3__title">
          Ownership
        </div>

        <VFormInvestOwnership
          ref="ownershipFormRef"
          v-model="formModel"
          :error-data="errorData"
          :data="getInvestUnconfirmedOne"
          :backend-schema="schemaBackend"
          :is-loading="isLoading"
        />

        <div class="view-invest-amount__subtitle is--h3__title">
          Funding
        </div>

        <VFormInvestFunding
          ref="fundingFormRef"
          v-model="formModel"
          :error-data="errorData"
          :data="getInvestUnconfirmedOne"
          :backend-schema="schemaBackend"
          :is-loading="isLoading"
          :get-wallet-state="getWalletState"
          :wallet-id="walletId"
          :get-evm-wallet-state="getEvmWalletState"
          :evm-wallet-id="evmWalletId"
          :selected-user-profile-data="selectedUserProfileData"
        />
      </div>
    </InvestStep>
  </div>
</template>

<style lang="scss">
@use 'UiKit/styles/_variables.scss' as *;

.view-invest-amount{
  width: 100%;
  padding-top: $header-height;

  &__subtitle {
    margin-bottom: 20px;
    margin-top: 12px;
  }
}

.form-invest-amount {
  width: 100%;
}
</style>
