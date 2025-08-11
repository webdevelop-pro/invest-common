<script setup lang="ts">
import {
  computed, watch, nextTick,
} from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { useHubspotForm } from 'InvestCommon/composable/useHubspotForm';
import { currency } from 'InvestCommon/helpers/currency';
import {
  ROUTE_INVEST_OWNERSHIP,
} from 'InvestCommon/helpers/enums/routes';
import { numberFormatter } from 'InvestCommon/helpers/numberFormatter';
import FormRow from 'UiKit/components/Base/VForm/VFormRow.vue';
import FormCol from 'UiKit/components/Base/VForm/VFormCol.vue';
import VFormGroup from 'UiKit/components/Base/VForm/VFormGroup.vue';
import VFormInput from 'UiKit/components/Base/VForm/VFormInput.vue';
import VButton from 'UiKit/components/Base/VButton/VButton.vue';
import { storeToRefs } from 'pinia';

import { JSONSchemaType } from 'ajv/dist/types/json-schema';
import { scrollToError } from 'UiKit/helpers/validation/general';
import { urlOfferSingle } from 'InvestCommon/global/links';
import { useSessionStore } from 'InvestCommon/domain/session/store/useSession';
import { useFormValidation } from 'InvestCommon/composable/useFormValidation';
import { useRepositoryInvestment } from 'InvestCommon/data/investment/investment.repository';

const { submitFormToHubspot } = useHubspotForm('749740b1-d955-4158-b949-b68e13a59e5b');

const userSessionStore = useSessionStore();
const { userSessionTraits } = storeToRefs(userSessionStore);
const investmentRepository = useRepositoryInvestment();
const { setAmountOptionsState, setAmountState, getInvestUnconfirmedOne } = storeToRefs(investmentRepository);

const router = useRouter();
const route = useRoute();

// new
type FormModel = {
  number_of_shares: number;
}
const price = computed(() => (getInvestUnconfirmedOne.value?.offer?.price_per_share || 0));
const numberOfShares = computed(() => getInvestUnconfirmedOne.value?.number_of_shares);
const totalShares = computed(() => getInvestUnconfirmedOne.value?.offer?.total_shares || 1000);
const subscribedShares = computed(() => getInvestUnconfirmedOne.value?.offer?.subscribed_shares || 10);
const maxInvestment = computed(() => (totalShares.value - subscribedShares.value));
const minInvestment = computed(() => (getInvestUnconfirmedOne.value?.offer?.min_investment || 10));

// Dynamic schema with computed validation rules
const schemaFrontend = computed(() => ({
  $schema: 'http://json-schema.org/draft-07/schema#',
  definitions: {
    AmountStep: {
      properties: {
        number_of_shares: {
          type: 'number',
          minimum: minInvestment.value,
          maximum: maxInvestment.value,
          errorMessage: {
            minimum: `${minInvestment.value} share(s) is minimum`,
            maximum: `${maxInvestment.value} share(s) is maximum`,
          },
        },
      },
      required: ['number_of_shares'],
      type: 'object',
    },
  },
  $ref: '#/definitions/AmountStep',
} as unknown as JSONSchemaType<FormModel>));

// Use form validation composable
const {
  model,
  validation,
  isValid,
  onValidate,
} = useFormValidation<FormModel>(
  schemaFrontend,
  undefined,
  {},
);


const errorData = computed(() => setAmountState.value.error?.data?.responseJson);
const schemaBackend = computed(() => setAmountOptionsState.value.data);

// Computed values
const sharesAmount = computed(() => numberFormatter(model.number_of_shares || 0));
const investmentAmount = computed(() => sharesAmount.value * price.value);

const isLeftLessThanMin = computed(() => (((maxInvestment.value - sharesAmount.value) < minInvestment.value)
  && (sharesAmount.value < maxInvestment.value) && (sharesAmount.value > minInvestment.value)));

const isBtnDisabled = computed(() => (
  !isValid.value
  || isLeftLessThanMin.value
));

const continueHandler = async () => {
  onValidate();
  if (!isValid.value) {
    nextTick(() => scrollToError('InvestFormAmount'));
    return;
  }

  const { slug, id, profileId } = route.params;
  await investmentRepository.setAmount(slug as string, id as string, profileId as string, sharesAmount.value);

  if (setAmountState.value.error) return;
  if (setAmountState.value.data) {
    router.push({
      name: ROUTE_INVEST_OWNERSHIP,
    });

    submitFormToHubspot({
      email: userSessionTraits.value?.email,
      shares_amount: sharesAmount.value,
      investment_amount: investmentAmount.value,
    });
  }
};



// Watch for number of shares changes from offer data
watch(() => numberOfShares.value, () => {
  if (numberOfShares.value) model.number_of_shares = numberOfShares.value;
}, { immediate: true });

const investmentAmountShow = computed(() => (
  investmentAmount.value > 0 ? currency(+investmentAmount.value.toFixed(2)) : undefined));
</script>

<template>
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
          Please enter either the maximum number of shares available - {{ maxInvestment }}, or reduce your order size by
          {{ minInvestment - maxInvestment + model.number_of_shares }}
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
</template>

<style lang="scss">
@use 'UiKit/styles/_variables.scss' as *;
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
    color: $red;
  }

  &__info {
    color: $gray-70;
    margin-top: 4px;
  }
}

</style>
