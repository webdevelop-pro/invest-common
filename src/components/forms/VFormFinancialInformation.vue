<!-- eslint-disable @typescript-eslint/no-unsafe-assignment -->
<script setup lang="ts">
import {
  ref, computed, nextTick, useTemplateRef,
} from 'vue';
import { useUserProfilesStore } from 'InvestCommon/store/useUserProfiles';
import { useUsersStore } from 'InvestCommon/store/useUsers';
import { useHubspotForm } from 'InvestCommon/composable/useHubspotForm';
import VButton from 'UiKit/components/Base/VButton/VButton.vue';
import { storeToRefs } from 'pinia';
import { scrollToError } from 'UiKit/helpers/validation/general';
import { useRouter } from 'vue-router';
import { ROUTE_DASHBOARD_ACCOUNT } from 'InvestCommon/helpers/enums/routes';
import { FormChild } from 'InvestCommon/types/form';
import VFormPartialFinancialSituation from './VFormPartialFinancialSituation.vue';
import VFormPartialInvestmentObjectives from './VFormPartialInvestmentObjectives.vue';
import VFormPartialUnderstandingOfRisks from './VFormPartialUnderstandingOfRisks.vue';
import env from 'InvestCommon/global';

const router = useRouter();
const userProfilesStore = useUserProfilesStore();
const {
  isSetProfileByIdLoading,
} = storeToRefs(userProfilesStore);
const usersStore = useUsersStore();
const {
  selectedUserProfileData, selectedUserProfileId,
  userAccountData, selectedUserProfileType,
} = storeToRefs(usersStore);

const financialInfoFormRef = useTemplateRef<FormChild>('financialInfoFormChild');
const investmentObjectivesFormRef = useTemplateRef<FormChild>('investmentObjectivesFormChild');
const understandingRisksFormRef = useTemplateRef<FormChild>('understandingRisksFormChild');

const isLoading = ref(false);
const isValid = computed(() => (financialInfoFormRef.value?.isValid
  && investmentObjectivesFormRef.value?.isValid && understandingRisksFormRef.value?.isValid));
const isDisabledButton = computed(() => (!isValid.value || isSetProfileByIdLoading.value));

const saveHandler = async () => {
  financialInfoFormRef.value?.onValidate();
  investmentObjectivesFormRef.value?.onValidate();
  understandingRisksFormRef.value?.onValidate();

  if (!isValid.value) {
    nextTick(() => scrollToError('VFormFinancialInformation'));
    return;
  }

  isLoading.value = true;
  const modelLocal = {
    ...financialInfoFormRef.value?.model,
    ...investmentObjectivesFormRef.value?.model,
    ...understandingRisksFormRef.value?.model,
  };
  const { consent_plaid, ...fields } = modelLocal;
  await userProfilesStore.setProfileById(
    {
      ...fields,
    },
    selectedUserProfileType.value,
    selectedUserProfileId.value,
  );
  isLoading.value = false;
  useHubspotForm(env.HUBSPOT_FORM_ID_FINANCIAL_SITUATION).submitFormToHubspot({
    email: userAccountData.value?.email,
    is_accredited: financialInfoFormRef.value?.model.accredited_investor.is_accredited,
  });
  useHubspotForm(env.HUBSPOT_FORM_ID_RISKS).submitFormToHubspot({
    email: userAccountData.value?.email,
    ...understandingRisksFormRef.value?.model,
  });
  useHubspotForm(env.HUBSPOT_FORM_ID_INVESTMENT_OBJECTIVES).submitFormToHubspot({
    email: userAccountData.value?.email,
    ...investmentObjectivesFormRef.value?.model,
  });
  userProfilesStore.getProfileById(selectedUserProfileType.value, selectedUserProfileId.value);
  router.push({ name: ROUTE_DASHBOARD_ACCOUNT, params: { profileId: selectedUserProfileId.value } });
};

const cancelHandler = () => {
  router.push({ name: ROUTE_DASHBOARD_ACCOUNT, params: { profileId: selectedUserProfileId.value } });
};
</script>

<template>
  <div class="VFormFinancialInformation form-financial-information">
    <div class="form-financial-information__header is--h1__title">
      Financial and Investment Information
    </div>
    <div class="form-financial-information__content">
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
        consent-plaid
      />
    </div>
    <div class="form-financial-information__footer">
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
.form-financial-information {
  display: flex;
  flex-direction: column;
  margin: 0 auto;
  width: 100%;

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
