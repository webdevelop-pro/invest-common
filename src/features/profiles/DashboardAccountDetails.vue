<script setup lang="ts">
import DashboardTabsTopInfo from 'InvestCommon/features/dashboard/components/DashboardTabsTopInfo.vue';;
import { storeToRefs } from 'pinia';
import { useProfilesStore } from 'InvestCommon/domain/profiles/store/useProfiles';
import { PROFILE_TYPES } from 'InvestCommon/domain/config/enums/profileTypes';
import { computed } from 'vue';
import DashboardAccountDetailsReadonlyForm from './components/DashboardAccountDetailsReadonlyForm.vue';
import { urlContactUs } from 'InvestCommon/domain/config/links';
import { useRepositoryProfiles } from 'InvestCommon/data/profiles/profiles.repository';
import { 
  ROUTE_DASHBOARD_PERSONAL_DETAILS,
  ROUTE_DASHBOARD_TRUSTED_CONTACT,
  ROUTE_DASHBOARD_BACKGROUND_INFORMATION,
  ROUTE_DASHBOARD_FINANCIAL_AND_INVESTMENT_INFO,
  ROUTE_DASHBOARD_ENTITY_INFORMATION,
  ROUTE_DASHBOARD_TRUST_INFORMATION,
  ROUTE_DASHBOARD_BUSINESS_CONTROLLER,
  ROUTE_DASHBOARD_CUSTODIAN_INFO,
  ROUTE_DASHBOARD_PLAN_INFO,
} from 'InvestCommon/domain/config/enums/routes';
import { IUserDataIndividual } from '@/data/profiles/profiles.types';

// Utility functions
const formatBoolean = (value: boolean | undefined) => value === undefined ? undefined : value ? 'Yes' : 'No';

const formatPhoneNumber = (phoneNumber: string | undefined): string | undefined => {
  if (!phoneNumber) return undefined;
  const cleaned = phoneNumber.replace(/\D/g, '');
  let countryCode = '';
  let number = cleaned;
  
  if (cleaned.length > 10) {
    countryCode = `+${cleaned.slice(0, cleaned.length - 10)} `;
    number = cleaned.slice(-10);
  }
  
  const areaCode = number.slice(0, 3);
  const middlePart = number.slice(3, 6);
  const lastPart = number.slice(6);
  
  return `${countryCode}(${areaCode}) ${middlePart}-${lastPart}`;
};

const formatName = (profileData: IUserDataIndividual) => {
  if (!profileData) return 'N/A';
  const parts = [
    profileData?.first_name,
    profileData?.middle_name,
    profileData?.last_name,
  ].filter(part => part !== undefined && part !== '');
  return parts.join(' ') || 'N/A';
};

const formatAddress = (profileData: IUserDataIndividual) => {
  if (!profileData) return 'N/A';
  const parts = [
    profileData?.address1,
    profileData?.address2,
    profileData?.city,
    profileData?.state,
    profileData?.zip_code,
    profileData?.country,
  ].filter(part => part !== undefined && part !== '');
  return parts.join(', ') || 'N/A';
};

// Store setup
const profilesStore = useProfilesStore();
const {
  selectedUserProfileType, selectedUserProfileId, selectedUserProfileData, selectedUserProfileRiskAcknowledged,
} = storeToRefs(profilesStore);
const useRepositoryProfilesStore = useRepositoryProfiles();
const { getProfileByIdState } = storeToRefs(useRepositoryProfilesStore);

const profileData = computed(() => selectedUserProfileData.value?.data);
const showController = computed(() => 
  selectedUserProfileType.value === PROFILE_TYPES.ENTITY || selectedUserProfileType.value === PROFILE_TYPES.TRUST
);

const financialSituation = computed(() => {
  const { accredited_investor } = profileData.value || {};
  if (!accredited_investor) return 'N/A';
  return accredited_investor?.is_accredited ? 'Accredited Investor' : 'Not Accredited Investor';
});

