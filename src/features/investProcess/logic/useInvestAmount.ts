import {
  computed, watch, nextTick,
} from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { useGlobalLoader } from 'UiKit/store/useGlobalLoader';
import { useHubspotForm } from 'InvestCommon/composable/useHubspotForm';
import { currency } from 'InvestCommon/helpers/currency';
import {
  ROUTE_INVEST_OWNERSHIP,
} from 'InvestCommon/helpers/enums/routes';
import { numberFormatter } from 'InvestCommon/helpers/numberFormatter';
import { JSONSchemaType } from 'ajv/dist/types/json-schema';
import { scrollToError } from 'UiKit/helpers/validation/general';
import { useSessionStore } from 'InvestCommon/domain/session/store/useSession';
import { useFormValidation } from 'InvestCommon/composable/useFormValidation';
import { useRepositoryInvestment } from 'InvestCommon/data/investment/investment.repository';
import { storeToRefs } from 'pinia';

export type FormModel = {
  number_of_shares: number;
}

export function useInvestAmount() {
  const globalLoader = useGlobalLoader();
  globalLoader.hide();

  const { submitFormToHubspot } = useHubspotForm('749740b1-d955-4158-b949-b68e13a59e5b');

  const userSessionStore = useSessionStore();
  const { userSessionTraits } = storeToRefs(userSessionStore);
  const investmentRepository = useRepositoryInvestment();
  const { setAmountOptionsState, setAmountState, getInvestUnconfirmedOne } = storeToRefs(investmentRepository);

  const router = useRouter();
  const route = useRoute();

  // Computed values from investment data
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

  const investmentAmountShow = computed(() => (
    investmentAmount.value > 0 ? currency(+investmentAmount.value.toFixed(2)) : undefined));

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

  return {
    // Form state
    model,
    validation,
    isValid,
    onValidate,
    
    // Computed values
    price,
    numberOfShares,
    totalShares,
    subscribedShares,
    maxInvestment,
    minInvestment,
    sharesAmount,
    investmentAmount,
    investmentAmountShow,
    
    // Validation state
    errorData,
    schemaBackend,
    schemaFrontend,
    isLeftLessThanMin,
    isBtnDisabled,
    
    // Actions
    continueHandler,
    
    // Repository state
    setAmountState,
    setAmountOptionsState,
  };
} 