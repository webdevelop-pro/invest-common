<script setup lang="ts">
import {
  watch, PropType, reactive, ref, computed,
} from 'vue';
import { useUserProfilesStore } from 'InvestCommon/store/useUserProfiles';
import FormRow from 'InvestCommon/components/VForm/VFormRow.vue';
import FormCol from 'InvestCommon/components/VForm/VFormCol.vue';
import VFormSelect from 'UiKit/components/VForm/VFormSelect.vue';
import { storeToRefs } from 'pinia';
import VFormGroup from 'UiKit/components/VForm/VFormGroup.vue';
import { SELECT_PROFILE_TYPES } from 'InvestCommon/utils';
import { JSONSchemaType } from 'ajv';
import { errorMessageRule, typeProfileRule } from 'UiKit/helpers/validation/rules';
import { FormModelCreateProfileSelectType } from 'InvestCommon/types/form';
import { PrecompiledValidator } from 'UiKit/helpers/validation/PrecompiledValidator';
import { filterSchema } from 'UiKit/helpers/validation/general';
import { isEmpty } from 'UiKit/helpers/general';

const schema = {
  $schema: 'http://json-schema.org/draft-07/schema#',
  definitions: {
    Individual: {
      properties: {
        type_profile: typeProfileRule,
      },
      type: 'object',
      errorMessage: errorMessageRule,
      required: ['type_profile'],
    },
  },
  $ref: '#/definitions/Individual',
} as unknown as JSONSchemaType<FormModelCreateProfileSelectType>;

const props = defineProps({
  modelData: Object as PropType<FormModelCreateProfileSelectType>,
});

const userIdentityStore = useUserProfilesStore();
const {
  setProfileByIdErrorData, getProfileByIdOptionsData,
} = storeToRefs(userIdentityStore);

const formModel = {
  type_profile: '',
};
const model = reactive({} as FormModelCreateProfileSelectType);
let validator = new PrecompiledValidator<FormModelCreateProfileSelectType>(
  // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
  filterSchema({ ...getProfileByIdOptionsData.value }, formModel),
  { ...schema },
);
const validation = ref<unknown>();
const isValid = computed(() => isEmpty(validation.value || {}));

const onValidate = () => {
  validation.value = validator.getFormValidationErrors(model);
};

watch(() => model, () => {
  if (!isValid.value) onValidate();
}, { deep: true });

watch(() => getProfileByIdOptionsData.value, () => {
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  validator = new PrecompiledValidator<FormModelCreateProfileSelectType>(
    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    filterSchema({ ...getProfileByIdOptionsData.value }, formModel),
    { ...schema },
  );
});


defineExpose({
  model, validation, isValid, onValidate,
});

watch(() => props.modelData?.type_profile, () => {
  if (props.modelData?.type_profile) model.type_profile = props.modelData?.type_profile;
}, { deep: true, immediate: true });
</script>

<template>
  <div class="VFormPartialCreateProfileSelectType v-form-partial-create-profile-selecxt-type">
    <FormRow>
      <FormCol>
        <VFormGroup
          v-slot="VFormGroupProps"
          :model="model"
          :validation="validation"
          :schema-back="getProfileByIdOptionsData"
          :schema-front="schema"
          :error-text="setProfileByIdErrorData?.type_profile"
          path="type_profile"
          label="Choose which type of investment account you would like to create"
          data-testid="type-profile-group"
        >
          <VFormSelect
            :model-value="model.type_profile"
            :is-error="VFormGroupProps.isFieldError"
            name="type_profile"
            size="large"
            placeholder="Please choose an option"
            data-testid="type-profile"
            item-label="text"
            item-value="value"
            :options="SELECT_PROFILE_TYPES"
            dropdown-absolute
            @update:model-value="model.type_profile = $event"
          />
        </VFormGroup>
      </FormCol>
    </FormRow>
  </div>
</template>

<style lang="scss">
.v-form-partial-create-profile-selecxt-type {
  display: flex;
  flex-direction: column;
  width: 100%;

  &__subtitle {
    margin-bottom: 20px;
    margin-top: 12px;
  }
}
</style>
