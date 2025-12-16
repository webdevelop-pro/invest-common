<script setup lang="ts">
import { ROUTE_INVEST_AMOUNT } from 'InvestCommon/domain/config/enums/routes';
import InvestStep from 'InvestCommon/features/investProcess/components/InvestStep.vue';
import VFormInvestSignature from 'InvestCommon/features/investProcess/components/VFormInvestSignature.vue';
import { urlOfferSingle } from 'InvestCommon/domain/config/links';
import { useInvestSignature } from './logic/useInvestSignature';

const {
  formRef,
  signId,
  signUrl,
  isLoading,
  canContinue,
  slug,
  id,
  profileId,
  handleDocument,
  handleContinue,
  handleDialogOpen,
  handleDialogClose,
} = useInvestSignature();
</script>

<template>
  <div class="ViewInvestSignature view-invest-signature is--no-margin">
    <InvestStep
      title="Signature"
      :step-number="2"
      :is-loading="isLoading"
      :footer="{
        back: { to: { name: ROUTE_INVEST_AMOUNT, params: { slug, id, profileId } } },
        cancel: { href: urlOfferSingle(slug as string) },
        primary: {
          text: 'Continue',
          disabled: !canContinue,
          loading: isLoading,
          testId: 'continue-button',
        }
      }"
      @footer-primary="handleContinue"
    >
      <VFormInvestSignature
        ref="formRef"
        :sign-id="signId"
        :is-loading="isLoading"
        :sign-url="signUrl"
        @document-click="handleDocument"
        @dialog-open="handleDialogOpen"
        @dialog-close="handleDialogClose"
      />
    </InvestStep>
  </div>
</template>

<style lang="scss">
@use 'UiKit/styles/_variables.scss' as *;

.view-invest-signature {
  width: 100%;
  padding-top: $header-height;
}

.form-invest-signature {
  &__label {
    color: $gray-70;
  }

  &__document {
    margin: 8px 0 30px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 16px;
    gap: 8px;
    border-top: 1px solid $gray-20;
    border-bottom: 1px solid $gray-20;
    cursor: pointer;
    transition: background-color 0.3s ease;
    outline: none;

    &:hover,
    &:focus-visible {
      background-color: $gray-10;
    }

    @media screen and (max-width: $tablet) {
      flex-direction: column;
      padding: 16px 0;
      gap: 10px;
    }
  }

  &__checkbox {
    margin-bottom: 20px;
    padding: 0 14px;

    &:last-child {
      margin-bottom: 0;
    }

    @media screen and (max-width: $tablet) {
      padding: 0;
    }
  }

  &__document-icon {
    width: 19px;
    flex-shrink: 0;
  }

  &__link {
    margin-top: -2px;
    display: inline-block;
  }

}
</style>
