<script setup lang="ts">
import {
  ref, computed, watch, reactive, nextTick,
} from 'vue';
import { useUserIdentitysStore, useUsersStore } from 'InvestCommon/store';
import { useHubspotForm } from 'InvestCommon/composable';
import FormRow from 'InvestCommon/components/VForm/VFormRow.vue';
import FormCol from 'InvestCommon/components/VForm/VFormCol.vue';
import VFormInput from 'UiKit/components/VForm/VFormInput.vue';
import VButton from 'UiKit/components/VButton/VButton.vue';
import { storeToRefs } from 'pinia';
import { PrecompiledValidator } from 'UiKit/helpers/validation/PrecompiledValidator';
import { isEmpty } from 'InvestCommon/helpers/general';
import VFormGroup from 'UiKit/components/VForm/VFormGroup.vue';
import { FormModeTrustedContact, schemaTrustedContact } from './utils';
import { filterSchema, scrollToError } from 'UiKit/helpers/validation/general';
import { useRouter } from 'vue-router';
import { ROUTE_DASHBOARD_ACCOUNT } from 'InvestCommon/helpers/enums/routes';

const props = defineProps({
  hubsportFormId: String,
});

const router = useRouter();
const userIdentityStore = useUserIdentitysStore();
const {
  isSetUserIdentityLoading, setUserIdentityErrorData, setUserIdentityOptionsData,
} = storeToRefs(userIdentityStore);
const usersStore = useUsersStore();
const { selectedUserProfileData, selectedUserProfileId, userAccountData } = storeToRefs(usersStore);

const { submitFormToHubspot } = useHubspotForm(props.hubsportFormId);

const isLoading = ref(false);

const formModel = {
  beneficiary: {},
};

const model = reactive({
  beneficiary: {},
} as FormModeTrustedContact);

let validator = new PrecompiledValidator<FormModeTrustedContact>(
  filterSchema(setUserIdentityOptionsData.value, formModel),
  schemaTrustedContact,
);
const validation = ref<unknown>();
const isValid = computed(() => isEmpty(validation.value || {}));
const isDisabledButton = computed(() => (!isValid.value || isSetUserIdentityLoading.value));

const onValidate = () => {
  validation.value = validator.getFormValidationErrors(model);
};

const saveHandler = async () => {
  onValidate();
  if (!isValid.value || !model.beneficiary) {
    void nextTick(() => scrollToError('FormTrustedContact'));
    return;
  }

  isLoading.value = true;
  await userIdentityStore.setUserIdentity({
    beneficiary: model.beneficiary,
  });
  isLoading.value = false;
  void submitFormToHubspot({
    email: userAccountData.value?.email,
    firstname: model.beneficiary.first_name,
    lastname: model.beneficiary.last_name,
    relationship_type: model.beneficiary.relationship_type,
    phone: model.beneficiary.phone,
    trusted_email: model.beneficiary.email,
    date_of_birth: model.beneficiary.dob,
  });
  void userIdentityStore.getUserIndividualProfile();
  void router.push({ name: ROUTE_DASHBOARD_ACCOUNT, params: { profileId: selectedUserProfileId.value } });
};

const cancelHandler = () => {
  void router.push({ name: ROUTE_DASHBOARD_ACCOUNT, params: { profileId: selectedUserProfileId.value } });
};

watch(() => selectedUserProfileData.value?.data?.beneficiary, () => {
  if (selectedUserProfileData.value?.data?.beneficiary?.first_name) {
    model.beneficiary.first_name = selectedUserProfileData.value?.data?.beneficiary?.first_name;
  }
  if (selectedUserProfileData.value?.data?.beneficiary?.dob) {
    model.beneficiary.dob = selectedUserProfileData.value?.data?.beneficiary?.dob;
  }
  if (selectedUserProfileData.value?.data?.beneficiary?.email) {
    model.beneficiary.email = selectedUserProfileData.value?.data?.beneficiary?.email;
  }
  if (selectedUserProfileData.value?.data?.beneficiary?.last_name) {
    model.beneficiary.last_name = selectedUserProfileData.value?.data?.beneficiary?.last_name;
  }
  if (selectedUserProfileData.value?.data?.beneficiary?.phone) {
    model.beneficiary.phone = selectedUserProfileData.value?.data?.beneficiary?.phone;
  }
  if (selectedUserProfileData.value?.data?.beneficiary?.relationship_type) {
    model.beneficiary.relationship_type = selectedUserProfileData.value?.data?.beneficiary?.relationship_type;
  }
}, { deep: true, immediate: true });

watch(() => model, () => {
  if (!isValid.value) onValidate();
}, { deep: true });

// eslint-disable-next-line
watch(() => setUserIdentityOptionsData.value, () => {
  validator = new PrecompiledValidator<FormModeTrustedContact>(
    filterSchema(setUserIdentityOptionsData.value, formModel),
    schemaTrustedContact,
  );
});
</script>

<template>
  <div class="FormTrustedContact form-personal-information">
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
            :schema-back="setUserIdentityOptionsData"
            :schema-front="schemaTrustedContact"
            :error-text="setUserIdentityErrorData?.beneficiary?.relationship_type"
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
            :schema-back="setUserIdentityOptionsData"
            :schema-front="schemaTrustedContact"
            :error-text="setUserIdentityErrorData?.beneficiary?.first_name"
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
              @update:model-value="model.beneficiary.first_name = $event"
            />
          </VFormGroup>
        </FormCol>

        <FormCol col3>
          <VFormGroup
            v-slot="VFormGroupProps"
            :model="model"
            :validation="validation"
            :schema-back="setUserIdentityOptionsData"
            :schema-front="schemaTrustedContact"
            :error-text="setUserIdentityErrorData?.beneficiary?.last_name"
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
            :schema-back="setUserIdentityOptionsData"
            :schema-front="schemaTrustedContact"
            :error-text="setUserIdentityErrorData?.beneficiary?.dob"
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
              @update:model-value="model.beneficiary.dob = $event"
            />
          </VFormGroup>
        </FormCol>
        <FormCol col3>
          <VFormGroup
            v-slot="VFormGroupProps"
            :model="model"
            :validation="validation"
            :schema-back="setUserIdentityOptionsData"
            :schema-front="schemaTrustedContact"
            :error-text="setUserIdentityErrorData?.beneficiary?.phone"
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
              @update:model-value="model.beneficiary.phone = $event"
            />
          </VFormGroup>
        </FormCol>

        <FormCol col3>
          <VFormGroup
            v-slot="VFormGroupProps"
            :model="model"
            :validation="validation"
            :schema-back="setUserIdentityOptionsData"
            :schema-front="schemaTrustedContact"
            :error-text="setUserIdentityErrorData?.beneficiary?.email"
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
