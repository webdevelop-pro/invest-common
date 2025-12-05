<script setup lang="ts">
import { useInvestFunding } from 'InvestCommon/features/investProcess/logic/useInvestFunding';
import FormRow from 'UiKit/components/Base/VForm/VFormRow.vue';
import FormCol from 'UiKit/components/Base/VForm/VFormCol.vue';
import VButton from 'UiKit/components/Base/VButton/VButton.vue';
import VFormSelect from 'UiKit/components/Base/VForm/VFormSelect.vue';
import VFormGroup from 'UiKit/components/Base/VForm/VFormGroup.vue';
import arrowLeft from 'UiKit/assets/images/arrow-left.svg';
import InvestStep from 'InvestCommon/features/investProcess/components/InvestStep.vue';

const {
  model,
  componentData,
  selectOptions,
  selectErrors,
  isBtnDisabled,
  currentComponent,
  currentProps,
  continueHandler,
  setFundingState,
  id,
  slug,
  profileId,
  ROUTE_INVEST_SIGNATURE,
  urlOfferSingle,
  isFieldRequired,
} = useInvestFunding();
</script>

<template>
  <div class="ViewInvestFunding view-invest-funding is--no-margin">
    <InvestStep
      title="Funding"
      :step-number="4"
    >
      <div class="FormInvestFunding form-invest-funding">
        <FormRow>
          <FormCol>
            <VFormGroup
              v-slot="VFormGroupProps"
              :required="isFieldRequired('funding_type')"
              :error-text="selectErrors"
              data-testid="funding-type-group"
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
            class="is--gt-tablet-show"
          >
            <arrowLeft
              alt="arrow left"
              class="form-invest-funding__back-icon"
            />
            Back
          </VButton>
          <div class="form-invest-funding__btn">
            <VButton
              variant="link"
              size="large"
              as="router-link"
              :to="{ name: ROUTE_INVEST_SIGNATURE, params: { slug, id, profileId } }"
              class="is--lt-tablet-show"
            >
              <arrowLeft
                alt="arrow left"
                class="form-invest-funding__back-icon"
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
              :disabled="isBtnDisabled"
              :loading="setFundingState.loading"
              size="large"
              class="form-invest-funding__save"
              @click="continueHandler"
            >
              Continue
            </VButton>
          </div>
        </div>
      </div>
    </InvestStep>
  </div>
</template>

<style lang="scss">
@use 'UiKit/styles/_variables.scss' as *;

.view-invest-funding {
  width: 100%;
  padding-top: $header-height;
}

.form-invest-funding {
  &__btn {
    display: flex;
    justify-content: flex-end;
    gap: 12px;
    flex-wrap: wrap;

    @media screen and (width < $tablet){
      justify-content: space-between;
      width: 100%;
    }
  }

  &__footer {
    margin-top: 20px;
    display: flex;
    justify-content: space-between;
    gap: 12px;
    flex-wrap: wrap;
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
