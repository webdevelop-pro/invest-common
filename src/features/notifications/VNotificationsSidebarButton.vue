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
      class="notifications-sidebar-button__notification-icon"
    />
    <span class="notifications-sidebar-button__label is--h6__title">
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
@use 'UiKit/styles/_colors.scss' as colors;
@use 'UiKit/styles/_variables.scss' as variables;

.notifications-sidebar-button {
    display: flex;
    align-items: center;
    position: relative;
    cursor: pointer;
    padding: 12px 0;

  &__notification-icon {
    width: 20px;
    height: 20px;
    color: colors.$gray-50;
    flex-shrink: 0;
    // margin: 5px 0;

    path {
      fill: currentcolor;
    }

    path[stroke] {
      stroke: currentcolor;
    }
  }

  &__label {
    display: none;
    margin-left: 12px;

    @media screen and (max-width: variables.$desktop-md) {
      display: inline-flex;
      align-items: center;
    }
  }

  &__notification-dot {
    width: 8px;
    height: 8px;
    position: absolute;
    right: -2px;
    top: -2px;
    background-color: colors.$white;
    border-radius: 100%;
    z-index: 0;

    &::after {
      content: '';
      position: absolute;
      width: 6px;
      height: 6px;
      right: 1px;
      top: 12px;
      background-color: colors.$primary;
      border-radius: 100%;
      z-index: 0;
    }

    @media screen and (max-width: variables.$desktop-md) {
      right: auto;
      left: 16px;
    }
  }
}
</style>