// Simplified data structure
const formSections = computed(() => {
  const sections = [
    {
      id: 'personal',
      title: 'Personal Information',
      route: ROUTE_DASHBOARD_PERSONAL_DETAILS,
      data: [
        { title: 'Full Legal Name:', text: formatName(profileData.value) },
        { title: 'Date of Birth:', text: profileData.value?.dob || 'N/A' },
        { title: 'Phone Number:', text: formatPhoneNumber(profileData.value?.phone) || 'N/A' },
        { title: 'Residence Address:', text: formatAddress(profileData.value) },
      ],
      show: true, // Always show
    },
    {
      id: 'trusted',
      title: 'Trusted Contact',
      route: ROUTE_DASHBOARD_TRUSTED_CONTACT,
      data: [
        { title: 'Relationship Type:', text: profileData.value?.beneficiary?.relationship_type || 'N/A' },
        { title: 'Full Name:', text: formatName(profileData.value?.beneficiary) },
        { title: 'Date of Birth:', text: profileData.value?.beneficiary?.dob || 'N/A' },
        { title: 'Phone Number:', text: formatPhoneNumber(profileData.value?.beneficiary?.phone) || 'N/A' },
        { title: 'Email Address:', text: profileData.value?.beneficiary?.email || 'N/A' },
      ],
      show: selectedUserProfileType.value === PROFILE_TYPES.INDIVIDUAL,
    },
    {
      id: 'background',
      title: 'Your Background Information',
      route: ROUTE_DASHBOARD_BACKGROUND_INFORMATION,
      data: [
        { title: 'Employment:', text: profileData.value?.employment?.type || 'N/A' },
        { title: 'FINRA/SEC Affiliated:', text: profileData.value?.finra_affiliated?.member_firm_name || 'N/A' },
        { title: '10% Shareholder:', text: profileData.value?.ten_percent_shareholder?.ticker_symbol_list || 'N/A' },
        { title: 'IRS Backup Withholding:', text: formatBoolean(profileData.value?.irs_backup_withholding) || 'N/A' },
      ],
      show: selectedUserProfileType.value === PROFILE_TYPES.INDIVIDUAL,
    },
    {
      id: 'financial',
      title: 'Financial and Investment Information',
      route: ROUTE_DASHBOARD_FINANCIAL_AND_INVESTMENT_INFO,
      data: [
        { title: 'Financial Situation:', text: financialSituation.value },
        { title: 'Investment Objectives:', text: profileData.value?.investment_objectives?.objectives || 'N/A' },
        { title: 'Understanding of Risks:', text: selectedUserProfileRiskAcknowledged.value ? 'Acknowledged' : 'N/A' },
      ],
      show: selectedUserProfileType.value === PROFILE_TYPES.INDIVIDUAL,
    },
    {
      id: 'entity',
      title: 'Entity Information',
      route: ROUTE_DASHBOARD_ENTITY_INFORMATION,
      data: [
        { title: 'Type of Entity:', text: profileData.value?.type || 'N/A' },
        { title: 'Name of Entity:', text: profileData.value?.name || 'N/A' },
        { title: 'Your Title within Entity:', text: profileData.value?.owner_title || 'N/A' },
        { title: 'Was this Entity created solely for investing on our platform?', text: profileData.value?.solely_for_investing || 'N/A' },
        { title: 'Does your entity have Tax Exempt Status?', text: profileData.value?.tax_exempts || 'N/A' },
      ],
      show: selectedUserProfileType.value === PROFILE_TYPES.ENTITY,
    },
    {
      id: 'trust',
      title: 'Trust Information',
      route: ROUTE_DASHBOARD_TRUST_INFORMATION,
      data: [
        { title: 'Type of Trust:', text: profileData.value?.type || 'N/A' },
        { title: 'Name of Trust:', text: profileData.value?.name || 'N/A' },
        { title: 'Your Title:', text: profileData.value?.owner_title || 'N/A' },
        { title: 'EIN:', text: profileData.value?.ein || 'N/A' },
      ],
      show: selectedUserProfileType.value === PROFILE_TYPES.TRUST,
    },
    {
      id: 'controller',
      readonly: true,
      title: selectedUserProfileType.value === PROFILE_TYPES.TRUST ? 'Grantor Information' : 'Business Controller Information',
      route: ROUTE_DASHBOARD_BUSINESS_CONTROLLER,
      data: [
        { title: 'Full Legal Name:', text: formatName(profileData.value?.business_controller) },
        { title: 'Date of Birth:', text: profileData.value?.business_controller?.dob || 'N/A' },
        { title: 'Phone Number:', text: formatPhoneNumber(profileData.value?.business_controller?.phone) || 'N/A' },
        { title: 'Residence Address:', text: formatAddress(profileData.value?.business_controller) },
      ],
      show: showController.value,
      query: selectedUserProfileType.value === PROFILE_TYPES.TRUST ? { trust: 'true' } : undefined,
    },
    {
      id: 'custodian',
      title: 'Custodian Information',
      route: ROUTE_DASHBOARD_CUSTODIAN_INFO,
      data: [
        { title: 'Type:', text: profileData.value?.type || 'N/A' },
        { title: 'Account Number:', text: profileData.value?.account_number || 'N/A' },
        { title: 'Full Account Name:', text: profileData.value?.full_account_name || 'N/A' },
      ],
      show: selectedUserProfileType.value === PROFILE_TYPES.SDIRA,
    },
    {
      id: 'plan',
      title: 'Plan Information',
      route: ROUTE_DASHBOARD_PLAN_INFO,
      data: [
        { title: 'Name of the Solo 401(k):', text: profileData.value?.name || 'N/A' },
        { title: 'EIN:', text: profileData.value?.ein || 'N/A' },
      ],
      show: selectedUserProfileType.value === PROFILE_TYPES.SOLO401K,
    },
  ];

  return sections.filter(section => section.show);
});

const ACCOUNT_TAB_INFO = {
  title: 'Profile Details',
  text: `
    To help the government fight the funding of terrorism and money laundering activities, federal
    law requires all financial institutions to obtain, verify, and record information that identifies
    each person who opens an account. If you have any questions, feel free to 
    <a class="is--link-2" href="${urlContactUs}">chat with us.</a>
  `,
};
</script>

<template>
  <div class="DashboardAccountDetails dashboard-account-details">
    <DashboardTabsTopInfo
      :title="ACCOUNT_TAB_INFO.title"
      :text="ACCOUNT_TAB_INFO.text"
    />
    <div class="is--two-col-grid is--gap-40-80">
      <DashboardAccountDetailsReadonlyForm
        v-for="section in formSections"
        :key="section.id"
        :loading="getProfileByIdState.loading"
        :router-push="{
          name: section.route,
          params: { profileId: selectedUserProfileId },
          query: section.query,
        }"
        :readonly="section.readonly"
        :info="{ title: section.title, data: section.data }"
      />
    </div>
  </div>
</template>

<style lang="scss">
.dashboard-account-details {
  &__wrap {
    width: 100%;
  }

  &__title {
    margin-bottom: 40px;
  }
}
</style>
