<script setup lang="ts">
import { useOfferStore } from 'InvestCommon/store/useOffer';
import { storeToRefs } from 'pinia';
import { computed } from 'vue';

const offerStore = useOfferStore();
const { getUnconfirmedOfferData } = storeToRefs(offerStore);

const data = computed(() => getUnconfirmedOfferData.value?.offer);
</script>

<template>
  <div
    class="FormInvestFundingWire form-invest-funding-wire"
    data-testid="funding-wire"
  >
    <div class="form-invest-funding-wire__row">
      <span class="form-invest-funding-wire__text-title is--h6__title">
        Wire to:
      </span>
      {{ data?.data?.wire_to }}
    </div>
    <div class="form-invest-funding-wire__row">
      <span class="form-invest-funding-wire__text-title is--h6__title">
        Routing Number:
      </span>
      {{ data?.data?.routing_number }}
    </div>
    <div class="form-invest-funding-wire__row">
      <span class="form-invest-funding-wire__text-title is--h6__title">
        Account Number:
      </span>
      {{ data?.data?.account_number }}
    </div>
    <div class="form-invest-funding-wire__row">
      <span class="form-invest-funding-wire__text-title is--h6__title">
        Custodian / Account Name:
      </span>
      {{ data?.data?.custodian }}
    </div>
    <div class="form-invest-funding-wire__row">
      <span class="form-invest-funding-wire__text-title is--h6__title">
        FFCT:
      </span>
      Offer {{ data?.id }}, {{ data?.legal_name }}
    </div>
    <div class="form-invest-funding-wire__row">
      <span class="form-invest-funding-wire__text-title is--h6__title">
        SWIFT ID:
      </span>
      {{ data?.data?.swift_id }}
    </div>
  </div>
</template>

<style lang="scss">
@use 'UiKit/styles/_variables.scss' as *;
@use 'UiKit/styles/_colors.scss' as *;
.form-invest-funding-wire {
  color: $gray-80;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: flex-start;
  gap: 8px;
  align-self: stretch;
  margin-bottom: 40px;
  @media screen and (max-width: $tablet){
    gap: 0;
  }

  &__row {
    display: flex;
    gap: 12px;
    max-width: 475px;
    @media screen and (max-width: $tablet){
      flex-direction: column;
      border-bottom: 1px solid $gray-30;
      padding: 10px 0;
    }
  }

  &__text-title {
    color: $gray-70;
    min-width: 181px;
  }
}
</style>
