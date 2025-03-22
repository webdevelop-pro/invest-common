<script setup lang="ts">
import {
  ref, computed, reactive, watch, nextTick, onMounted,
} from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { useInvestmentsStore } from 'InvestCommon/store/useInvestments';
import { useOfferStore } from 'InvestCommon/store/useOffer';
import { useProfileWalletStore } from 'InvestCommon/store/useProfileWallet/useProfileWallet';
import { useUsersStore } from 'InvestCommon/store/useUsers';
import { useHubspotForm } from 'InvestCommon/composable/useHubspotForm';
import { ROUTE_INVEST_REVIEW, ROUTE_INVEST_SIGNATURE } from 'InvestCommon/helpers/enums/routes';
import { IInvestFunding } from 'InvestCommon/types/api/invest';
import { FundingTypes } from 'InvestCommon/helpers/enums/general';
import FormRow from 'UiKit/components/Base/VForm/VFormRow.vue';
import FormCol from 'UiKit/components/Base/VForm/VFormCol.vue';
import VButton from 'UiKit/components/Base/VButton/VButton.vue';
import VFormSelect from 'UiKit/components/Base/VForm/VFormSelect.vue';
import InvestFormFundingAch from './VFormInvestFundingAch.vue';
import InvestFormFundingWire from './VFormInvestFundingWire.vue';
import InvestFormFundingWallet from './VFormInvestFundingWallet.vue';
import { storeToRefs } from 'pinia';
import { currency } from 'InvestCommon/helpers/currency';
import VFormGroup from 'UiKit/components/Base/VForm/VFormGroup.vue';
import { PrecompiledValidator } from 'UiKit/helpers/validation/PrecompiledValidator';
import { isEmpty } from 'lodash';
import arrowLeft from 'UiKit/assets/images/arrow-left.svg';
import { scrollToError } from 'UiKit/helpers/validation/general';
import { urlOfferSingle } from 'InvestCommon/global/links';
import { errorMessageRule } from 'UiKit/helpers/validation/rules';
import { JSONSchemaType } from 'ajv/dist/types/json-schema';

const SELECT_OPTIONS_FUNDING_TYPE = [
  {
    value: FundingTypes.ach,
    text: 'ACH',
  },
  {
    value: FundingTypes.wire,
    text: 'WIRE',
  },
];

type FormModelInvestmentFunding = {
  funding_type: FundingTypes;
}
const schemaInvestmentFunding = {
  $schema: 'http://json-schema.org/draft-07/schema#',
  definitions: {
    FundingStep: {
      properties: {
        funding_type: {},
      },
      errorMessage: errorMessageRule,
    },
  },
  $ref: '#/definitions/FundingStep',
} as unknown as JSONSchemaType<FormModelInvestmentFunding>;

const route = useRoute();
const router = useRouter();
const investmentsStore = useInvestmentsStore();
const {
  setFundingData, isSetFundingLoading, setFundingOptionsData, setFundingErrorData,
} = storeToRefs(investmentsStore);
const { submitFormToHubspot } = useHubspotForm('b27d194e-cbab-4c53-9d60-1065be6425be');
const profileWalletStore = useProfileWalletStore();
const { isWalletStatusAnyError, isTotalBalanceZero } = storeToRefs(profileWalletStore);
const offerStore = useOfferStore();
const { getUnconfirmedOfferData } = storeToRefs(offerStore);
const usersStore = useUsersStore();
const { selectedUserProfileData, userAccountData } = storeToRefs(usersStore);

const SELECT_OPTIONS_FUNDING_TYPE_WITH_WALLET = computed(() => ([
  {
    value: FundingTypes.ach,
    text: 'ACH',
  },
  {
    value: FundingTypes.wire,
    text: 'WIRE',
  },
  {
    value: FundingTypes.wallet,
    text: `Wallet (${currency(profileWalletStore.totalBalance)})`,
  },
]));

const model = reactive({} as FormModelInvestmentFunding);
let validator = new PrecompiledValidator<FormModelInvestmentFunding>(
  setFundingOptionsData.value,
  schemaInvestmentFunding,
);
const validation = ref<unknown>();
const isValid = computed(() => isEmpty(validation.value || {}));

const onValidate = () => {
  validation.value = validator.getFormValidationErrors(model);
};

const id = route?.params.id as string;
const slug = route?.params.slug as string;
const profileId = route?.params.profileId as string;
const componentData = ref({
  isInvalid: false,
  accountHolderName: '',
  accountType: '',
  accountNumber: '',
  routingNumber: '',
});
const hasWallet = computed(() => (selectedUserProfileData.value?.wallet.id
  && (selectedUserProfileData.value?.wallet.id > 0) && !isWalletStatusAnyError.value));
const notEnoughWalletFunds = computed(() => (
  (getUnconfirmedOfferData.value?.amount || 0) > profileWalletStore.totalBalance));

