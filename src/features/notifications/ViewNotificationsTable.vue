<script setup lang="ts">
import { useGlobalLoader } from 'UiKit/store/useGlobalLoader';
import { storeToRefs } from 'pinia';
import { onBeforeMount } from 'vue';
import VSkeleton from 'UiKit/components/Base/VSkeleton/VSkeleton.vue';
import VNotificationTable from 'InvestCommon/features/notifications/components/VNotificationTable.vue';
import { useNotifications } from 'InvestCommon/features/notifications/store/useNotifications';

const globalLoader = useGlobalLoader();
globalLoader.hide();

const notificationsStore = useNotifications();
const { notificationUnreadLength, isLoading } = storeToRefs(notificationsStore);

onBeforeMount(() => {
  notificationsStore.loadData();
});
</script>

<template>
  <div class="ViewnotificationsStore view-notifications-table">
    <div class="is--container">
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
