<script setup lang="ts">
import { useGlobalLoader } from 'UiKit/store/useGlobalLoader';
import VPageTopInfoAndTabs from 'InvestCommon/components/VPageTopInfoAndTabs.vue';
import { computed, PropType } from 'vue'
import { ROUTE_SETTINGS_MFA, ROUTE_SETTINGS_SECURITY } from 'InvestCommon/helpers/enums/routes';
import { VTabsContent } from 'UiKit/components/Base/VTabs';
import SettingsTopInfoLeft from './components/SettingsTopInfoLeft.vue';
import SettingsSecurity from './components/SettingsSecurity.vue';
import SettingsMfa from './components/SettingsMfa.vue';
import { SettingsTabTypes } from './utils';

const globalLoader = useGlobalLoader();
globalLoader.hide();

defineProps({
  tab: {
    type: String as PropType<SettingsTabTypes>,
    required: true,
  },
});

const tabs = computed(() => ({
  [SettingsTabTypes.mfa]: {
    value: SettingsTabTypes.mfa,
    label: 'MFA & Password',
    to: {
      name: ROUTE_SETTINGS_MFA,
    },
  },
  [SettingsTabTypes.security]: {
    value: SettingsTabTypes.security,
    label: 'Account Security',
    to: {
      name: ROUTE_SETTINGS_SECURITY,
    },
  },
}) as const);
</script>

<template>
  <VPageTopInfoAndTabs
    :tab="tab"
    :tabs="tabs"
    class="ViewSettings view-settings is--no-margin"
  >
    <template #top-info>
      <div class="view-settings__top-info">
        <SettingsTopInfoLeft />
        <!-- <VFormSettingsSocial /> -->
      </div>
    </template>
    <template #tabs-content>
      <VTabsContent
        :value="tabs.mfa.value"
      >
        <SettingsMfa />
      </VTabsContent>
      <VTabsContent
        :value="tabs.security.value"
      >
        <SettingsSecurity />
      </VTabsContent>
    </template>
  </VPageTopInfoAndTabs>
</template>

<style lang="scss">
@use 'UiKit/styles/_variables.scss' as *;

.view-settings {
  &__top-info {
    display: flex;
    justify-content: space-between;
    gap: 80px;

    @media screen and (max-width: $desktop) {
      flex-direction: column;
      gap: 40px;
    }
  }
}
</style>
