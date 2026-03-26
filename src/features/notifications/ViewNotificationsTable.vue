<script setup lang="ts">
import { useGlobalLoader } from 'UiKit/store/useGlobalLoader';
import { storeToRefs } from 'pinia';
import { computed, onBeforeMount } from 'vue';
import VSkeleton from 'UiKit/components/Base/VSkeleton/VSkeleton.vue';
import VNotificationTable from 'InvestCommon/features/notifications/components/VNotificationTable.vue';
import { useNotifications } from 'InvestCommon/features/notifications/store/useNotifications';
import VOfflineDataUnavailable from 'InvestCommon/shared/components/pwa/VOfflineDataUnavailable.vue';
import { isOfflineReadFailure } from 'InvestCommon/domain/pwa/offlineRead';
import { urlOffers } from 'InvestCommon/domain/config/links';

const globalLoader = useGlobalLoader();
globalLoader.hide();

const notificationsStore = useNotifications();
const { notificationUnreadLength, isLoading, tableData, getAllState } = storeToRefs(notificationsStore);
const shouldShowOfflineUnavailable = computed(() => (
  !isLoading.value
  && tableData.value.length === 0
  && isOfflineReadFailure(getAllState.value.error)
));

onBeforeMount(() => {
  notificationsStore.loadData();
});
</script>

<template>
  <div class="ViewnotificationsStore view-notifications-table">
    <div class="is--container">
      <VOfflineDataUnavailable
        v-if="shouldShowOfflineUnavailable"
        title="Notifications unavailable offline"
        description="Notifications have not been cached on this device yet. Reconnect to load the latest updates, or return to a page you already opened. The app stays in read-only mode while you are offline."
        :primary-action="{ label: 'Explore Offers', href: urlOffers }"
      />
      <template v-else>
        <h1 class="view-notifications-table__title">
          <span class="view-notifications-table__title-text">Notifications</span>
          <VSkeleton
            v-if="isLoading"
            height="69px"
            width="94px"
          />
          <span
            v-else-if="notificationUnreadLength"
            class="view-notifications-table__title-count"
          >
            (+{{ notificationUnreadLength }})
          </span>
        </h1>
        <p class="view-notifications-table__text is--small">
          Notifications are essential to help us to stay connected and informed, especially in today's
          fast-paced world where there is so much information to process. They allow us to receive timely
          updates and reminders about investments, offer updates, messages, or other important information
          that we might otherwise miss.
        </p>
        <VNotificationTable />
      </template>
    </div>
  </div>
</template>

<style lang="scss">
.view-notifications-table {
  width: 100%;
  margin: 40px 0 130px;
  padding-top: $header-height;

  @include media-lte(tablet) {
    margin: 40px 0 100px;
  }

  &__title {
    color: $black;
    margin-bottom: 4px;
    display: flex;
    align-items: center;
    gap: 8px;
    flex-wrap: wrap;
    min-width: 0;
    max-width: 100%;
  }

  &__text {
    color: $gray-80;
    margin-bottom: 40px;
  }
}
</style>
