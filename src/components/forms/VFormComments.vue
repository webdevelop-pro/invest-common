<script setup lang="ts">
import {
  ref, watch, computed, reactive, nextTick,
} from 'vue';
import { useOfferStore } from 'InvestCommon/store/useOffer';
import { useUsersStore } from 'InvestCommon/store/useUsers';
import { IOfferCommentPayload } from 'InvestCommon/types/api/offers';
import VFormInput from 'UiKit/components/Base/VForm/VFormInput.vue';
import VButton from 'UiKit/components/Base/VButton/VButton.vue';
import VFormCheckbox from 'UiKit/components/Base/VForm/VFormCheckbox.vue';
import { storeToRefs } from 'pinia';
import { PrecompiledValidator } from 'UiKit/helpers/validation/PrecompiledValidator';
import VFormGroup from 'UiKit/components/Base/VForm/VFormGroup.vue';
import { isEmpty } from 'InvestCommon/helpers/general';
import { navigateWithQueryParams } from 'UiKit/helpers/general';
import VFormRadio from 'UiKit/components/Base/VForm/VFormRadio.vue';
import { scrollToError } from 'UiKit/helpers/validation/general';
import { urlSignin } from 'InvestCommon/global/links';
import { errorMessageRule } from 'UiKit/helpers/validation/rules';
import { JSONSchemaType } from 'ajv/dist/types/json-schema';

const props = defineProps({
  offerId: {
    type: Number,
    required: true,
  },
  offerName: {
    type: String,
    required: true,
  },
});

type FormModelOfferComment = {
  comment: string;
  offer_id: number;
  related: string;
}

const schemaOfferComment = {
  $schema: 'http://json-schema.org/draft-07/schema#',
  definitions: {
    CommentCreate: {
      properties: {
        comment: {},
        offer_id: {},
        related: {},
      },
      type: 'object',
      errorMessage: errorMessageRule,
    },
  },
  $ref: '#/definitions/CommentCreate',
} as unknown as JSONSchemaType<FormModelOfferComment>;

const offerStore = useOfferStore();
const {
  isSetOfferCommentLoading, setOfferCommentsData, setOfferCommentsOptionsData,
  setOfferCommentsErrorData, isSetOfferCommentOptionsLoading,
} = storeToRefs(offerStore);
const usersStore = useUsersStore();
const { userLoggedIn } = storeToRefs(usersStore);

const model = reactive({
  offer_id: props.offerId,
} as FormModelOfferComment);

let validator = new PrecompiledValidator<FormModelOfferComment>(
  setOfferCommentsOptionsData.value,
  schemaOfferComment,
);
const validation = ref<unknown>();
const isValid = computed(() => isEmpty(validation.value || {}));
const isDisabledButton = computed(() => (!isValid.value));

const related = ref('');
const disclosureCheckbox = ref(false);

const relatedOptions = [
  {
    value: 'investor',
    text: 'Investor',
  },
  {
    value: 'adviser',
    text: 'Adviser',
  },
  {
    value: 'employee',
    text: 'Employee',
  },
];

const isAuth = computed(() => userLoggedIn.value);

const onValidate = () => {
  validation.value = validator.getFormValidationErrors(model);
};

const sendQuestion = async () => {
  onValidate();
  if (!isValid.value) {
    nextTick(() => scrollToError('OffersCommentsForm'));
    return;
  }

  const payload: IOfferCommentPayload = {
    comment: model.comment,
    offer_id: props.offerId,
  };
  if (related.value.length) payload.related = related.value;
  await offerStore.setOfferComment(payload);
  if (setOfferCommentsData.value?.id) {
    await offerStore.getOfferComments(props.offerId);
    model.comment = '';
  }
};

const query = computed(() => (
  (window && window?.location?.search) ? new URLSearchParams(window?.location?.search).get('redirect') : null));

const signInHandler = () => {
  navigateWithQueryParams(urlSignin, query.value);
};

watch(() => disclosureCheckbox.value, (value) => {
  if (!value) related.value = '';
});
watch(() => setOfferCommentsOptionsData.value, () => {
  validator = new PrecompiledValidator<FormModelOfferComment>(
    setOfferCommentsOptionsData.value,
    schemaOfferComment,
  );
});

watch(() => model, () => {
  if (!isValid.value) onValidate();
}, { deep: true });
</script>

<template>
  <div class="VFormComments v-form-comments">
    <VFormGroup
      v-slot="VFormGroupProps"
      :model="model"
      :validation="validation"
      :schema-back="setOfferCommentsOptionsData"
      :schema-front="schemaOfferComment"
      :error-text="setOfferCommentsErrorData?.comment"
      path="comment"
      label="Ask a Question"
      class="v-form-comments__comment-wrap"
    >
      <VFormInput
        :model-value="model.comment"
        :is-error="VFormGroupProps.isFieldError"
        placeholder="Ask a question"
        name="question"
        size="large"
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
          @click="signInHandler"
        >
          Sign in
        </VButton>
        <VButton
          v-else
          :loading="isSetOfferCommentLoading || isSetOfferCommentOptionsLoading"
          :disabled="isDisabledButton"
          size="large"
          @click="sendQuestion"
        >
          Post
        </VButton>
      </div>
      <div
        v-if="disclosureCheckbox"
        class="v-form-comments__related"
      >
        <VFormGroup
          v-slot="VFormGroupProps"
          :model="related"
          label="I am an:"
        >
          <VFormRadio
            v-model="related"
            row
            :is-error="VFormGroupProps.isFieldError"
            :options="relatedOptions"
            class="v-form-comments__radio"
          />
        </VFormGroup>
      </div>
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
