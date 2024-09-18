<script setup lang="ts">
import {
  ref, computed, watch, reactive, nextTick,
} from 'vue';
import {
  useAccreditationStore, useUserIdentitysStore, useUsersStore,
} from 'InvestCommon/store';
import { useHubspotForm } from 'InvestCommon/composable';
import FormRow from 'InvestCommon/components/common/FormRow.vue';
import FormCol from 'InvestCommon/components/common/FormCol.vue';
import BaseFormInput from 'UiKit/components/BaseFormInput/BaseFormInput.vue';
import BaseButton from 'UiKit/components/BaseButton/BaseButton.vue';
import BaseFormSelect from 'UiKit/components/BaseFormSelect/BaseFormSelect.vue';
import { storeToRefs } from 'pinia';
import { PrecompiledValidator } from 'UiKit/helpers/validation/PrecompiledValidator';
import { isEmpty } from 'InvestCommon/helpers/general';
import BaseFormGroup from 'UiKit/components/BaseFormGroup/BaseFormGroup.vue';
import { FormModelPersonalInformation, schemaPersonalInformation } from './utils';
import { SELECT_CITIZENSHIP_OPTIONS } from 'InvestCommon/utils';
import { useRouter } from 'vue-router';
import { ROUTE_ACCREDITATION_UPLOAD, ROUTE_DASHBOARD_ACCOUNT } from 'InvestCommon/helpers/enums/routes';
import { countries } from 'InvestCommon/global/countries.json';
import { USA_STATES_FULL } from 'InvestCommon/global/usaStates.json';
import { scrollToError } from 'UiKit/helpers/validation/general';

const props = defineProps({
  accreditation: Boolean,
  hubsportFormId: String,
});

const router = useRouter();
const userIdentityStore = useUserIdentitysStore();
const accreditationStore = useAccreditationStore();
const {
  isSetUserIdentityLoading, isSetUserIdentityError, setUserIdentityErrorData, setUserIdentityOptionsData,
} = storeToRefs(userIdentityStore);
const usersStore = useUsersStore();
const { selectedUserProfileData, selectedUserProfileId, userAccountData } = storeToRefs(usersStore);

const { submitFormToHubspot } = useHubspotForm(props.hubsportFormId);

const isLoading = ref(false);

const model = reactive({
} as FormModelPersonalInformation);

let validator = new PrecompiledValidator<FormModelPersonalInformation>(
  setUserIdentityOptionsData.value,
  schemaPersonalInformation,
);
const validation = ref<unknown>();
const isValid = computed(() => isEmpty(validation.value || {}));
const isDisabledButton = computed(() => (!isValid.value || isSetUserIdentityLoading.value));
const dataUserData = computed(() => selectedUserProfileData.value?.data);

const onValidate = () => {
  validation.value = validator.getFormValidationErrors(model);
};

const saveHandler = async () => {
  onValidate();
  if (!isValid.value) {
    void nextTick(() => scrollToError('FormPersonalInformation'));
    return;
  }

  isLoading.value = true;
  await userIdentityStore.setUserIdentity(model);

  if (!isSetUserIdentityError.value && selectedUserProfileData.value?.user_id && selectedUserProfileData.value?.id
    && !selectedUserProfileData.value?.escrow_id) {
    await accreditationStore.createEscrow(selectedUserProfileData.value?.user_id, selectedUserProfileData.value?.id);
  }
  isLoading.value = false;
  void submitFormToHubspot({
    email: userAccountData.value?.email,
    ...model,
    date_of_birth: model.dob,
  });
  void userIdentityStore.getUserIndividualProfile();
  if (props.accreditation) {
    void router.push({ name: ROUTE_ACCREDITATION_UPLOAD, params: { profileId: selectedUserProfileId.value } });
  } else {
    void router.push({ name: ROUTE_DASHBOARD_ACCOUNT, params: { profileId: selectedUserProfileId.value } });
  }
};

const cancelHandler = () => {
  void router.push({ name: ROUTE_DASHBOARD_ACCOUNT, params: { profileId: selectedUserProfileId.value } });
};

