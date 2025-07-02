<script setup lang="ts">
import { useUsersStore } from 'InvestCommon/store/useUsers';
import { useGlobalLoader } from 'InvestCommon/store/useGlobalLoader';
import LayoutBackButton from 'InvestCommon/components/layouts/LayoutBackButton.vue';
import VFormCreateNewProfile from 'InvestCommon/components/forms/VFormCreateNewProfile.vue';
import { ROUTE_DASHBOARD_ACCOUNT } from 'InvestCommon/helpers/enums/routes';
import { storeToRefs } from 'pinia';
// import env from 'InvestCommon/global';

const globalLoader = useGlobalLoader();
globalLoader.hide();

const usersStore = useUsersStore();
const { selectedUserProfileId } = storeToRefs(usersStore);

const breadcrumbs = [
  {
    text: 'Dashboard',
    to: { name: ROUTE_DASHBOARD_ACCOUNT, params: { profileId: selectedUserProfileId.value } },
  },
  {
    text: 'Set Up Investment Account',
  },
];
</script>

<template>
  <div class="ViewCreateNewProfile view-create-new-profile is--no-margin">
    <LayoutBackButton
      button-text="Go Back"
      :breadcrumbs="breadcrumbs"
    >
      <VFormCreateNewProfile />
    </LayoutBackButton>
  </div>
</template>

<style lang="scss">
.view-create-new-profile {
  width: 100%;
}
</style>
