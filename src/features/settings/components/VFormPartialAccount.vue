<script setup lang="ts">
import { PropType } from 'vue';
import FormRow from 'UiKit/components/Base/VForm/VFormRow.vue';
import FormCol from 'UiKit/components/Base/VForm/VFormCol.vue';
import VFormInput from 'UiKit/components/Base/VForm/VFormInput.vue';
import VFormGroup from 'UiKit/components/Base/VForm/VFormGroup.vue';
import { useAccountForm, FormModelAccount } from './logic/useAccountForm';

const props = defineProps({
  modelData: Object as PropType<FormModelAccount>,
  readOnly: Boolean,
});

const {
  model,
  validation,
  isValid,
  onValidate,
  validator,
  errorData,
  setUserState,
  isFieldRequired,
  getErrorText,
  openAccountContactDialog,
} = useAccountForm(props);

defineExpose({
  model, validation, validator, isValid, onValidate,
});
</script>

<template>
  <div class="VFormPartialAccount v-form-partial-account">
    <h2 class="is--h3__title v-form-partial-account__subtitle">
      Personal Information
    </h2>
    <FormRow>
      <FormCol col2>
        <VFormGroup
          v-slot="VFormGroupProps"
          :required="isFieldRequired('first_name')"
          :error-text="getErrorText('first_name', errorData)"
          data-testid="first-name-group"
          label="First Name"
        >
          <VFormInput
            :model-value="model.first_name"
            :is-error="VFormGroupProps.isFieldError"
            placeholder="First Name"
            name="first-name"
            size="large"
            data-testid="first-name"
            :readonly="readOnly"
            :loading="setUserState.loading"
            @update:model-value="model.first_name = $event"
          />
        </VFormGroup>
      </FormCol>

      <FormCol col2>
        <VFormGroup
          v-slot="VFormGroupProps"
          :required="isFieldRequired('last_name')"
          :error-text="getErrorText('last_name', errorData)"
          data-testid="last-name-group"
          label="Last Name"
        >
          <VFormInput
            :model-value="model.last_name"
            :is-error="VFormGroupProps.isFieldError"
            placeholder="Last Name"
            name="last-name"
            size="large"
            data-testid="last-name"
            :readonly="readOnly"
            :loading="setUserState.loading"
            @update:model-value="model.last_name = $event"
          />
        </VFormGroup>
      </FormCol>
    </FormRow>
    <FormRow>
      <FormCol col-2>
        <VFormGroup
          v-slot="VFormGroupProps"
          :required="isFieldRequired('email')"
          :error-text="getErrorText('email', errorData)"
          data-testid="email-group"
          label="Email"
        >
          <VFormInput
            :model-value="model.email"
            :is-error="VFormGroupProps.isFieldError"
            name="email"
            size="large"
            readonly
            :loading="setUserState.loading"
            @update:model-value="model.email = $event"
          />
        </VFormGroup>
        <div class="is--small is--gray-70 is--margin-top-4">
          If you need to change your email
          <a
            class="is--link-2"
            role="button"
            tabindex="0"
            @click.prevent="openAccountContactDialog"
            @keydown.enter.prevent="openAccountContactDialog"
            @keydown.space.prevent="openAccountContactDialog"
          >
            contact us
          </a>
        </div>
      </FormCol>

      <FormCol col-2>
        <VFormGroup
          v-slot="VFormGroupProps"
          :required="isFieldRequired('phone')"
          :error-text="getErrorText('phone', errorData)"
          data-testid="phone-group"
          label="Phone number"
        >
          <VFormInput
            :model-value="model.phone"
            :is-error="VFormGroupProps.isFieldError"
            placeholder="+1 (___) ___ - ____"
            mask="+#(###)###-####"
            disallow-special-chars
            name="phone"
            size="large"
            data-testid="phone"
            :readonly="readOnly"
            :loading="setUserState.loading"
            @update:model-value="model.phone = $event"
          />
        </VFormGroup>
      </FormCol>
    </FormRow>
  </div>
</template>

<style lang="scss">
.v-form-partial-account {
  display: flex;
  flex-direction: column;
  width: 100%;

  &__subtitle {
    margin-bottom: 20px;
  }
}
</style>
