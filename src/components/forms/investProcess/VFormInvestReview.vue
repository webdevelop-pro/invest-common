<script setup lang="ts">
import { computed, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useFundingStore } from 'InvestCommon/store/useFunding';
import { useInvestmentsStore } from 'InvestCommon/store/useInvestments';
import { useOfferStore } from 'InvestCommon/store/useOffer';
import { useUsersStore } from 'InvestCommon/store/useUsers';
import { useHubspotForm } from 'InvestCommon/composable/useHubspotForm';
import { currency } from 'InvestCommon/helpers/currency';
import { ROUTE_INVEST_FUNDING, ROUTE_INVEST_THANK } from 'InvestCommon/helpers/enums/routes';
import FormRow from 'UiKit/components/Base/VForm/VFormRow.vue';
import FormCol from 'UiKit/components/Base/VForm/VFormCol.vue';
import VFormInput from 'UiKit/components/Base/VForm/VFormInput.vue';
import VButton from 'UiKit/components/Base/VButton/VButton.vue';
import VFormGroup from 'UiKit/components/Base/VForm/VFormGroup.vue';
import { storeToRefs } from 'pinia';
import arrowLeft from 'UiKit/assets/images/arrow-left.svg';
import { urlOfferSingle } from 'InvestCommon/global/links';
import { useProfileWalletStore } from 'InvestCommon/store/useProfileWallet/useProfileWallet';

const route = useRoute();
const router = useRouter();
const { slug, id, profileId } = route.params;

const investmentsStore = useInvestmentsStore();
const { setReviewData, isSetReviewLoading } = storeToRefs(investmentsStore);
const { submitFormToHubspot } = useHubspotForm('23d573ec-3714-4fdb-97c2-a3b688d5008f');
const profileWalletStore = useProfileWalletStore();
const {
  fundingSource,
} = storeToRefs(profileWalletStore);

const fundingStore = useFundingStore();
const {
  getFundingData, isFundTransferLoading,
} = storeToRefs(fundingStore);
const offerStore = useOfferStore();
const { getUnconfirmedOfferData } = storeToRefs(offerStore);
const usersStore = useUsersStore();
const { selectedUserProfileData, userAccountData } = storeToRefs(usersStore);

const isBankExist = computed(() => getFundingData.value?.meta
  && getFundingData.value?.meta.bank
  && getFundingData.value?.meta.bank.nc_account_nickname);

const InvestorName = computed(() => (
  `${selectedUserProfileData.value?.data?.first_name} ${selectedUserProfileData.value?.data?.middle_name} ${selectedUserProfileData.value?.data?.last_name}`
));

const fundingTypeFormated = computed(() => {
  const fundingType = getUnconfirmedOfferData.value?.funding_type;

  if (fundingType?.toLowerCase().includes('wallet')) {
    return fundingType.charAt(0).toUpperCase() + fundingType.slice(1);
  }
  return fundingType?.toUpperCase();
});
const confirmInvest = async () => {
  await investmentsStore.setReview(slug as string, id as string, profileId as string);
};

const fundingSourceId = computed(() => getUnconfirmedOfferData.value?.payment_data?.funding_source_id);
const fundingTypeWallet = computed(() => getUnconfirmedOfferData.value?.funding_type?.toLowerCase().includes('wallet'));
const fundingSourceDataById = computed(() => fundingSource.value?.find((item) => item.id === fundingSourceId.value));
const fundingSourceDataToShow = computed(() => (
  (fundingTypeWallet.value && (fundingSourceId.value > 0)) ? `${fundingSourceDataById.value?.bank_name}: ${fundingSourceDataById.value?.name}` : undefined));
// if on confirmInvest setReview action is ok
investmentsStore.$onAction(
  // eslint-disable-next-line
  ({ name, store, args, after, onError }) => {
    after(() => {
      switch (name) {
        case 'setReview':
          if (setReviewData.value?.investment) {
            if (isBankExist.value) {
              fundingStore.fundTransfer(setReviewData.value.investment.id);
            }
            router.push({
              name: ROUTE_INVEST_THANK,
              params: {
                id: setReviewData.value?.investment.id,
              },
            });

            submitFormToHubspot({
              email: userAccountData.value?.email,
              investment_id: setReviewData.value?.investment.id,
              offer_name: getUnconfirmedOfferData.value?.offer?.name,
              offer_slug: getUnconfirmedOfferData.value?.offer?.slug,
              investment_status: setReviewData.value?.investment.status,
            });
          }
          break;
        default:
      }
    });
  },
);

watch(() => fundingSourceId.value, () => {
  if (fundingSourceId.value > 0) {
    profileWalletStore.getWalletByProfileId(profileId);
  }
}, { immediate: true });
</script>

