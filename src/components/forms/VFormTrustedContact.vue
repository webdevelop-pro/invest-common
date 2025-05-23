<script setup lang="ts">
import {
  ref, computed, watch, reactive, nextTick,
} from 'vue';
import { useUserProfilesStore } from 'InvestCommon/store/useUserProfiles';
import { useUsersStore } from 'InvestCommon/store/useUsers';
import { useHubspotForm } from 'InvestCommon/composable/useHubspotForm';
import FormRow from 'UiKit/components/Base/VForm/VFormRow.vue';
import FormCol from 'UiKit/components/Base/VForm/VFormCol.vue';
import VFormInput from 'UiKit/components/Base/VForm/VFormInput.vue';
import VButton from 'UiKit/components/Base/VButton/VButton.vue';
import { storeToRefs } from 'pinia';
import { PrecompiledValidator } from 'UiKit/helpers/validation/PrecompiledValidator';
import { isEmpty } from 'InvestCommon/helpers/general';
import VFormGroup from 'UiKit/components/Base/VForm/VFormGroup.vue';
import { filterSchema, scrollToError } from 'UiKit/helpers/validation/general';
import { useRouter } from 'vue-router';
import { ROUTE_DASHBOARD_ACCOUNT } from 'InvestCommon/helpers/enums/routes';
import { JSONSchemaType } from 'ajv/dist/types/json-schema';
import {
  firstNameRule, lastNameRule, relationshipTypeRule, phoneRule, emailRule, dobRule, errorMessageRule,
} from 'UiKit/helpers/validation/rules';
import { FormModeTrustedContact } from 'InvestCommon/types/form';
import env from 'InvestCommon/global';

const router = useRouter();
const userProfilesStore = useUserProfilesStore();
const {
  isSetProfileByIdLoading, setProfileByIdErrorData, getProfileByIdOptionsData, isGetProfileByIdLoading,
} = storeToRefs(userProfilesStore);
const usersStore = useUsersStore();
const {
  selectedUserProfileData, selectedUserProfileId, userAccountData,
  selectedUserProfileType,
} = storeToRefs(usersStore);

const { submitFormToHubspot } = useHubspotForm(env.HUBSPOT_FORM_ID_TRUSTED_CONTACT);

const isLoading = ref(false);

const formModel = {
  beneficiary: {},
};

const model = reactive({
  beneficiary: {},
} as FormModeTrustedContact);

const schemaTrustedContact = {
  $schema: 'http://json-schema.org/draft-07/schema#',
  definitions: {
    TrustedContact: {
      properties: {
        first_name: firstNameRule,
        last_name: lastNameRule,
        relationship_type: relationshipTypeRule,
        phone: phoneRule,
        email: emailRule,
        dob: dobRule,
      },
      type: 'object',
      additionalProperties: false,
      required: ['first_name', 'last_name', 'relationship_type', 'phone', 'email', 'dob'],
    },
    Individual: {
      properties: {
        beneficiary: { type: 'object', $ref: '#/definitions/TrustedContact' },
      },
      type: 'object',
      errorMessage: errorMessageRule,
    },
  },
  $ref: '#/definitions/Individual',
} as unknown as JSONSchemaType<FormModeTrustedContact>;

let validator = new PrecompiledValidator<FormModeTrustedContact>(
  filterSchema(getProfileByIdOptionsData.value, formModel),
  schemaTrustedContact,
);
const validation = ref<unknown>();
const isValid = computed(() => isEmpty(validation.value || {}));
const isDisabledButton = computed(() => (!isValid.value || isSetProfileByIdLoading.value));

const onValidate = () => {
  validation.value = validator.getFormValidationErrors(model);
};

const saveHandler = async () => {
  onValidate();
  if (!isValid.value || !model.beneficiary) {
    nextTick(() => scrollToError('VFormTrustedContact'));
    return;
  }

  isLoading.value = true;
  await userProfilesStore.setProfileById(
    {
      beneficiary: model.beneficiary,
    },
    selectedUserProfileType.value,
    selectedUserProfileId.value,
  );
  isLoading.value = false;
  submitFormToHubspot({
    email: userAccountData.value?.email,
    firstname: model.beneficiary.first_name,
    lastname: model.beneficiary.last_name,
    relationship_type: model.beneficiary.relationship_type,
    phone: model.beneficiary.phone,
    trusted_email: model.beneficiary.email,
    date_of_birth: model.beneficiary.dob,
  });
  userProfilesStore.getProfileById(selectedUserProfileType.value, selectedUserProfileId.value);
  router.push({ name: ROUTE_DASHBOARD_ACCOUNT, params: { profileId: selectedUserProfileId.value } });
};

const cancelHandler = () => {
  router.push({ name: ROUTE_DASHBOARD_ACCOUNT, params: { profileId: selectedUserProfileId.value } });
};

watch(() => selectedUserProfileData.value?.data?.beneficiary, () => {
  if (selectedUserProfileData.value?.data?.beneficiary) {
    model.beneficiary = selectedUserProfileData.value?.data?.beneficiary;
  }
}, { deep: true, immediate: true });

watch(() => model, () => {
  if (!isValid.value) onValidate();
}, { deep: true });

watch(() => getProfileByIdOptionsData.value, () => {
  validator = new PrecompiledValidator<FormModeTrustedContact>(
    filterSchema(getProfileByIdOptionsData.value, formModel),
    schemaTrustedContact,
  );
});
</script>

