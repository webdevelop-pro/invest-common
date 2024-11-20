<script setup lang="ts">
import { useNotificationsStore } from 'InvestCommon/store/useNotifications';
import { ROUTE_NOTIFICATIONS } from 'InvestCommon/helpers/enums/routes';
import VButton from 'UiKit/components/VButton/VButton.vue';
import WdNotificationTable from 'InvestCommon/components/VNotification/VNotificationTable.vue';
import { storeToRefs } from 'pinia';
import { onClickOutside } from '@vueuse/core';
import { onBeforeUnmount, onMounted, ref } from 'vue';
import { blockedBody, unBlockedBody } from 'InvestCommon/helpers/blocked-body';
import { VSvgIcon } from 'UiKit/components/VSvgIcon';


defineProps({
  external: Boolean, // is the component external and nee links instead of router
});

const target = ref(null);
const notificationsStore = useNotificationsStore();
const { notificationUnreadLength } = storeToRefs(notificationsStore);

const onClose = () => {
  void notificationsStore.notificationSidebarClose();
};

onClickOutside(target, () => {
  onClose();
});

onMounted(() => blockedBody());
onBeforeUnmount(() => unBlockedBody());
</script>
<template>
  <aside
    ref="target"
    class="VNotificationSidebar v-notification-sidebar is--no-margin"
  >
    <div class="v-notification-sidebar__header">
      <h4>
        Notifications
        <span v-if="notificationUnreadLength">
          (+{{ notificationUnreadLength }})
        </span>
      </h4>
      <VButton
        size="large"
        icon-only
        variant="link"
        class="v-notification-sidebar__close-button"
        @click="onClose"
      >
        <VSvgIcon
          name="close"
          alt="notification sidebar close icon"
          class="v-notification-sidebar__close-icon"
        />
      </VButton>
    </div>
    <div class="v-notification-sidebar__content">
      <WdNotificationTable
        small
        class="v-notification-sidebar__table"
        :external="external"
      />
    </div>
    <div class="v-notification-sidebar__bottom">
      <VButton
        size="large"
        variant="link"
        icon-placement="right"
        :tag="external ? 'a' : 'router-link'"
        :to="{ name: ROUTE_NOTIFICATIONS }"
        href="/notifications"
        @click="onClose"
      >
        View All
        <VSvgIcon
          name="arrow-right"
          class="v-notification-sidebar__icon"
          alt="modal layout close icon"
        />
      </VButton>
    </div>
  </aside>
</template>

<style lang="scss">
.v-notification-sidebar {
  position: fixed;
  right: 0;
  top: 0;
  height: 100%;
  z-index: 109;
  width: 100%;
  max-width: 700px;
  background: $white;
  box-shadow: $box-shadow-medium;

  &__header {
    display: flex;
    height: 65px;
    padding: 0 8px 0 20px;
    justify-content: space-between;
    align-items: center;
    box-shadow: $box-shadow-small;
    color: $black;
  }

  &__content {
    padding: 28px 20px 20px 20px;
    max-height: calc(100% - 65px - 80px);
    height: 100%;
  }

  &__table {
    height: 100%;
  }

  &__bottom {
    position: absolute;
    bottom: 0;
    left: 0;
    width: 100%;
    display: flex;
    height: 80px;
    padding: 16px 40px;
    justify-content: center;
    align-items: flex-start;
    gap: 4px;
    align-self: stretch;
    border-top: 1px solid $gray-20;
    background-color: $white;
  }

  &__icon {
    width: 20px;
  }

  &__close-icon {
    width: 20px;
  }
}
</style>