const selectOptions = computed(() => {
  const isWalletExist = SELECT_OPTIONS_FUNDING_TYPE.find((item) => item.value === FundingTypes.wallet);
  if (hasWallet.value && !isWalletExist && !isTotalBalanceZero.value) {
    return SELECT_OPTIONS_FUNDING_TYPE_WITH_WALLET.value;
  }
  return SELECT_OPTIONS_FUNDING_TYPE;
});
const selectErrors = computed(() => {
  const isWallet = model.funding_type === FundingTypes.wallet;
  if (isWallet && notEnoughWalletFunds.value) {
    const message = 'Wallet does not have enough funds';
    return [message];
  }
  if (isWallet && setFundingErrorData.value?.wallet) {
    return setFundingErrorData.value.wallet;
  }
  return [];
});
const userName = computed(() => `${selectedUserProfileData.value?.data?.first_name || ''} ${selectedUserProfileData.value?.data?.last_name || ''}`);
const isBtnDisabled = computed(() => {
  if (model.funding_type === FundingTypes.ach) return componentData.value.isInvalid;
  if (model.funding_type === FundingTypes.wallet) return notEnoughWalletFunds.value;
  return false;
});
const currentComponent = computed(() => {
  if (model.funding_type === FundingTypes.wallet) return InvestFormFundingWallet;
  if (model.funding_type === FundingTypes.wire) return InvestFormFundingWire;
  if (model.funding_type === FundingTypes.ach) return InvestFormFundingAch;
  return null;
});
const validate = ref(false);
const currentProps = computed(() => {
  if (currentComponent.value === InvestFormFundingWire) {
    return {
      'offer-id': id,
      'user-name': userName.value,
    };
  }
  if (currentComponent.value === InvestFormFundingAch) {
    return {
      validate: validate.value,
    };
  }
  return false;
});

const fundingAnalytics = (type: FundingTypes, options: object) => {
  submitFormToHubspot({
    email: userAccountData.value?.email,
    funding_type: type,
    ...options,
  });
};

const continueHandler = async () => {
  onValidate();
  if (!isValid.value) {
    nextTick(() => scrollToError('InvestFormFunding'));
    return;
  }

  let data: IInvestFunding = { funding_type: model.funding_type };
  validate.value = true;
  await nextTick();
  validate.value = false;
  if ((model.funding_type === FundingTypes.ach) && componentData.value.isInvalid) return;
  const paymentData = {
    account_number: componentData.value.accountNumber,
    routing_number: componentData.value.routingNumber,
    account_holder_name: componentData.value.accountHolderName,
    account_type: componentData.value.accountType,
  };
  if (model.funding_type === FundingTypes.ach) {
    data = {
      funding_type: model.funding_type,
      payment_data: paymentData,
    };
  }
  await investmentsStore.setFunding(slug, id, profileId, data);

  if (setFundingData.value) {
    router.push({
      name: ROUTE_INVEST_REVIEW,
    });

    if (model.funding_type === FundingTypes.ach) {
      fundingAnalytics(FundingTypes.ach, paymentData);
    } else if (model.funding_type === FundingTypes.wire) {
      fundingAnalytics(FundingTypes.wire, {
        offer_id: id,
        user_name: userName.value,
      });
    }
  }
};

watch(() => setFundingOptionsData.value, () => {
  validator = new PrecompiledValidator<FormModelInvestmentFunding>(
    setFundingOptionsData.value,
    schemaInvestmentFunding,
  );
});

watch(() => getUnconfirmedOfferData.value?.funding_type, () => {
  if (getUnconfirmedOfferData.value?.funding_type && (getUnconfirmedOfferData.value?.funding_type !== 'none')) {
    model.funding_type = getUnconfirmedOfferData.value?.funding_type;
  }
}, { immediate: true });

watch(() => model, () => {
  if (!isValid.value) onValidate();
}, { deep: true });

onMounted(() => {
  if (selectedUserProfileData.value?.wallet?.id && (selectedUserProfileData.value?.wallet.id > 0)) {
    profileWalletStore.getProfileByIdWallet();
  }
});
</script>

<template>
  <div class="FormInvestFunding form-invest-funding">
    <FormRow>
      <FormCol>
        <VFormGroup
          v-slot="VFormGroupProps"
          :model="model"
          :validation="validation"
          :schema-back="setFundingOptionsData"
          :schema-front="schemaInvestmentFunding"
          :error-text="selectErrors"
          path="funding_type"
          label="Funding Method"
        >
          <VFormSelect
            v-model="model.funding_type"
            :is-error="VFormGroupProps.isFieldError"
            item-label="text"
            item-value="value"
            placeholder="Select"
            size="large"
            name="funding-type"
            :loading="(selectOptions?.length === 0)"
            :options="selectOptions"
          />
        </VFormGroup>
      </FormCol>
    </FormRow>

    <KeepAlive>
      <component
        :is="currentComponent"
        v-bind="currentProps"
        v-model="componentData"
      />
    </KeepAlive>

    <div class="form-invest-funding__footer">
      <VButton
        variant="link"
        size="large"
        as="router-link"
        :to="{ name: ROUTE_INVEST_SIGNATURE, params: { slug, id, profileId } }"
      >
        <arrowLeft
          alt="arrow left"
          class="form-invest-funding__back-icon"
        />
        Back
      </VButton>
      <div class="form-invest-funding__btn">
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
          :loading="isSetFundingLoading"
          size="large"
          @click="continueHandler"
        >
          Continue
        </VButton>
      </div>
    </div>
  </div>
</template>

<style lang="scss">
@use 'UiKit/styles/_variables.scss' as *;
.form-invest-funding {
  &__btn {
    display: flex;
    justify-content: flex-end;
    gap: 12px;

    @media screen and (max-width: $tablet){
      flex-direction: column;
    }
  }

  &__footer {
    margin-top: 20px;
    display: flex;
    justify-content: space-between;

    @media screen and (max-width: $tablet){
      flex-direction: column;
      gap: 12px;
    }
  }

  &__back-icon {
    width: 20px;
  }
}
</style>