<template>
  <div
    class="FormInvestReview form-invest-review"
  >
    <p class="form-invest-review__descr is--subheading-2">
      Please carefully review your application. In case of any mistakes, just go back
      to the step and update your information.
    </p>

    <FormRow>
      <FormCol col2>
        <VFormGroup
          label="Amount of Shares"
        >
          <VFormInput
            :model-value="String(getUnconfirmedOfferData?.number_of_shares)"
            name="shares-amount"
            allow-integer-only
            readonly
            size="large"
            data-testid="shares-amount"
          />
        </VFormGroup>
      </FormCol>

      <FormCol col2>
        <VFormGroup
          label="Investment Amount"
        >
          <VFormInput
            :model-value="currency(getUnconfirmedOfferData?.amount)"
            name="amount"
            readonly
            size="large"
            data-testid="amount"
          />
        </VFormGroup>
      </FormCol>
    </FormRow>

    <div class="form-invest-review__subtitle is--h3__title">
      Ownership Information
    </div>

    <FormRow>
      <FormCol col2>
        <VFormGroup
          label="Investor’s Name"
        >
          <VFormInput
            :model-value="InvestorName"
            name="name"
            readonly
            size="large"
            data-testid="investor-name"
          />
        </VFormGroup>
      </FormCol>
      <FormCol col2>
        <VFormGroup
          label="Date of Birth"
        >
          <VFormInput
            :model-value="selectedUserProfileData?.data.dob"
            name="date-of-birth"
            readonly
            size="large"
            type="date"
            data-testid="date-of-birth"
          />
        </VFormGroup>
      </FormCol>
    </FormRow>

    <FormRow>
      <FormCol col2>
        <VFormGroup
          label="Phone number"
        >
          <VFormInput
            :model-value="selectedUserProfileData?.data.phone"
            name="phone"
            mask="+#(###)###-####"
            disallow-special-chars
            readonly
            size="large"
            data-testid="phone"
          />
        </VFormGroup>
      </FormCol>

      <FormCol col2>
        <VFormGroup
          label="SSN"
        >
          <VFormInput
            :model-value="selectedUserProfileData?.data.ssn"
            name="ssn"
            mask="###-##-####"
            disallow-special-chars
            readonly
            size="large"
            data-testid="ssn"
          />
        </VFormGroup>
      </FormCol>
    </FormRow>

    <div class="form-invest-review__subtitle is--h3__title">
      Funding Information
    </div>

    <FormRow>
      <FormCol>
        <VFormGroup
          label="Funding Type"
        >
          <VFormInput
            :model-value="fundingSourceDataToShow || fundingTypeFormated"
            name="funding-type"
            readonly
            size="large"
            data-testid="funding-type"
          />
        </VFormGroup>
      </FormCol>
    </FormRow>

    <div v-if="getUnconfirmedOfferData?.funding_type.toLowerCase() === 'ach'">
      <FormRow>
        <FormCol col2>
          <VFormGroup
            label="Account Holder Name"
          >
            <VFormInput
              :model-value="getUnconfirmedOfferData?.payment_data?.account_holder_name"
              placeholder="Account Holder name"
              name="holder-name"
              readonly
              size="large"
            />
          </VFormGroup>
        </FormCol>

        <FormCol col2>
          <VFormGroup
            label="Account Type"
          >
            <VFormInput
              :model-value="getUnconfirmedOfferData?.payment_data?.account_type"
              name="account-type"
              placeholder="Account Type"
              readonly
              size="large"
            />
          </VFormGroup>
        </FormCol>
      </FormRow>

      <FormRow>
        <FormCol col2>
          <VFormGroup
            label="Account Number"
          >
            <VFormInput
              :model-value="'********'"
              name="account-number"
              size="large"
              readonly
            />
          </VFormGroup>
        </FormCol>

        <FormCol col2>
          <VFormGroup
            label="Routing Number"
          >
            <VFormInput
              :model-value="'********'"
              name="routing-number"
              readonly
              size="large"
            />
          </VFormGroup>
        </FormCol>
      </FormRow>
    </div>

    <div class="form-invest-review__footer">
      <VButton
        variant="link"
        size="large"
        as="router-link"
        :to="{ name: ROUTE_INVEST_FUNDING, params: { slug, id, profileId } }"
      >
        <arrowLeft
          alt="arrow left"
          class="form-invest-review__back-icon"
        />
        Back
      </VButton>
      <div class="form-invest-review__btn">
        <VButton
          variant="outlined"
          size="large"
          as="a"
          :href="urlOfferSingle(route.params.slug)"
        >
          Cancel
        </VButton>
        <VButton
          :disabled="isSetReviewLoading || isFundTransferLoading"
          size="large"
          :loading="isSetReviewLoading || isFundTransferLoading"
          data-testid="saveButton"
          @click="confirmInvest"
        >
          Confirm & Invest
        </VButton>
      </div>
    </div>
  </div>
</template>

<style lang="scss">
@use 'UiKit/styles/_variables.scss' as *;
.form-invest-review {

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

  &__descr {
    margin-bottom: 40px;
    color: $gray-80;
    margin-top: -20px;
  }

  &__subtitle {
    margin-bottom: 20px;
    margin-top: 12px;
  }

  &__back-icon {
    width: 20px;
  }
}

</style>
