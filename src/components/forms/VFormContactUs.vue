<script setup lang="ts">
import {
  ref, watch, computed, reactive, nextTick,
} from 'vue';
import { PrecompiledValidator } from 'UiKit/helpers/validation/PrecompiledValidator';
import { isEmpty } from 'InvestCommon/helpers/general';
import VFormGroup from 'UiKit/components/Base/VForm/VFormGroup.vue';
import VFormInput from 'UiKit/components/Base/VForm/VFormInput.vue';
import VButton from 'UiKit/components/Base/VButton/VButton.vue';
import VFormTextarea from 'UiKit/components/Base/VForm/VFormTextarea.vue';
import VFormSelect from 'UiKit/components/Base/VForm/VFormSelect.vue';
import { useUsersStore } from 'InvestCommon/store/useUsers';
import { useHubspotForm } from 'InvestCommon/composable/useHubspotForm';
import { storeToRefs } from 'pinia';
import env from 'InvestCommon/global';
import { scrollToError } from 'UiKit/helpers/validation/general';
import { emailRule, errorMessageRule, firstNameRule } from 'UiKit/helpers/validation/rules';
import { JSONSchemaType } from 'ajv/dist/types/json-schema';
import { useToast } from 'UiKit/components/Base/VToast/use-toast';

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

// eslint-disable-next-line @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-member-access
const { submitFormToHubspot } = useHubspotForm(env.HUBSPOT_FORM_ID_CONTACT_US);
const usersStore = useUsersStore();
const { selectedUserProfileData, userAccountData } = storeToRefs(usersStore);

let model = reactive({
} as FormModelContactUs);

const validator = new PrecompiledValidator<FormModelContactUs>(
  schemaContactUs,
);
const validation = ref<unknown>();
const isValid = computed(() => isEmpty(validation.value || {}));
const isDisabledButton = computed(() => (!isValid.value));

const onValidate = () => {
  validation.value = validator.getFormValidationErrors(model);
};

watch(() => model, () => {
  if (!isValid.value) onValidate();
}, { deep: true });

watch(() => [selectedUserProfileData.value?.data.first_name, selectedUserProfileData.value?.data?.last_name], () => {
  if (selectedUserProfileData.value?.data?.first_name || selectedUserProfileData.value?.data?.last_name) {
    model.name = `${selectedUserProfileData.value?.data?.first_name} ${selectedUserProfileData.value?.data?.last_name}`;
  }
}, { deep: true, immediate: true });


watch(() => userAccountData.value?.email, () => {
  if (userAccountData.value?.email) {
    model.email = userAccountData.value?.email || '';
  }
}, { deep: true, immediate: true });

const signUpHandler = async () => {
  onValidate();
  if (!isValid.value) {
    void nextTick(() => scrollToError('ContactUsForm'));
    return;
  }

  // action

  await submitFormToHubspot({
    ...model,
    first_name: model.name,
    email: model.email,
    message: model.message,
  });

  toast(TOAST_OPTIONS);
  model = reactive({} as FormModelContactUs);
};
</script>

<template>
  <form
    class="VFormContactUs contact-us-form"
    novalidate
    @submit.prevent="signUpHandler"
  >
    <VFormGroup
      v-slot="VFormGroupProps"
      :model="model"
      :validation="validation"
      :schema-front="schemaContactUs"
      path="name"
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
      :model="model"
      :validation="validation"
      :schema-front="schemaContactUs"
      path="email"
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
      :model="model"
      :validation="validation"
      :schema-front="schemaContactUs"
      path="subject"
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
      :model="model"
      :validation="validation"
      :schema-front="schemaContactUs"
      path="message"
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
    <VButton
      size="large"
      block
      data-testid="button"
      :disabled="isDisabledButton"
      class="contact-us-form__btn"
    >
      Submit
    </VButton>

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
  padding: 40px;
  background: $white;
  box-shadow: $box-shadow-medium;

  &__btn {
    margin-top: 40px;
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
}
</style>
