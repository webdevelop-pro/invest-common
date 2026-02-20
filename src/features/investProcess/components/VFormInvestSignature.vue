<script setup lang="ts">
import { defineAsyncComponent } from 'vue';
import VFormCheckbox from 'UiKit/components/Base/VForm/VFormCheckbox.vue';
import VBadge from 'UiKit/components/Base/VBadge/VBadge.vue';
import VButton from 'UiKit/components/Base/VButton/VButton.vue';
import file from 'UiKit/assets/images/file.svg';
import { urlTerms, urlPrivacy } from 'InvestCommon/domain/config/links';
import { useInvestSignatureForm } from './logic/useInvestSignatureForm';

const VDialogDocument = defineAsyncComponent({
  loader: () => import('./VDialogDocument.vue'),
  onError: (error) => {
    console.error('Failed to load VDialogDocument:', error);
  },
});

const props = defineProps({
  signId: {
    type: [String, Number],
    default: null,
  },
  isLoading: {
    type: Boolean,
    default: false,
  },
  signUrl: {
    type: String,
    default: '',
  },
});

const emit = defineEmits<{
  (e: 'documentClick'): void;
}>();

const {
  state,
  canContinue,
  isSigned,
  isValid,
  isBtnDisabled,
  onValidate,
  scrollToError,
  isDirty,
} = useInvestSignatureForm(props);

const handleDocument = () => {
  emit('documentClick');
};

// Expose validation/interaction state to parent component
defineExpose({
  // Common pattern across Invest forms
  isValid,
  onValidate,
  scrollToError,
  isBtnDisabled,
  isDirty,
  // Signature-specific contract
  canContinue,
  state,
});
</script>

<template>
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
        :color="isSigned ? 'secondary-light' : undefined"
        class="form-invest-signature__tag"
        data-testid="document-sign"
        :class="{ 'is-signed': isSigned }"
      >
        {{ isSigned ? 'Signed' : 'Signature Needed' }}
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

    <!-- Document Dialog -->
    <VDialogDocument
      v-model="state.isDialogDocumentOpen"
      :sign-url="signUrl"
    />
  </div>
</template>

<style lang="scss">
@use 'UiKit/styles/_variables.scss' as *;

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

  &__document-icon {
    width: 19px;
    flex-shrink: 0;
  }

  &__link {
    margin-top: -2px;
    display: inline-block;
  }
}
</style>