watch(() => selectedUserProfileData.value?.data, () => {
  if (dataUserData.value?.first_name) model.first_name = dataUserData.value?.first_name;
  if (dataUserData.value?.last_name) model.last_name = dataUserData.value?.last_name;
  if (dataUserData.value?.middle_name) model.middle_name = dataUserData.value?.middle_name;
  if (dataUserData.value?.dob) model.dob = dataUserData.value?.dob;
  if (dataUserData.value?.address1) model.address1 = dataUserData.value?.address1;
  if (dataUserData.value?.address2) model.address2 = dataUserData.value?.address2;
  if (dataUserData.value?.city) model.city = dataUserData.value?.city;
  if (dataUserData.value?.state) model.state = dataUserData.value?.state;
  if (dataUserData.value?.zip_code) model.zip_code = dataUserData.value?.zip_code;
  if (dataUserData.value?.country) model.country = dataUserData.value?.country;
  if (dataUserData.value?.phone) model.phone = dataUserData.value?.phone;
  if (dataUserData.value?.ssn) model.ssn = dataUserData.value?.ssn;
  if (dataUserData.value?.citizenship) model.citizenship = dataUserData.value?.citizenship;
}, { deep: true, immediate: true });

watch(() => model, () => {
  if (!isValid.value) onValidate();
}, { deep: true });


watch(() => selectedUserProfileData.value?.data?.citizenship, () => {
  if (selectedUserProfileData.value?.data?.citizenship) {
    model.citizenship = selectedUserProfileData.value?.data?.citizenship;
  }
}, { deep: true, immediate: true });

// eslint-disable-next-line
watch(() => setUserIdentityOptionsData.value, () => {
  validator = new PrecompiledValidator<FormModelPersonalInformation>(
    setUserIdentityOptionsData.value,
    schemaPersonalInformation,
  );
});
</script>

