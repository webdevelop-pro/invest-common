<script setup lang="ts">
import {
  ref, watch, computed, reactive, nextTick,
} from 'vue';
import { schemaContactUs, FormModelContactUs, SELECT_SUBJECT } from './utilsContactUs';
import { PrecompiledValidator } from 'UiKit/helpers/validation/PrecompiledValidator';
import { isEmpty } from 'InvestCommon/helpers/general';
import VFormGroup from 'UiKit/components/VForm/VFormGroup.vue';
import VFormInput from 'UiKit/components/VForm/VFormInput.vue';
import VButton from 'UiKit/components/VButton/VButton.vue';
import VFormTextarea from 'UiKit/components/VForm/VFormTextarea.vue';
import VFormSelect from 'UiKit/components/VForm/VFormSelect.vue';
import { useUsersStore } from 'InvestCommon/store';
import { useHubspotForm } from 'InvestCommon/composable/useHubspotForm';
import { storeToRefs } from 'pinia';
import env from 'InvestCommon/global';
import { notify } from '@kyvg/vue3-notification';
import { scrollToError } from 'UiKit/helpers/validation/general';

const NOTIFY_OPTIONS = {
  text: 'Sent',
  type: 'success',
  data: {
    status: 1,
  },
  group: 'transaction',
  duration: 10000,
};

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

  notify(NOTIFY_OPTIONS);
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
        dropdown-absolute
        :options="SELECT_SUBJECT"
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
