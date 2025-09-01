<script setup lang="ts">
import VFormInput from 'UiKit/components/Base/VForm/VFormInput.vue';
import VButton from 'UiKit/components/Base/VButton/VButton.vue';
import VFormCheckbox from 'UiKit/components/Base/VForm/VFormCheckbox.vue';
import VFormGroup from 'UiKit/components/Base/VForm/VFormGroup.vue';
import VFormRadio from 'UiKit/components/Base/VForm/VFormRadio.vue';
import { useVFormComments } from './logic/useVFormComments';

const props = defineProps({
  offerId: {
    type: Number,
    required: true,
  },
  offerName: {
    type: String,
    required: true,
  },
  loading: {
    type: Boolean,
    default: false,
  },
});

const {
  model,
  isDisabledButton,
  disclosureCheckbox,
  relatedOptionsFiltered,
  isAuth,
  sendQuestion,
  signInHandler,
  errorData,
  setOfferCommentState,
  setOfferCommentOptionsState,
  isFieldRequired,
  getErrorText,
} = useVFormComments(props.offerId);
</script>

<template>
  <div class="VFormComments v-form-comments">
    <VFormGroup
      v-slot="VFormGroupProps"
      :required="isFieldRequired('comment')"
      :error-text="getErrorText('comment', errorData)"
      data-testid="comment-group"
      label="Ask a Question"
      class="v-form-comments__comment-wrap"
    >
      <VFormInput
        :model-value="model.comment"
        :is-error="VFormGroupProps.isFieldError"
        placeholder="Ask a question"
        name="question"
        size="large"
        :loading="loading"
        @update:model-value="model.comment = $event"
      />
    </VFormGroup>
    <div class="v-form-comments__disclosure">
      <div class="v-form-comments__checkbox-wrap">
        <VFormCheckbox
          v-model="disclosureCheckbox"
          class="v-form-comments__checkbox"
        >
          Disclosure: I have a financial relationship with {{ offerName }}
        </VFormCheckbox>

        <VButton
          v-if="!isAuth"
          class="is--margin-top-0"
          size="large"
          :loading="loading"
          @click="signInHandler"
        >
          Sign in
        </VButton>
        <VButton
          v-else
          :loading="loading || setOfferCommentState.loading || setOfferCommentOptionsState.loading"
          :disabled="isDisabledButton"
          size="large"
          @click="sendQuestion"
        >
          Post
        </VButton>
      </div>
      <Transition
        name="fade"
        mode="out-in"
      >
        <div
          v-if="disclosureCheckbox"
          class="v-form-comments__related"
        >
          <VFormGroup
            v-slot="VFormGroupProps"
            :model="model"
            path="related"
            label="I am an:"
          >
            <VFormRadio
              v-model="model.related"
              row
              :is-error="VFormGroupProps.isFieldError"
              :options="relatedOptionsFiltered"
              class="v-form-comments__radio"
            />
          </VFormGroup>
        </div>
      </Transition> 
    </div>
  </div>
</template>

<style lang="scss">
.v-form-comments {
  padding-bottom: 60px;
  border-bottom: 1px solid $gray-40;

  &__comment-wrap {
    width: 100%;
    margin-bottom: 20px;
  }

  &__disclosure {
    width: 100%;
  }

  &__checkbox-wrap {
    display: flex;
    justify-content: space-between;
  }

  .v-form-radio__item-input {
    margin: 0;
  }

  .v-form-group__input {
    margin: 0;
  }
}

</style>