<template>
  <div class="FormPersonalInformation form-personal-information">
    <div class="form-personal-information__header is--h1__title">
      Personal Information
    </div>
    <div class="form-personal-information__content">
      <FormRow>
        <FormCol col3>
          <BaseFormGroup
            v-slot="baseFormGroupProps"
            :model="model"
            :validation="validation"
            :schema-back="setUserIdentityOptionsData"
            :schema-front="schemaPersonalInformation"
            :error-text="setUserIdentityErrorData?.first_name"
            path="first_name"
            label="First Name"
            data-testid="first-name-group"
          >
            <BaseFormInput
              :model-value="model.first_name"
              :is-error="baseFormGroupProps.isFieldError"
              placeholder="First Name"
              name="first-name"
              size="large"
              data-testid="first-name"
              @update:model-value="model.first_name = $event"
            />
          </BaseFormGroup>
        </FormCol>

        <FormCol col3>
          <BaseFormGroup
            v-slot="baseFormGroupProps"
            :model="model"
            :validation="validation"
            :schema-back="setUserIdentityOptionsData"
            :schema-front="schemaPersonalInformation"
            :error-text="setUserIdentityErrorData?.middle_name"
            path="middle_name"
            label="Middle Name"
            data-testid="middle-name-group"
          >
            <BaseFormInput
              :model-value="model.middle_name"
              :is-error="baseFormGroupProps.isFieldError"
              placeholder="Middle Name"
              name="middle-name"
              size="large"
              data-testid="middle-name"
              @update:model-value="model.middle_name = $event"
            />
          </BaseFormGroup>
        </FormCol>

        <FormCol col3>
          <BaseFormGroup
            v-slot="baseFormGroupProps"
            :model="model"
            :validation="validation"
            :schema-back="setUserIdentityOptionsData"
            :schema-front="schemaPersonalInformation"
            :error-text="setUserIdentityErrorData?.last_name"
            path="last_name"
            label="Last Name"
            data-testid="last-name-group"
          >
            <BaseFormInput
              :model-value="model.last_name"
              :is-error="baseFormGroupProps.isFieldError"
              placeholder="Last Name"
              name="last-name"
              size="large"
              data-testid="last-name"
              @update:model-value="model.last_name = $event"
            />
          </BaseFormGroup>
        </FormCol>
      </FormRow>
      <FormRow>
        <FormCol col-2>
          <BaseFormGroup
            v-slot="baseFormGroupProps"
            :model="model"
            :validation="validation"
            :schema-back="setUserIdentityOptionsData"
            :schema-front="schemaPersonalInformation"
            :error-text="setUserIdentityErrorData?.dob"
            path="dob"
            label="Date of Birth"
            data-testid="dob-group"
          >
            <BaseFormInput
              :model-value="model.dob"
              :is-error="baseFormGroupProps.isFieldError"
              placeholder="MM/DD/YYYY"
              name="date-of-birth"
              size="large"
              data-testid="date-of-birth"
              type="date"
              @update:model-value="model.dob = $event"
            />
          </BaseFormGroup>
        </FormCol>

        <FormCol col-2>
          <BaseFormGroup
            v-slot="baseFormGroupProps"
            :model="model"
            :validation="validation"
            :schema-back="setUserIdentityOptionsData"
            :schema-front="schemaPersonalInformation"
            :error-text="setUserIdentityErrorData?.phone"
            path="phone"
            label="Phone number"
            data-testid="phone-group"
          >
            <BaseFormInput
              :model-value="model.phone"
              :is-error="baseFormGroupProps.isFieldError"
              placeholder="+1 (___) ___ - ____"
              mask="+#(###)###-####"
              disallow-special-chars
              name="phone"
              size="large"
              data-testid="phone"
              @update:model-value="model.phone = $event"
            />
          </BaseFormGroup>
        </FormCol>
      </FormRow>
      <FormRow>
        <FormCol col2>
          <BaseFormGroup
            v-slot="baseFormGroupProps"
            :model="model"
            :validation="validation"
            :schema-back="setUserIdentityOptionsData"
            :schema-front="schemaPersonalInformation"
            :error-text="setUserIdentityErrorData?.citizenship"
            path="citizenship"
            label="Citizenship"
            data-testid="citizenship-group"
          >
            <BaseFormSelect
              :model-value="model.citizenship"
              :is-error="baseFormGroupProps.isFieldError"
              name="citizenship"
              size="large"
              placeholder="Please choose an option"
              data-testid="citizenship"
              item-label="text"
              item-value="value"
              :options="SELECT_CITIZENSHIP_OPTIONS"
              dropdown-absolute
              @update:model-value="model.citizenship = $event"
            />
          </BaseFormGroup>
        </FormCol>
        <FormCol col2>
          <BaseFormGroup
            v-slot="baseFormGroupProps"
            :model="model"
            :validation="validation"
            :schema-back="setUserIdentityOptionsData"
            :schema-front="schemaPersonalInformation"
            :error-text="setUserIdentityErrorData?.ssn"
            path="ssn"
            label="SSN"
            data-testid="ssn-group"
          >
            <BaseFormInput
              :model-value="model.ssn"
              :is-error="baseFormGroupProps.isFieldError"
              placeholder="XXX-XXX-XXXX"
              name="ssn"
              size="large"
              data-testid="ssn"
              mask="###-##-####"
              disallow-special-chars
              @update:model-value="model.ssn = $event"
            />
          </BaseFormGroup>
        </FormCol>
      </FormRow>
      <div class="form-personal-information__subtitle is--h3__title">
        Residence Address
      </div>
      <FormRow>
        <FormCol col2>
          <BaseFormGroup
            v-slot="baseFormGroupProps"
            :model="model"
            :validation="validation"
            :schema-back="setUserIdentityOptionsData"
            :schema-front="schemaPersonalInformation"
            :error-text="setUserIdentityErrorData?.address1"
            path="address1"
            label="Address 1"
            data-testid="address-1-group"
          >
            <BaseFormInput
              :model-value="model.address1"
              :is-error="baseFormGroupProps.isFieldError"
              placeholder="Address 1"
              name="address-1"
              size="large"
              data-testid="address-1"
              @update:model-value="model.address1 = $event"
            />
          </BaseFormGroup>
        </FormCol>

        <FormCol col2>
          <BaseFormGroup
            v-slot="baseFormGroupProps"
            :model="model"
            :validation="validation"
            :schema-back="setUserIdentityOptionsData"
            :schema-front="schemaPersonalInformation"
            :error-text="setUserIdentityErrorData?.address2"
            path="address2"
            label="Address 2"
            data-testid="address-2-group"
          >
            <BaseFormInput
              :model-value="model.address2"
              :is-error="baseFormGroupProps.isFieldError"
              placeholder="Address 2"
              name="address-2"
              size="large"
              data-testid="address-2"
              @update:model-value="model.address2 = $event"
            />
          </BaseFormGroup>
        </FormCol>
      </FormRow>

      <FormRow>
        <FormCol col2>
          <BaseFormGroup
            v-slot="baseFormGroupProps"
            :model="model"
            :validation="validation"
            :schema-back="setUserIdentityOptionsData"
            :schema-front="schemaPersonalInformation"
            :error-text="setUserIdentityErrorData?.city"
            path="city"
            label="City"
            data-testid="city-group"
          >
            <BaseFormInput
              :model-value="model.city"
              :is-error="baseFormGroupProps.isFieldError"
              name="city"
              size="large"
              placeholder="City"
              data-testid="city"
              disallow-special-chars
              disallow-numbers
              @update:model-value="model.city = $event"
            />
          </BaseFormGroup>
        </FormCol>
        <FormCol col2>
          <BaseFormGroup
            v-slot="baseFormGroupProps"
            :model="model"
            :validation="validation"
            :schema-back="setUserIdentityOptionsData"
            :schema-front="schemaPersonalInformation"
            :error-text="setUserIdentityErrorData?.state"
            path="state"
            label="State"
            data-testid="state-group"
          >
            <BaseFormSelect
              :model-value="model.state"
              :is-error="baseFormGroupProps.isFieldError"
              name="state"
              size="large"
              placeholder="State"
              item-label="text"
              item-value="value"
              searchable
              :options="USA_STATES_FULL"
              dropdown-absolute
              data-testid="state"
              @update:model-value="model.state = $event"
            />
          </BaseFormGroup>
        </FormCol>
      </FormRow>

      <FormRow>
        <FormCol col2>
          <BaseFormGroup
            v-slot="baseFormGroupProps"
            :model="model"
            :validation="validation"
            :schema-back="setUserIdentityOptionsData"
            :schema-front="schemaPersonalInformation"
            :error-text="setUserIdentityErrorData?.zip_code"
            path="zip_code"
            label="Zip Code"
            data-testid="zip-group"
          >
            <BaseFormInput
              :model-value="model.zip_code"
              :is-error="baseFormGroupProps.isFieldError"
              name="zip"
              size="large"
              data-testid="zip"
              placeholder="Zip Code"
              mask="#####-####"
              return-masked-value
              disallow-special-chars
              @update:model-value="model.zip_code = $event"
            />
          </BaseFormGroup>
        </FormCol>

        <FormCol col2>
          <BaseFormGroup
            v-slot="baseFormGroupProps"
            :model="model"
            :validation="validation"
            :schema-back="setUserIdentityOptionsData"
            :schema-front="schemaPersonalInformation"
            :error-text="setUserIdentityErrorData?.country"
            path="country"
            label="Country"
            data-testid="country-group"
          >
            <BaseFormSelect
              :model-value="model.country"
              :is-error="baseFormGroupProps.isFieldError"
              name="country"
              size="large"
              placeholder="Country"
              item-label="name"
              item-value="code"
              searchable
              :options="countries"
              dropdown-absolute
              data-testid="country"
              @update:model-value="model.country = $event"
            />
          </BaseFormGroup>
        </FormCol>
      </FormRow>
    </div>
    <div class="form-personal-information__footer">
      <BaseButton
        size="large"
        variant="outlined"
        @click="cancelHandler"
      >
        Cancel
      </BaseButton>
      <BaseButton
        size="large"
        :disabled="isDisabledButton"
        :loading="isLoading"
        data-testid="button"
        @click="saveHandler"
      >
        Save
      </BaseButton>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.form-personal-information {
  display: flex;
  flex-direction: column;
  width: 100%;

  &__header {
    margin-bottom: 40px;
  }

  &__subtitle {
    margin-bottom: 20px;
    margin-top: 12px;
  }

  &__footer {
    display: flex;
    justify-content: flex-end;
    align-items: flex-start;
    gap: 12px;
    margin-top: 20px;
  }
}
</style>
