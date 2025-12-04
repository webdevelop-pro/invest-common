<script setup lang="ts">
import { ROUTE_INVEST_FUNDING } from 'InvestCommon/domain/config/enums/routes';
import { useInvestReview } from './logic/useInvestReview';
import FormRow from 'UiKit/components/Base/VForm/VFormRow.vue';
import FormCol from 'UiKit/components/Base/VForm/VFormCol.vue';
import VFormInput from 'UiKit/components/Base/VForm/VFormInput.vue';
import VButton from 'UiKit/components/Base/VButton/VButton.vue';
import VFormGroup from 'UiKit/components/Base/VForm/VFormGroup.vue';
import arrowLeft from 'UiKit/assets/images/arrow-left.svg';
import InvestStep from 'InvestCommon/features/investProcess/components/InvestStep.vue';

const {
  slug,
  id,
  profileId,
  selectedUserProfileData,
  getInvestUnconfirmedOne,
  setReviewState,
  investorName,
  fundingSourceDataToShow,
  isSsnHidden,
  confirmInvest,
  urlOfferSingle,
} = useInvestReview();
</script>

<template>
  <div class="ViewInvestReview view-invest-review is--no-margin">
    <InvestStep
      title="Confirmation"
      :step-number="5"
      :is-loading="setReviewState.loading"
    >
      <div class="FormInvestReview form-invest-review">
        <p class="form-invest-review__descr is--subheading-2">
          Please carefully review your application. In case of any mistakes, just go back
          to the step and update your information.
        </p>

        <FormRow>
          <FormCol col2>
            <VFormGroup label="Amount of Shares">
              <VFormInput
                :model-value="String(getInvestUnconfirmedOne?.number_of_shares)"
                name="shares-amount"
                allow-integer-only
                readonly
                size="large"
                data-testid="shares-amount"
              />
            </VFormGroup>
          </FormCol>
          <FormCol col2>
            <VFormGroup label="Investment Amount">
              <VFormInput
                :model-value="getInvestUnconfirmedOne?.amountFormatted"
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
            <VFormGroup label="Investor's Name">
              <VFormInput
                :model-value="investorName"
                name="name"
                readonly
                size="large"
                data-testid="investor-name"
              />
            </VFormGroup>
          </FormCol>
          <FormCol col2>
            <VFormGroup label="Date of Birth">
              <VFormInput
                :model-value="selectedUserProfileData?.data?.dob"
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
            <VFormGroup label="Phone number">
              <VFormInput
                :model-value="selectedUserProfileData?.data?.phone"
                name="phone"
                mask="+#(###)###-####"
                disallow-special-chars
                readonly
                size="large"
                data-testid="phone"
              />
            </VFormGroup>
          </FormCol>
          <FormCol
            v-if="!isSsnHidden"
            col2
          >
            <VFormGroup label="SSN">
              <VFormInput
                :model-value="selectedUserProfileData?.data?.ssn"
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
            <VFormGroup label="Funding Type">
              <VFormInput
                :model-value="fundingSourceDataToShow"
                name="funding-type"
                readonly
                size="large"
                data-testid="funding-type"
              />
            </VFormGroup>
          </FormCol>
        </FormRow>

        <div v-if="getInvestUnconfirmedOne?.funding_type?.toLowerCase() === 'ach'">
          <FormRow>
            <FormCol col2>
              <VFormGroup label="Account Holder Name">
                <VFormInput
                  :model-value="getInvestUnconfirmedOne?.payment_data?.account_holder_name"
                  placeholder="Account Holder name"
                  name="holder-name"
                  readonly
                  size="large"
                />
              </VFormGroup>
            </FormCol>
            <FormCol col2>
              <VFormGroup label="Account Type">
                <VFormInput
                  :model-value="getInvestUnconfirmedOne?.payment_data?.account_type"
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
              <VFormGroup label="Account Number">
                <VFormInput
                  model-value="********"
                  name="account-number"
                  size="large"
                  readonly
                />
              </VFormGroup>
            </FormCol>
            <FormCol col2>
              <VFormGroup label="Routing Number">
                <VFormInput
                  model-value="********"
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
            class="is--gt-tablet-show"
          >
            <arrowLeft
              alt="arrow left"
              class="form-invest-review__back-icon"
            />
            Back
          </VButton>
          
          <div class="form-invest-review__btn">
            <VButton
              variant="link"
              size="large"
              as="router-link"
              :to="{ name: ROUTE_INVEST_FUNDING, params: { slug, id, profileId } }"
              class="is--lt-tablet-show"
            >
              <arrowLeft
                alt="arrow left"
                class="form-invest-review__back-icon"
              />
              Back
            </VButton>
            <VButton
              variant="outlined"
              size="large"
              as="a"
              :href="urlOfferSingle(slug as string)"
            >
              Cancel
            </VButton>
            <VButton
              :disabled="setReviewState.loading"
              size="large"
              :loading="setReviewState.loading"
              data-testid="saveButton"
              class="form-invest-review__save"
              @click="confirmInvest"
            >
              Confirm & Invest
            </VButton>
          </div>
        </div>
      </div>
    </InvestStep>
  </div>
</template>

<style lang="scss">
@use 'UiKit/styles/_variables.scss' as *;

.view-invest-review {
  width: 100%;
  padding-top: $header-height;
}

.form-invest-review {
  &__btn {
    display: flex;
    justify-content: flex-end;
    gap: 12px;
    flex-wrap: wrap;

    @media screen and (width < $tablet){
      justify-content: space-between;
    }
  }

  &__footer {
    margin-top: 20px;
    display: flex;
    justify-content: space-between;
    gap: 12px;
    flex-wrap: wrap;
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

  &__save {
    @media screen and (width < $tablet){
      width: 100%;
    }
  }
}
</style>
