<script setup lang="ts">
import { useUsersStore } from 'InvestCommon/store/useUsers';
import { useGlobalLoader } from 'InvestCommon/store/useGlobalLoader';
import LayoutBackButton from 'InvestCommon/components/layouts/LayoutBackButton.vue';
import VFormBusinessController from 'InvestCommon/components/forms/VFormBusinessController.vue';
import { ROUTE_DASHBOARD_ACCOUNT } from 'InvestCommon/helpers/enums/routes';
import { storeToRefs } from 'pinia';
import { computed } from 'vue';

const globalLoader = useGlobalLoader();
globalLoader.hide();

const usersStore = useUsersStore();
const { selectedUserProfileId } = storeToRefs(usersStore);

defineProps({
  trust: Boolean,
});

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
    text: 'Business Controller',
  },
];
</script>

<template>
  <div class="ViewDashboardBusinessController view-dashboard-business-controller is--no-margin">
    <LayoutBackButton
      button-text="Back to Profile Details"
      :button-route="accountRoute"
      :breadcrumbs="breadcrumbs"
    >
      <VFormBusinessController
        :trust="trust"
      />
    </LayoutBackButton>
  </div>
</template>

<style lang="scss">
.view-dashboard-business-controller {
  width: 100%;
}
</style>
