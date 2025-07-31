<script setup lang="ts">
import {
  watch, PropType, computed, reactive,
  ref,
  defineAsyncComponent,
} from 'vue';
import { useUserProfilesStore } from 'InvestCommon/store/useUserProfiles';
import FormRow from 'UiKit/components/Base/VForm/VFormRow.vue';
import FormCol from 'UiKit/components/Base/VForm/VFormCol.vue';
import VFormInput from 'UiKit/components/Base/VForm/VFormInput.vue';
import { storeToRefs } from 'pinia';
import VFormGroup from 'UiKit/components/Base/VForm/VFormGroup.vue';
import { JSONSchemaType } from 'ajv/dist/types/json-schema';
import {
  emailRule, errorMessageRule, firstNameRule, lastNameRule,
  middleNameRule, phoneRule,
} from 'UiKit/helpers/validation/rules';
import { filterSchema } from 'UiKit/helpers/validation/general';
import { createFormModel } from 'UiKit/helpers/model';
import { PrecompiledValidator } from 'UiKit/helpers/validation/PrecompiledValidator';
import { isEmpty } from 'UiKit/helpers/general';

interface FormModelAccount {
  first_name: string;
  last_name: string;
  middle_name?: string;
  email: string;
  phone?: string;
}

const props = defineProps({
  modelData: Object as PropType<FormModelAccount>,
  readOnly: Boolean,
});

const userProfilesStore = useUserProfilesStore();
const {
  setUserErrorData, setUserOptionsData, isSetUserLoading,
} = storeToRefs(userProfilesStore);
const isDialogContactUsOpen = ref(false);

const VDialogContactUs = defineAsyncComponent({
  loader: () => import('InvestCommon/components/dialogs/VDialogContactUs.vue'),
});

const schema = {
  $schema: 'http://json-schema.org/draft-07/schema#',
  definitions: {
    Individual: {
      properties: {
        first_name: firstNameRule,
        last_name: lastNameRule,
        middle_name: middleNameRule,
        email: emailRule,
        phone: phoneRule,
      },
      type: 'object',
      errorMessage: errorMessageRule,
      required: ['first_name', 'last_name', 'email'],
    },
  },
  $ref: '#/definitions/Individual',
} as unknown as JSONSchemaType<FormModelAccount>;

const model = reactive<FormModelAccount>({});
const formModel = createFormModel(schema);
let validator = new PrecompiledValidator<FormModelAccount>(
  filterSchema(setUserOptionsData.value, formModel),
  schema,
);
const validation = ref<unknown>();
const isValid = computed(() => isEmpty(validation.value || {}));

const onValidate = () => {
  validation.value = validator.getFormValidationErrors(model);
};

defineExpose({
  model, validation, validator, isValid, onValidate,
});

watch(() => props.modelData, () => {
  if (props.modelData?.first_name) model.first_name = props.modelData?.first_name;
  if (props.modelData?.last_name) model.last_name = props.modelData?.last_name;
  if (props.modelData?.middle_name) model.middle_name = props.modelData?.middle_name;
  if (props.modelData?.email) model.email = props.modelData?.email;
  if (props.modelData?.phone) model.phone = props.modelData?.phone;
}, { deep: true, immediate: true });

watch(() => model, () => {
  if (!isValid.value) onValidate();
}, { deep: true });

watch(() => [setUserOptionsData.value, schema], () => {
  validator = new PrecompiledValidator<FormModelAccount>(
    filterSchema(setUserOptionsData.value, formModel),
    schema,
  );
});
</script>

<template>
  <div class="VFormPartialAccount v-form-partial-account">
    <h2 class="is--h3__title v-form-partial-account__subtitle">
      Personal Information
    </h2>
    <FormRow>
      <FormCol col3>
        <VFormGroup
          v-slot="VFormGroupProps"
          :model="model"
          :validation="validation"
          :schema-back="setUserOptionsData"
          :schema-front="schema"
          :error-text="setUserErrorData?.first_name"
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
            :loading="isSetUserLoading"
            @update:model-value="model.first_name = $event"
          />
        </VFormGroup>
      </FormCol>

      <FormCol col3>
        <VFormGroup
          v-slot="VFormGroupProps"
          :model="model"
          :validation="validation"
          :schema-back="setUserOptionsData"
          :schema-front="schema"
          :error-text="setUserErrorData?.middle_name"
          path="middle_name"
          label="Middle Name"
          data-testid="middle-name-group"
        >
          <VFormInput
            :model-value="model.middle_name"
            :is-error="VFormGroupProps.isFieldError"
            placeholder="Middle Name"
            name="middle-name"
            size="large"
            data-testid="middle-name"
            :readonly="readOnly"
            :loading="isSetUserLoading"
            @update:model-value="model.middle_name = $event"
          />
        </VFormGroup>
      </FormCol>

      <FormCol col3>
        <VFormGroup
          v-slot="VFormGroupProps"
          :model="model"
          :validation="validation"
          :schema-back="setUserOptionsData"
          :schema-front="schema"
          :error-text="setUserErrorData?.last_name"
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
            :loading="isSetUserLoading"
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
          :schema-back="setUserOptionsData"
          :schema-front="schema"
          :error-text="setUserErrorData?.email"
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
            :loading="isSetUserLoading"
            @update:model-value="model.email = $event"
          />
        </VFormGroup>
        <div class="is--small is--gray-70 is--margin-top-4">
          If you need to change your email
          <a
            class="is--link-2"
            @click.prevent="isDialogContactUsOpen = true"
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
          :schema-back="setUserOptionsData"
          :schema-front="schema"
          :error-text="setUserErrorData?.phone"
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
            :loading="isSetUserLoading"
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
