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
  schemaBackend,
  schema,
  isDialogContactUsOpen,
  VDialogContactUs,
  setUserState,
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
          :model="model"
          :validation="validation"
          :schema-back="schemaBackend"
          :schema-front="schema"
          :error-text="errorData?.first_name"
          path="first_name"
          label="First Name"
          data-testid="first-name-group"
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
          :model="model"
          :validation="validation"
          :schema-back="schemaBackend"
          :schema-front="schema"
          :error-text="errorData?.last_name"
          path="last_name"
          label="Last Name"
          data-testid="last-name-group"
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
          :model="model"
          :validation="validation"
          :schema-back="schemaBackend"
          :schema-front="schema"
          :error-text="errorData?.email"
          path="email"
          label="Email"
          data-testid="email-group"
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
            @click.prevent="isDialogContactUsOpen = true"
            @keydown.enter.prevent="isDialogContactUsOpen = true"
            @keydown.space.prevent="isDialogContactUsOpen = true"
          >
            contact us
          </a>
        </div>
      </FormCol>

      <FormCol col-2>
        <VFormGroup
          v-slot="VFormGroupProps"
          :model="model"
          :validation="validation"
          :schema-back="schemaBackend"
          :schema-front="schema"
          :error-text="errorData?.phone"
          path="phone"
          label="Phone number"
          data-testid="phone-group"
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
    <VDialogContactUs
      v-model="isDialogContactUsOpen"
      subject="other"
    />
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
