<script setup lang="ts">
import DashboardTabsTopInfo from 'InvestCommon/features/dashboard/components/DashboardTabsTopInfo.vue';
import { useDialogs } from 'InvestCommon/domain/dialogs/store/useDialogs';

const dialogsStore = useDialogs();

const handleContactUsClick = () => {
  dialogsStore.openContactUsDialog('profile details');
};

const ACCOUNT_TAB_INFO = {
  title: 'Profile Details',
  description: 'If you have any questions, feel free to',
  ctaLabel: 'chat with us.',
};
</script>

<template>
  <DashboardTabsTopInfo
    :title="ACCOUNT_TAB_INFO.title"
    class="DashboardProfilesTopLeft dashboard-profiles-top-left"
  >
    <template #text>
      <p>
        {{ ACCOUNT_TAB_INFO.description }}
        <button
          type="button"
          class="is--link-2"
          @click="handleContactUsClick"
        >
          {{ ACCOUNT_TAB_INFO.ctaLabel }}
        </button>
      </p>
    </template>
  </DashboardTabsTopInfo>
</template>
