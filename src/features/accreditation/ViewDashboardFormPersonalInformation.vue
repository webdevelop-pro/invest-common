<script setup lang="ts">
import { useUsersStore } from 'InvestCommon/store/useUsers';
import { useGlobalLoader } from 'InvestCommon/store/useGlobalLoader';
import LayoutBackButton from 'InvestCommon/components/layouts/LayoutBackButton.vue';
import VFormPersonalInformation from 'InvestCommon/components/forms/VFormPersonalInformation.vue';
import { ROUTE_DASHBOARD_ACCOUNT } from 'InvestCommon/helpers/enums/routes';
import { storeToRefs } from 'pinia';
import { computed } from 'vue';

defineProps({
  readOnly: Boolean,
  withId: Boolean,
  accreditation: Boolean,
});

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
    text: 'Personal Information',
  },
];
</script>

<template>
  <div class="ViewDashboardFormPersonalInformation view-dashboard-personal-information is--no-margin">
    <LayoutBackButton
      button-text="Back to Profile Details"
      :button-route="accountRoute"
      :breadcrumbs="breadcrumbs"
    >
      <VFormPersonalInformation
        :read-only="readOnly"
        :with-id="withId"
        :accreditation="accreditation"
      />
    </LayoutBackButton>
  </div>
</template>

<style lang="scss">
.view-dashboard-personal-information {
  width: 100%;
}
</style>
