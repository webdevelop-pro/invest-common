<script setup lang="ts">
import FormRow from 'UiKit/components/Base/VForm/VFormRow.vue';
import FormCol from 'UiKit/components/Base/VForm/VFormCol.vue';
import VFormInput from 'UiKit/components/Base/VForm/VFormInput.vue';
import VFormGroup from 'UiKit/components/Base/VForm/VFormGroup.vue';
import { useInvestReviewForm } from './logic/useInvestReviewForm';

const props = defineProps({
  data: {
    type: Object,
  },
  selectedUserProfileData: {
    type: Object,
  },
});

const {
  investorName,
  fundingSourceDataToShow,
  isAchFunding,
} = useInvestReviewForm(props);
</script>

<template>
  <div class="FormInvestReview form-invest-review">
    <p class="form-invest-review__descr is--subheading-2">
      Please carefully review your application. In case of any mistakes, just go back
      to the step and update your information.
    </p>

    <FormRow>
      <FormCol col2>
        <VFormGroup label="Amount of Shares">
          <VFormInput
            :model-value="String(data?.number_of_shares)"
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
            :model-value="data?.amountFormatted"
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

    <div v-if="isAchFunding">
      <FormRow>
        <FormCol col2>
          <VFormGroup label="Account Holder Name">
            <VFormInput
              :model-value="data?.payment_data?.account_holder_name"
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
              :model-value="data?.payment_data?.account_type"
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
  </div>
</template>

<style lang="scss">
@use 'UiKit/styles/_variables.scss' as *;

.form-invest-review {
  &__descr {
    margin-bottom: 40px;
    color: $gray-80;
    margin-top: -20px;
  }

  &__subtitle {
    margin-bottom: 20px;
    margin-top: 12px;
  }
}
</style>
