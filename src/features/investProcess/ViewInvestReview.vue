<script setup lang="ts">
import { ROUTE_INVEST_SIGNATURE } from 'InvestCommon/domain/config/enums/routes';
import { useInvestReview } from './logic/useInvestReview';
import InvestStep from 'InvestCommon/features/investProcess/components/InvestStep.vue';
import VFormInvestReview from 'InvestCommon/features/investProcess/components/VFormInvestReview.vue';

const {
  slug,
  id,
  profileId,
  selectedUserProfileData,
  getInvestUnconfirmedOne,
  setReviewState,
  confirmInvest,
  urlOfferSingle,
} = useInvestReview();
</script>

<template>
  <div class="ViewInvestReview view-invest-review is--no-margin">
    <InvestStep
      title="Confirmation"
      :step-number="3"
      :is-loading="setReviewState.loading"
      :footer="{
        back: { to: { name: ROUTE_INVEST_SIGNATURE, params: { slug, id, profileId } } },
        cancel: { href: urlOfferSingle(slug as string) },
        primary: {
          text: 'Confirm & Invest',
          testId: 'saveButton',
          disabled: setReviewState.loading,
          loading: setReviewState.loading,
        }
      }"
      @footer-primary="confirmInvest"
    >
      <VFormInvestReview
        :data="getInvestUnconfirmedOne"
        :selected-user-profile-data="selectedUserProfileData"
      />
    </InvestStep>
  </div>
</template>

<style lang="scss">
@use 'UiKit/styles/_variables.scss' as *;

.view-invest-review {
  width: 100%;
  padding-top: $header-height;
}
</style>
