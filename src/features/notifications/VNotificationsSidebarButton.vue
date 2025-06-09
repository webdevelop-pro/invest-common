<script setup lang="ts">
import { useNotifications } from 'InvestCommon/features/notifications/store/useNotifications';
import { storeToRefs } from 'pinia';
import {
  defineAsyncComponent, hydrateOnVisible, onBeforeMount,
} from 'vue';
import message from 'UiKit/assets/images/message.svg';

const VNotificationSidebar = defineAsyncComponent({
  loader: () => import('./components/VNotificationSidebar.vue'),
  hydrate: hydrateOnVisible(),
});

defineProps({
  isStaticSite: String,
});

const notificationsStore = useNotifications();
const { notificationUnreadLength } = storeToRefs(notificationsStore);

const onSidebarOpen = () => {
  notificationsStore.onSidebarToggle(true);
};

const handleKeyDown = (event: KeyboardEvent) => {
  if (event.key === 'Enter' || event.key === ' ') {
    event.preventDefault();
    onSidebarOpen();
  }
};

onBeforeMount(() => {
  notificationsStore.loadData();
});
</script>

<template>
  <div
    class="NotificationsSidebarButton notifications-sidebar-button"
    role="button"
    tabindex="0"
    aria-label="Open notifications"
    @click="onSidebarOpen"
    @keydown="handleKeyDown"
  >
    <message
      alt="notification icon"
      class="notifications-sidebar-button__notification-icon is--gt-tablet-show"
    />
    <span class="is--h6__title is--lt-tablet-show">
      Notifications
    </span>
    <span
      v-if="notificationUnreadLength && (notificationUnreadLength > 0)"
      class="notifications-sidebar-button__notification-dot"
    />
    <VNotificationSidebar :is-static-site="isStaticSite" />
  </div>
</template>

<style lang="scss">
.notifications-sidebar-button {
    display: flex;
    align-items: center;
    position: relative;
    cursor: pointer;

  &__notification-icon {
    width: 24px;
    height: 24px;
    color: $gray-50;
  }

  &__notification-dot {
    width: 8px;
    height: 8px;
    position: absolute;
    right: -2px;
    top: -2px;
    background-color: $white;
    border-radius: 100%;
    z-index: 0;

    &::after {
      content: '';
      position: absolute;
      width: 6px;
      height: 6px;
      right: 1px;
      top: 1px;
      background-color: $primary;
      border-radius: 100%;
      z-index: 0;
    }
  }
}
</style>
