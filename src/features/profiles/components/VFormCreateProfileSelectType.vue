<script setup lang="ts">
import FormRow from 'UiKit/components/Base/VForm/VFormRow.vue';
import FormCol from 'UiKit/components/Base/VForm/VFormCol.vue';
import VFormSelect from 'UiKit/components/Base/VForm/VFormSelect.vue';
import VFormGroup from 'UiKit/components/Base/VForm/VFormGroup.vue';
import { useVFormProfileSelectType } from './logic/useVFormProfileSelectType';

const {
  errorData,
  SELECT_PROFILE_TYPES,
  model,
  validation,
  isValid,
  onValidate,
  isFieldRequired,
  getErrorText,
} = useVFormProfileSelectType();

defineExpose({
  model,
  validation,
  isValid,
  onValidate,
});
</script>

<template>
  <div class="VFormCreateProfileSelectType v-form-create-profile-select-type">
    <FormRow>
      <FormCol>
        <VFormGroup
          v-slot="VFormGroupProps"
          :required="isFieldRequired('type_profile')"
          :error-text="getErrorText('type_profile', errorData as any)"
          label="Choose which type of investment account you would like to create"
          data-testid="type-profile-group"
        >
          <VFormSelect
            v-model="model.type_profile"
            :is-error="VFormGroupProps.isFieldError"
            name="type_profile"
            size="large"
            placeholder="Please choose an option"
            data-testid="type-profile"
            item-label="text"
            item-value="value"
            :options="SELECT_PROFILE_TYPES"
            :loading="(SELECT_PROFILE_TYPES?.length === 0)"
          />
        </VFormGroup>
      </FormCol>
    </FormRow>
  </div>
</template>

<style lang="scss">
.v-form-create-profile-select-type {
  display: flex;
  flex-direction: column;
  width: 100%;

  &__subtitle {
    margin-bottom: 20px;
    margin-top: 12px;
  }
}
</style>
