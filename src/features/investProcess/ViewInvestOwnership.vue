<script setup lang="ts">
import { defineAsyncComponent, ref, watch } from 'vue';
import { ROUTE_INVEST_AMOUNT } from 'InvestCommon/helpers/enums/routes';
import FormRow from 'UiKit/components/Base/VForm/VFormRow.vue';
import FormCol from 'UiKit/components/Base/VForm/VFormCol.vue';
import VButton from 'UiKit/components/Base/VButton/VButton.vue';
import arrowLeft from 'UiKit/assets/images/arrow-left.svg';
import VProfileSelectList from 'InvestCommon/features/profiles/VProfileSelectList.vue';
import { useInvestOwnership } from 'InvestCommon/features/investProcess/logic/useInvestOwnership';
import { urlOfferSingle } from 'InvestCommon/global/links';
import InvestStep from 'InvestCommon/features/investProcess/components/InvestStep.vue';
import VFormPartialPersonalInformationSkeleton from 'InvestCommon/components/forms/VFormPartialPersonalInformationSkeleton.vue';

// Async components
const VFormProfileEntity = defineAsyncComponent({
  loader: () => import('InvestCommon/features/profiles/components/VFormProfileEntity.vue'),
  loadingComponent: VFormPartialPersonalInformationSkeleton,
});
const VFormProfileSDIRA = defineAsyncComponent({
  loader: () => import('InvestCommon/features/profiles/components/VFormProfileSDIRA.vue'),
  loadingComponent: VFormPartialPersonalInformationSkeleton,
});
const VFormProfileSolo = defineAsyncComponent({
  loader: () => import('InvestCommon/features/profiles/components/VFormProfileSolo.vue'),
  loadingComponent: VFormPartialPersonalInformationSkeleton,
});
const VFormProfileTrust = defineAsyncComponent({
  loader: () => import('InvestCommon/features/profiles/components/VFormProfileTrust.vue'),
  loadingComponent: VFormPartialPersonalInformationSkeleton,
});
const VFormPartialPersonalInformation = defineAsyncComponent({
  loader: () => import('InvestCommon/components/forms/VFormPartialPersonalInformation.vue'),
  loadingComponent: VFormPartialPersonalInformationSkeleton,
});
const VAlert = defineAsyncComponent({
  loader: () => import('UiKit/components/VAlert.vue'),
});

const {
  PROFILE_TYPES,
  selectedUserProfileType,
  isAlertShow,
  isAlertText,
  errorData,
  schemaBackend,
  isDisabledButton,
  dataUserData,
  slug,
  id,
  profileId,
  isLoading,
  continueHandler,
  onAlertButtonClick,
} = useInvestOwnership();

// Add loading state for profile switching
const isProfileSwitching = ref(false);

// Watch for profile type changes to show loading skeleton
watch(selectedUserProfileType, () => {
  isProfileSwitching.value = true;
  // Hide loading after a short delay to ensure smooth transition
  setTimeout(() => {
    isProfileSwitching.value = false;
  }, 100);
});
</script>

<template>
  <div class="ViewInvestOwnership view-invest-ownership is--no-margin">
    <InvestStep
      title="Ownership"
      :step-number="2"
      :is-loading="isLoading"
    >
      <div class="VFormInvestProcessOwnership invest-form-ownership-wrap">
        <FormRow>
          <FormCol>
            <VProfileSelectList
              label="Investment Profile"
            />
          </FormCol>
        </FormRow>
        
        <FormRow v-if="isAlertShow">
          <FormCol>
            <VAlert
              v-if="isAlertShow"
              variant="error"
              data-testid="funding-alert"
              class="dashboard-wallet__alert"
              button-text="Go to account page"
              @click="onAlertButtonClick"
            >
              <template #title>
                Identity verification is needed.
              </template>
              <template #description>
                <span v-html="isAlertText" />
              </template>
            </VAlert>
          </FormCol>
        </FormRow>
        
        <template v-else>
          <!-- Show loading skeleton during profile switching -->
          <VFormPartialPersonalInformationSkeleton 
            v-if="isProfileSwitching" 
          />
          
          <!-- Show profile forms when not switching -->
          <template v-else>
            <!-- Individual Profile Form -->
            <template v-if="selectedUserProfileType === PROFILE_TYPES.INDIVIDUAL">
              <div class="invest-form-ownership__subtitle is--h3__title">
                Personal Information
              </div>
              <VFormPartialPersonalInformation
                ref="individualFormChild"
                :model-data="dataUserData"
                :loading="isLoading"
                :schema-backend="schemaBackend"
                :error-data="errorData"
              />
            </template>
            
            <!-- Other Profile Forms -->
            <VFormProfileEntity
              v-if="selectedUserProfileType === PROFILE_TYPES.ENTITY"
              ref="entityFormChild"
              :model-data="dataUserData"
              :loading="isLoading"
              :schema-backend="schemaBackend"
              :error-data="errorData"
            />
            <VFormProfileSDIRA
              v-if="selectedUserProfileType === PROFILE_TYPES.SDIRA"
              ref="sdiraFormChild"
              :model-data="dataUserData"
              :loading="isLoading"
              :schema-backend="schemaBackend"
              :error-data="errorData"
            />
            <VFormProfileSolo
              v-if="selectedUserProfileType === PROFILE_TYPES.SOLO401K"
              ref="soloFormChild"
              :model-data="dataUserData"
              :loading="isLoading"
              :schema-backend="schemaBackend"
              :error-data="errorData"
            />
            <VFormProfileTrust
              v-if="selectedUserProfileType === PROFILE_TYPES.TRUST"
              ref="trustFormChild"
              :model-data="dataUserData"
              :loading="isLoading"
              :schema-backend="schemaBackend"
              :error-data="errorData"
            />
          </template>
        </template>

        <div class="invest-form-ownership__footer">
          <VButton
            variant="link"
            size="large"
            as="router-link"
            :to="{ name: ROUTE_INVEST_AMOUNT, params: { slug, id, profileId } }"
          >
            <arrowLeft
              alt="arrow left"
              class="invest-form-funding__back-icon"
            />
            Back
          </VButton>
          <div class="invest-form-ownership__btn">
            <VButton
              variant="outlined"
              size="large"
              as="a"
              :href="urlOfferSingle(slug)"
            >
              Cancel
            </VButton>
            <VButton
              :disabled="isDisabledButton"
              :loading="isLoading"
              size="large"
              data-testid="button"
              @click="continueHandler"
            >
              Continue
            </VButton>
          </div>
        </div>
      </div>
    </InvestStep>
  </div>
</template>

<style lang="scss">
@use 'UiKit/styles/_variables.scss' as *;

.view-invest-ownership{
  width: 100%;
  padding-top: $header-height;
}

.invest-form-ownership {
  &__btn {
    display: flex;
    justify-content: flex-end;
    gap: 12px;

    @media screen and (max-width: $tablet){
      flex-direction: column;
    }
  }

  &__footer {
    margin-top: 20px;
    display: flex;
    justify-content: space-between;

    @media screen and (max-width: $tablet){
      flex-direction: column;
      gap: 12px;
    }
  }

  &__back-icon {
    width: 20px;
  }

  &__subtitle {
    margin-bottom: 20px;
    margin-top: 12px;
  }
}
</style>
