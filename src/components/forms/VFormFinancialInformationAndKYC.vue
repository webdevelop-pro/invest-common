<!-- eslint-disable @typescript-eslint/no-unsafe-assignment -->
<script setup lang="ts">
import {
  ref, computed, useTemplateRef,
  nextTick,
} from 'vue';
import { useUserProfilesStore } from 'InvestCommon/store/useUserProfiles';
import { useUsersStore } from 'InvestCommon/store/useUsers';
import { useAccreditationStore } from 'InvestCommon/store/useAccreditation';
import { usePlaidStore } from 'InvestCommon/store/usePlaid';
import { useHubspotForm } from 'InvestCommon/composable/useHubspotForm';
import VButton from 'UiKit/components/Base/VButton/VButton.vue';
import { storeToRefs } from 'pinia';
import { useRouter } from 'vue-router';
import { ROUTE_DASHBOARD_ACCOUNT } from 'InvestCommon/helpers/enums/routes';
import VFormPartialPersonalInformation from './VFormPartialPersonalInformation.vue';
import VFormPartialFinancialSituation from './VFormPartialFinancialSituation.vue';
import VFormPartialInvestmentObjectives from './VFormPartialInvestmentObjectives.vue';
import VFormPartialUnderstandingOfRisks from './VFormPartialUnderstandingOfRisks.vue';
import { FormChild } from 'InvestCommon/types/form';
import { scrollToError } from 'UiKit/helpers/validation/general';
import env from 'InvestCommon/global';

const personalFormRef = useTemplateRef<FormChild>('personalFormChild');
const financialInfoFormRef = useTemplateRef<FormChild>('financialInfoFormChild');
const investmentObjectivesFormRef = useTemplateRef<FormChild>('investmentObjectivesFormChild');
const understandingRisksFormRef = useTemplateRef<FormChild>('understandingRisksFormChild');

const router = useRouter();
const userProfilesStore = useUserProfilesStore();
const {
  isSetProfileByIdLoading, isSetProfileByIdError,
} = storeToRefs(userProfilesStore);
const usersStore = useUsersStore();
const {
  selectedUserProfileData, userAccountData, selectedUserProfileId,
  selectedUserProfileType,
} = storeToRefs(usersStore);
const plaidStore = usePlaidStore();
const { isCreateTokenError } = storeToRefs(plaidStore);
const accreditationStore = useAccreditationStore();

const isLoading = ref(false);

const isValid = computed(() => (personalFormRef.value?.isValid && financialInfoFormRef.value?.isValid
  && investmentObjectivesFormRef.value?.isValid && understandingRisksFormRef.value?.isValid));
const isDisabledButton = computed(() => (!isValid.value || isSetProfileByIdLoading.value));

const hubspotHandle = () => {
  void useHubspotForm(env.HUBSPOT_FORM_ID_FINANCIAL_SITUATION).submitFormToHubspot({
    email: userAccountData.value?.email,
    is_accredited: financialInfoFormRef.value?.model.accredited_investor.is_accredited,
  });
  void useHubspotForm(env.HUBSPOT_FORM_ID_RISKS).submitFormToHubspot({
    email: userAccountData.value?.email,
    ...understandingRisksFormRef.value?.model,
  });
  void useHubspotForm(env.HUBSPOT_FORM_ID_INVESTMENT_OBJECTIVES).submitFormToHubspot({
    email: userAccountData.value?.email,
    ...investmentObjectivesFormRef.value?.model,
  });
  void useHubspotForm(env.HUBSPOT_FORM_ID_PERSONAL_INFORMATION).submitFormToHubspot({
    email: userAccountData.value?.email,
    ...personalFormRef.value?.model,
    date_of_birth: personalFormRef.value?.model?.dob,
  });
};

const saveHandler = async () => {
  personalFormRef.value?.onValidate();
  financialInfoFormRef.value?.onValidate();
  investmentObjectivesFormRef.value?.onValidate();
  understandingRisksFormRef.value?.onValidate();

  if (!isValid.value) {
    void nextTick(() => scrollToError('VFormFinancialInformationAndKYC'));
    return;
  }

  const modelLocal = {
    ...personalFormRef.value?.model,
    ...financialInfoFormRef.value?.model,
    ...investmentObjectivesFormRef.value?.model,
    ...understandingRisksFormRef.value?.model,
  };

  const { consent_plaid, ...fields } = modelLocal;

  isLoading.value = true;
  await userProfilesStore.setProfileById(
    {
      ...fields,
    },
    selectedUserProfileType.value,
    selectedUserProfileId.value,
  );
  if (!isSetProfileByIdError.value) await plaidStore.handlePlaidKyc();
  if (!isCreateTokenError.value && !isSetProfileByIdError.value
    && selectedUserProfileData.value?.user_id && selectedUserProfileData.value?.id
    && !selectedUserProfileData.value?.escrow_id) {
    await accreditationStore.createEscrow(selectedUserProfileData.value?.user_id, selectedUserProfileData.value?.id);
  }
  isLoading.value = false;
  if (!isSetProfileByIdError.value) hubspotHandle();
  void userProfilesStore.getProfileById(selectedUserProfileType.value, selectedUserProfileId.value);
  void router.push({ name: ROUTE_DASHBOARD_ACCOUNT, params: { profileId: selectedUserProfileId.value } });
};

const cancelHandler = () => {
  void router.push({ name: ROUTE_DASHBOARD_ACCOUNT, params: { profileId: selectedUserProfileId.value } });
};
</script>

<template>
  <div class="VFormFinancialInformationAndKYC form-reg-cf-information">
    <div class="form-reg-cf-information__header is--h1__title">
      Your Financial Information and KYC
    </div>
    <p class="form-reg-cf-information__subheader is--subheading-2">
      Automated KYC process for investor onboarding. This is a one-time step.
    </p>
    <div class="form-reg-cf-information__content">
      <VFormPartialPersonalInformation
        ref="personalFormChild"
        :model-data="selectedUserProfileData?.data"
      />
      <VFormPartialFinancialSituation
        ref="financialInfoFormChild"
        :model-data="selectedUserProfileData?.data"
      />
      <VFormPartialInvestmentObjectives
        ref="investmentObjectivesFormChild"
        :model-data="selectedUserProfileData?.data"
      />
      <VFormPartialUnderstandingOfRisks
        ref="understandingRisksFormChild"
        :model-data="selectedUserProfileData?.data"
      />
    </div>
    <div class="form-reg-cf-information__footer">
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
.form-reg-cf-information {
  display: flex;
  flex-direction: column;
  margin: 0 auto;
  width: 100%;

  &__header {
    margin-bottom: 20px;
  }

  &__subheader {
    color: $gray-80;
    margin-bottom: 40px;
  }

  &__subtitle {
    margin-top: 12px;
    margin-bottom: 20px;
  }

  &__text {
    margin-bottom: 20px;
  }

  &__footer {
    display: flex;
    justify-content: flex-end;
    align-items: flex-start;
    gap: 12px;
    margin-top: 20px;
  }

  &__row {
    align-items: center;
  }

  &__accreditation-number {
    margin-left: 20px;
  }
}
</style>
