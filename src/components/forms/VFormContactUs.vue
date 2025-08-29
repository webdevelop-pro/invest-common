<script setup lang="ts">
import {
  watch, computed, nextTick,
} from 'vue';
import { useFormValidation } from 'UiKit/helpers/validation/useFormValidation';
import VFormGroup from 'UiKit/components/Base/VForm/VFormGroup.vue';
import VFormInput from 'UiKit/components/Base/VForm/VFormInput.vue';
import VButton from 'UiKit/components/Base/VButton/VButton.vue';
import VFormTextarea from 'UiKit/components/Base/VForm/VFormTextarea.vue';
import VFormSelect from 'UiKit/components/Base/VForm/VFormSelect.vue';
import { useSessionStore } from 'InvestCommon/domain/session/store/useSession';
import { useHubspotForm } from 'InvestCommon/composable/useHubspotForm';
import { storeToRefs } from 'pinia';
import env from 'InvestCommon/global';
import { emailRule, errorMessageRule, firstNameRule } from 'UiKit/helpers/validation/rules';
import { JSONSchemaType } from 'ajv/dist/types/json-schema';
import { useToast } from 'UiKit/components/Base/VToast/use-toast';

const props = defineProps({
  isInDialog: {
    type: Boolean,
    default: false,
  },
  subject: String,
});

const emit = defineEmits(['close']);

const { toast } = useToast();

const TOAST_OPTIONS = {
  title: 'Sent',
  description: 'Form sent success',
  variant: 'success',
};

type FormModelContactUs = {
  name: string;
  email: string;
  subject: string;
  message: string;
}

const schemaContactUs = {
  $schema: 'http://json-schema.org/draft-07/schema#',
  definitions: {
    ContactUs: {
      properties: {
        name: firstNameRule,
        email: emailRule,
        message: {
          minLength: 10,
          type: 'string',
        },
      },
      type: 'object',
      required: ['name', 'subject', 'email', 'message'],
      errorMessage: errorMessageRule,
    },
  },
  $ref: '#/definitions/ContactUs',
} as unknown as JSONSchemaType<FormModelContactUs>;

const SELECT_SUBJECT = [
  {
    value: 'investment',
    label: 'Investment',
  },
  {
    value: 'report an issue',
    label: 'Report an issue',
  },
  {
    value: 'i have a question',
    label: 'I have a question',
  },
  {
    value: 'other',
    label: 'Other',
  },
];

const { submitFormToHubspot } = useHubspotForm(env.HUBSPOT_FORM_ID_CONTACT_US);
const userSessionStore = useSessionStore();
const { userSessionTraits } = storeToRefs(userSessionStore);

const fieldsPaths = ['name', 'email', 'subject', 'message'];
const {
  model,
  isValid,
  onValidate,
  isFieldRequired,
  getErrorText,
  scrollToError,
} = useFormValidation<FormModelContactUs>(
  schemaContactUs,
  undefined,
  {} as FormModelContactUs,
  fieldsPaths
);

const isDisabledButton = computed(() => (!isValid.value));

watch(() => [userSessionTraits.value?.first_name, userSessionTraits.value?.last_name], () => {
  if (userSessionTraits.value?.first_name || userSessionTraits.value?.last_name) {
    model.name = `${userSessionTraits.value?.first_name} ${userSessionTraits.value?.last_name}`;
  }
}, { deep: true, immediate: true });

watch(() => userSessionTraits.value?.email, () => {
  if (userSessionTraits.value?.email) {
    model.email = userSessionTraits.value?.email || '';
  }
}, { deep: true, immediate: true });

watch(() => props.subject, () => {
  if (props.subject) {
    model.subject = props.subject;
  }
}, { immediate: true });

const onSubmit = async () => {
  onValidate();
  if (!isValid.value) {
    nextTick(() => scrollToError('VFormContactUs'));
    return;
  }

  await submitFormToHubspot({
    ...model,
    first_name: model.name,
    email: model.email,
    message: model.message,
  });

  toast(TOAST_OPTIONS);
  Object.assign(model, {} as FormModelContactUs);
  emit('close');
};
</script>

<template>
  <form
    class="VFormContactUs contact-us-form"
    :class="{ 'is--in-dialog': isInDialog }"
    novalidate
    @submit.prevent="onSubmit"
  >
    <VFormGroup
      v-slot="VFormGroupProps"
      :required="isFieldRequired('name')"
      :error-text="getErrorText('name')"
      label="Your Name"
      class="contact-us-form__input"
    >
      <VFormInput
        :model-value="model.name"
        :is-error="VFormGroupProps.isFieldError"
        placeholder="Your Name"
        name="name"
        size="large"
        data-testid="name"
        type="text"
        @update:model-value="model.name = $event"
      />
    </VFormGroup>

    <VFormGroup
      v-slot="VFormGroupProps"
      :required="isFieldRequired('email')"
      :error-text="getErrorText('email')"
      label="Email Address"
      class="contact-us-form__input"
    >
      <VFormInput
        :model-value="model.email"
        :is-error="VFormGroupProps.isFieldError"
        placeholder="Email Address"
        name="email"
        data-testid="email"
        size="large"
        type="text"
        @update:model-value="model.email = $event"
      />
    </VFormGroup>

    <VFormGroup
      v-slot="VFormGroupProps"
      :required="isFieldRequired('subject')"
      :error-text="getErrorText('subject')"
      label="Subject"
      class="contact-us-form__input"
    >
      <VFormSelect
        v-model="model.subject"
        item-label="label"
        item-value="value"
        placeholder="Select"
        :is-error="VFormGroupProps.isFieldError"
        name="subject"
        data-testid="subject"
        size="large"
        :options="SELECT_SUBJECT"
        :loading="(SELECT_SUBJECT.length === 0)"
      />
    </VFormGroup>

    <VFormGroup
      v-slot="VFormGroupProps"
      class="contact-us-form__input"
      :required="isFieldRequired('message')"
      :error-text="getErrorText('message')"
      label="Message"
    >
      <VFormTextarea
        :model-value="model.message"
        rows="3"
        placeholder="Enter your message"
        :is-error="VFormGroupProps.isFieldError"
        @update:model-value="model.message = $event"
      />
    </VFormGroup>
    <div class="contact-us-form__buttons is--margin-top-40">
      <VButton
        v-if="isInDialog"
        size="large"
        variant="outlined"
        @click="emit('close')"
      >
        Cancel
      </VButton>
      <VButton
        size="large"
        :block="!isInDialog"
        data-testid="button"
        :disabled="isDisabledButton"
      >
        Submit
      </VButton>
    </div>

    <div class="contact-us-form__info">
      <div>
        manager@webdevelop.pro
      </div>
      <div>
        +1 609 733 7724
      </div>
    </div>
  </form>
</template>

<style lang="scss">
.contact-us-form {

  &:not(.is--in-dialog) {
    padding: 40px;
    background: $white;
    box-shadow: $box-shadow-medium;
  }

  &__info {
    margin-top: 40px;
    color: $black;
    text-align: center;
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  &__input {
    & + & {
      margin-top: 20px;
    }
  }

  &__buttons {
    display: flex;
    justify-content: space-between;
    gap: 20px;

    @include media-lt(tablet) {
      flex-direction: column-reverse;
      align-items: stretch;
      justify-content: flex-start;
    }

    .v-button {
      flex-grow: 1;
    }
  }
}
</style>
