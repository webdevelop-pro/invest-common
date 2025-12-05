<script setup lang="ts">
import { defineAsyncComponent } from 'vue';
import { ROUTE_INVEST_OWNERSHIP } from 'InvestCommon/domain/config/enums/routes';
import VButton from 'UiKit/components/Base/VButton/VButton.vue';
import VFormCheckbox from 'UiKit/components/Base/VForm/VFormCheckbox.vue';
import VBadge from 'UiKit/components/Base/VBadge/VBadge.vue';
import arrowLeft from 'UiKit/assets/images/arrow-left.svg?component';
import file from 'UiKit/assets/images/file.svg';
import { urlTerms, urlPrivacy, urlOfferSingle } from 'InvestCommon/domain/config/links';
import InvestStep from 'InvestCommon/features/investProcess/components/InvestStep.vue';
import { useInvestSignature } from './logic/useInvestSignature';

const VDialogDocument = defineAsyncComponent({
  loader: () => import('./components/VDialogDocument.vue'),
  onError: (error) => {
    console.error('Failed to load VDialogDocument:', error);
  },
});

const {
  state,
  signId,
  signUrl,
  isLoading,
  canContinue,
  slug,
  id,
  profileId,
  handleDocument,
  handleContinue,
  openHelloSign,
  closeHelloSign,
} = useInvestSignature();
</script>

<template>
  <div class="ViewInvestSignature view-invest-signature is--no-margin">
    <InvestStep
      title="Signature"
      :step-number="3"
      :is-loading="isLoading"
    >
      <div class="FormInvestSignature form-invest-signature">
        <!-- Header -->
        <div class="form-invest-signature__label is--h6__title">
          Review and sign the agreement:
        </div>

        <!-- Document Section -->
        <div
          class="form-invest-signature__document"
          role="button"
          tabindex="0"
          @click="handleDocument"
          @keydown.enter="handleDocument"
          @keydown.space="handleDocument"
        >
          <VButton
            size="large"
            variant="link"
            color="secondary"
            :loading="isLoading"
            :disabled="isLoading"
            class="form-invest-signature__document-button"
          >
            <file
              alt="file icon"
              class="form-invest-signature__document-icon"
            />
            Investment Agreement
          </VButton>

          <VBadge
            size="medium"
            :color="signId ? 'secondary-light' : undefined"
            class="form-invest-signature__tag"
            data-testid="document-sign"
            :class="{ 'is-signed': signId }"
          >
            {{ signId ? 'Signed' : 'Signature Needed' }}
          </VBadge>
        </div>

        <!-- Checkboxes -->
        <div class="form-invest-signature__checkbox-wrap">
          <VFormCheckbox
            v-model="state.checkbox1"
            data-testid="V-checkbox"
            class="form-invest-signature__checkbox"
            has-asterisk
          >
            I have reviewed and agree to the terms of the offering document
            and I agree to complete the investment process using HelloSign.
          </VFormCheckbox>
          
          <VFormCheckbox
            v-model="state.checkbox2"
            data-testid="V-checkbox"
            class="form-invest-signature__checkbox"
            has-asterisk
          >
            I have reviewed and agree to the
            <a
              :href="urlTerms"
              target="_blank"
              rel="noopener noreferrer"
              class="form-invest-signature__link is--link-1"
            >
              Terms of use
            </a> and the
            <a
              :href="urlPrivacy"
              target="_blank"
              rel="noopener noreferrer"
              class="form-invest-signature__link is--link-1"
            >
              Privacy Policy
            </a>.
          </VFormCheckbox>
        </div>

        <!-- Footer -->
        <div class="form-invest-signature__footer">
          <VButton
            variant="link"
            size="large"
            as="router-link"
            :to="{ name: ROUTE_INVEST_OWNERSHIP, params: { slug, id, profileId } }"
            class="is--gt-tablet-show"
          >
            <arrowLeft
              alt="arrow left"
              class="form-invest-signature__back-icon"
            />
            Back
          </VButton>
          
          <div class="form-invest-signature__btn">
            <VButton
              variant="link"
              size="large"
              as="router-link"
              :to="{ name: ROUTE_INVEST_OWNERSHIP, params: { slug, id, profileId } }"
              class="is--lt-tablet-show"
            >
              <arrowLeft
                alt="arrow left"
                class="form-invest-signature__back-icon"
              />
              Back
            </VButton>
            <VButton
              variant="outlined"
              size="large"
              as="a"
              :href="urlOfferSingle(slug)"
            >
              Cancel
            </VButton>
            <VButton
              :disabled="!canContinue"
              size="large"
              data-testid="continue-button"
              class="form-invest-signature__save"
              @click="handleContinue"
            >
              Continue
            </VButton>
          </div>
        </div>

        <!-- Document Dialog -->
        <VDialogDocument
          v-model="state.isDialogDocumentOpen"
          :sign-url="signUrl"
          :close="closeHelloSign"
          :open="openHelloSign"
        />
      </div>
    </InvestStep>
  </div>
</template>

<style lang="scss">
@use 'UiKit/styles/_variables.scss' as *;

.view-invest-signature {
  width: 100%;
  padding-top: $header-height;
}

.form-invest-signature {
  &__label {
    color: $gray-70;
  }

  &__document {
    margin: 8px 0 30px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 16px;
    gap: 8px;
    border-top: 1px solid $gray-20;
    border-bottom: 1px solid $gray-20;
    cursor: pointer;
    transition: background-color 0.3s ease;
    outline: none;

    &:hover,
    &:focus-visible {
      background-color: $gray-10;
    }

    @media screen and (max-width: $tablet) {
      flex-direction: column;
      padding: 16px 0;
      gap: 10px;
    }
  }

  &__checkbox {
    margin-bottom: 20px;
    padding: 0 14px;

    &:last-child {
      margin-bottom: 0;
    }

    @media screen and (max-width: $tablet) {
      padding: 0;
    }
  }

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
    margin-top: 40px;
    display: flex;
    justify-content: space-between;
    gap: 12px;
    flex-wrap: wrap;
  }

  &__document-icon {
    width: 19px;
    flex-shrink: 0;
  }

  &__back-icon {
    width: 20px;
  }

  &__link {
    margin-top: -2px;
    display: inline-block;
  }

  &__save {
    @media screen and (width < $tablet){
      width: 100%;
    }
  }
}
</style>