<template>
  <div class="VFormTrustedContact form-personal-information">
    <div class="form-personal-information__header is--h1__title">
      Trusted Contact
    </div>
    <div class="form-personal-information__content">
      <FormRow>
        <FormCol col3>
          <VFormGroup
            v-slot="VFormGroupProps"
            :model="model"
            :validation="validation"
            :schema-back="getProfileByIdOptionsData"
            :schema-front="schemaTrustedContact"
            :error-text="setProfileByIdErrorData?.beneficiary?.relationship_type"
            path="beneficiary.relationship_type"
            label="Relationship Type"
            data-testid="relationship-type-group"
          >
            <VFormInput
              :model-value="model.beneficiary?.relationship_type"
              :is-error="VFormGroupProps.isFieldError"
              placeholder="Relationship Type"
              name="relationship-type"
              size="large"
              :loading="isGetProfileByIdLoading"
              data-testid="relationship-type"
              @update:model-value="model.beneficiary.relationship_type = $event"
            />
          </VFormGroup>
        </FormCol>

        <FormCol col3>
          <VFormGroup
            v-slot="VFormGroupProps"
            :model="model"
            :validation="validation"
            :schema-back="getProfileByIdOptionsData"
            :schema-front="schemaTrustedContact"
            :error-text="setProfileByIdErrorData?.beneficiary?.first_name"
            path="beneficiary.first_name"
            label="First Name"
            data-testid="first-name-group"
          >
            <VFormInput
              :model-value="model.beneficiary?.first_name"
              :is-error="VFormGroupProps.isFieldError"
              placeholder="First Name"
              name="first-name"
              size="large"
              data-testid="first-name"
              :loading="isGetProfileByIdLoading"
              @update:model-value="model.beneficiary.first_name = $event"
            />
          </VFormGroup>
        </FormCol>

        <FormCol col3>
          <VFormGroup
            v-slot="VFormGroupProps"
            :model="model"
            :validation="validation"
            :schema-back="getProfileByIdOptionsData"
            :schema-front="schemaTrustedContact"
            :error-text="setProfileByIdErrorData?.beneficiary?.last_name"
            path="beneficiary.last_name"
            label="Last Name"
            data-testid="last-name-group"
          >
            <VFormInput
              :model-value="model.beneficiary?.last_name"
              :is-error="VFormGroupProps.isFieldError"
              placeholder="Last Name"
              name="last-name"
              size="large"
              data-testid="last-name"
              :loading="isGetProfileByIdLoading"
              @update:model-value="model.beneficiary.last_name = $event"
            />
          </VFormGroup>
        </FormCol>
      </FormRow>
      <FormRow>
        <FormCol col3>
          <VFormGroup
            v-slot="VFormGroupProps"
            :model="model"
            :validation="validation"
            :schema-back="getProfileByIdOptionsData"
            :schema-front="schemaTrustedContact"
            :error-text="setProfileByIdErrorData?.beneficiary?.dob"
            path="beneficiary.dob"
            label="Date Of Birth"
            data-testid="dob-group"
          >
            <VFormInput
              :model-value="model.beneficiary?.dob"
              :is-error="VFormGroupProps.isFieldError"
              placeholder="Date Of Birth"
              name="dob"
              size="large"
              type="date"
              data-testid="dob"
              :loading="isGetProfileByIdLoading"
              @update:model-value="model.beneficiary.dob = $event"
            />
          </VFormGroup>
        </FormCol>
        <FormCol col3>
          <VFormGroup
            v-slot="VFormGroupProps"
            :model="model"
            :validation="validation"
            :schema-back="getProfileByIdOptionsData"
            :schema-front="schemaTrustedContact"
            :error-text="setProfileByIdErrorData?.beneficiary?.phone"
            path="beneficiary.phone"
            label="Phone number"
            data-testid="phone-group"
          >
            <VFormInput
              :model-value="model.beneficiary?.phone"
              :is-error="VFormGroupProps.isFieldError"
              placeholder="Phone number"
              name="phone"
              size="large"
              mask="+#(###)###-####"
              disallow-special-chars
              data-testid="phone"
              :loading="isGetProfileByIdLoading"
              @update:model-value="model.beneficiary.phone = $event"
            />
          </VFormGroup>
        </FormCol>

        <FormCol col3>
          <VFormGroup
            v-slot="VFormGroupProps"
            :model="model"
            :validation="validation"
            :schema-back="getProfileByIdOptionsData"
            :schema-front="schemaTrustedContact"
            :error-text="setProfileByIdErrorData?.beneficiary?.email"
            path="beneficiary.email"
            label="Email address"
            data-testid="email-group"
          >
            <VFormInput
              :model-value="model.beneficiary?.email"
              :is-error="VFormGroupProps.isFieldError"
              placeholder="Email address"
              name="email"
              size="large"
              data-testid="email"
              :loading="isGetProfileByIdLoading"
              @update:model-value="model.beneficiary.email = $event"
            />
          </VFormGroup>
        </FormCol>
      </FormRow>
    </div>
    <div class="form-personal-information__footer">
      <VButton
        size="large"
        variant="outlined"
        @click="cancelHandler"
      >
        Cancel
      </VButton>
      <VButton
        size="large"
        :disabled="isDisabledButton"
        :loading="isLoading"
        data-testid="button"
        @click="saveHandler"
      >
        Save
      </VButton>
    </div>
  </div>
</template>

<style lang="scss">
.form-personal-information {
  display: flex;
  flex-direction: column;
  margin: 0 auto;
  width: 100%;

  &__header {
    margin-bottom: 40px;
  }

  &__subtitle {
    margin-top: 12px;
    margin-bottom: 20px;
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
