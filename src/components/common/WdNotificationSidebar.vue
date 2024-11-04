<script setup lang="ts">
import { useNotificationsStore } from 'InvestCommon/store';
import { ROUTE_NOTIFICATIONS } from 'InvestCommon/helpers/enums/routes';
import BaseButton from 'UiKit/components/BaseButton/BaseButton.vue';
import WdNotificationTable from 'InvestCommon/components/common/WdNotificationTable.vue';
import { storeToRefs } from 'pinia';
import { onClickOutside } from '@vueuse/core';
import { onBeforeUnmount, onMounted, ref } from 'vue';
import { blockedBody, unBlockedBody } from 'InvestCommon/helpers/blocked-body';
import { BaseSvgIcon } from 'UiKit/components/BaseSvgIcon';


const props = defineProps({
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
    class="WdNotificationSidebar wd-notification-sidebar is--no-margin"
  >
    <div class="wd-notification-sidebar__header">
      <h4>
        Notifications
        <span v-if="notificationUnreadLength">
          (+{{ notificationUnreadLength }})
        </span>
      </h4>
      <BaseButton
        size="large"
        icon-only
        variant="link"
        class="wd-notification-sidebar__close-button"
        @click="onClose"
      >
        <BaseSvgIcon
          name="close"
          alt="notification sidebar close icon"
          class="wd-notification-sidebar__close-icon"
        />
      </BaseButton>
    </div>
    <div class="wd-notification-sidebar__content">
      <WdNotificationTable
        small
        class="wd-notification-sidebar__table"
        :external="external"
      />
    </div>
    <div class="wd-notification-sidebar__bottom">
      <BaseButton
        size="large"
        variant="link"
        icon-placement="right"
        :tag="external ? 'a' : 'router-link'"
        :to="{ name: ROUTE_NOTIFICATIONS }"
        href="/notifications"
        @click="onClose"
      >
        View All
        <BaseSvgIcon
          name="arrow-right"
          class="wd-notification-sidebar__icon"
          alt="modal layout close icon"
        />
      </BaseButton>
    </div>
  </aside>
</template>

<style lang="scss" scoped>
.wd-notification-sidebar {
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
