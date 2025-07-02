<script setup lang="ts">
import { useUsersStore } from 'InvestCommon/store/useUsers';
import { useGlobalLoader } from 'InvestCommon/store/useGlobalLoader';
import LayoutBackButton from 'InvestCommon/components/layouts/LayoutBackButton.vue';
import FormFinancialInformation from 'InvestCommon/components/forms/VFormFinancialInformation.vue';
import { ROUTE_DASHBOARD_ACCOUNT } from 'InvestCommon/helpers/enums/routes';
import { storeToRefs } from 'pinia';
import { computed } from 'vue';

const globalLoader = useGlobalLoader();
globalLoader.hide();

const usersStore = useUsersStore();
const { selectedUserProfileId } = storeToRefs(usersStore);

const accountRoute = computed(() => (
  { name: ROUTE_DASHBOARD_ACCOUNT, params: { profileId: selectedUserProfileId.value } }));

const breadcrumbs = [
  {
    text: 'Dashboard',
    to: accountRoute.value,
  },
  {
    text: 'Profile Details',
    to: accountRoute.value,
  },
  {
    text: 'Financial and Investment Information',
  },
];
</script>

<template>
  <div class="ViewDashboardFinancialInformation view-dashboard-financial-information is--no-margin">
    <LayoutBackButton
      button-text="Back to Profile Details"
      :button-route="accountRoute"
      :breadcrumbs="breadcrumbs"
    >
      <FormFinancialInformation />
    </LayoutBackButton>
  </div>
</template>

<style lang="scss">
.view-dashboard-financial-information {
  width: 100%;
}
</style>
