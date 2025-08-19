<script setup lang="ts">
import { useInvestAmount } from 'InvestCommon/features/investProcess/logic/useInvestAmount';
import FormRow from 'UiKit/components/Base/VForm/VFormRow.vue';
import FormCol from 'UiKit/components/Base/VForm/VFormCol.vue';
import VFormGroup from 'UiKit/components/Base/VForm/VFormGroup.vue';
import VFormInput from 'UiKit/components/Base/VForm/VFormInput.vue';
import VButton from 'UiKit/components/Base/VButton/VButton.vue';
import InvestStep from 'InvestCommon/features/investProcess/components/InvestStep.vue';
import { urlOfferSingle } from 'InvestCommon/global/links';
import { useRoute } from 'vue-router';
import { numberFormatter } from 'InvestCommon/helpers/numberFormatter';

const route = useRoute();

const {
  model,
  validation,
  maxInvestment,
  minInvestment,
  investmentAmountShow,
  errorData,
  schemaBackend,
  schemaFrontend,
  isLeftLessThanMin,
  isBtnDisabled,
  continueHandler,
  setAmountState,
} = useInvestAmount();
</script>

<template>
  <div class="ViewInvestAmount view-invest-amount is--no-margin">
    <InvestStep
      title="Investment Information"
      :step-number="1"
      :is-loading="setAmountState.loading"
    >
      <div class="FormInvestAmount form-invest-amount">
        <FormRow>
          <FormCol col2>
            <VFormGroup
              v-slot="VFormGroupProps"
              :model="model"
              :validation="validation"
              :schema-back="schemaBackend"
              :schema-front="schemaFrontend"
              :error-text="errorData?.number_of_shares"
              path="number_of_shares"
              label="Amount of Shares"
            >
              <VFormInput
                :model-value="model.number_of_shares ? String(model.number_of_shares) : null"
                :is-error="VFormGroupProps.isFieldError"
                placeholder="Amount"
                name="shares-amount"
                size="large"
                allow-integer-only
                @update:model-value="model.number_of_shares = numberFormatter($event)"
              />
            </VFormGroup>
            <p
              v-if="isLeftLessThanMin"
              class="form-invest-amount__limit-info"
            >
              Please enter either the maximum number of shares available - {{ maxInvestment }},
              or reduce your order size by {{ minInvestment - maxInvestment + model.number_of_shares }}
            </p>
            <p class="form-invest-amount__info is--small">
              Minimum - {{ minInvestment }} shares,
              Maximum - {{ maxInvestment }} shares
            </p>
          </FormCol>

          <FormCol col2>
            <VFormGroup
              label="Investment Amount"
            >
              <VFormInput
                :model-value="investmentAmountShow"
                placeholder="$"
                name="amount-of-investment"
                readonly
                size="large"
              />
            </VFormGroup>
          </FormCol>
        </FormRow>

        <div class="form-invest-amount__btn">
          <VButton
            variant="outlined"
            size="large"
            as="a"
            :href="urlOfferSingle(route.params.slug)"
          >
            Cancel
          </VButton>
          <VButton
            :disabled="isBtnDisabled"
            size="large"
            :loading="setAmountState.loading"
            @click="continueHandler"
          >
            Continue
          </VButton>
        </div>
      </div>
    </InvestStep>
  </div>
</template>

<style lang="scss">
@use 'UiKit/styles/_variables.scss' as *;

.view-invest-amount{
  width: 100%;
  padding-top: $header-height;
}

.form-invest-amount {
  width: 100%;

  &__btn {
    display: flex;
    justify-content: flex-end;
    gap: 12px;
    margin-top: 20px;

    @media screen and (max-width: $tablet){
      flex-direction: column;
    }
  }

  &__limit-info {
    font-size: 12px;
    margin-top: 5px;
    color: $red-dark;
    opacity: 1;
  }

  &__info {
    color: $gray-70;
    margin-top: 4px;
  }
}
</style>
