<script setup lang="ts">
import { useNotifications } from 'InvestCommon/features/notifications/store/useNotifications';
import { ROUTE_NOTIFICATIONS } from 'InvestCommon/helpers/enums/routes';
import VButton from 'UiKit/components/Base/VButton/VButton.vue';
import { storeToRefs } from 'pinia';
import arrowRight from 'UiKit/assets/images/arrow-right.svg';
import {
  VSheet, VSheetContent, VSheetHeader, VSheetTitle,
  VSheetFooter,
} from 'UiKit/components/Base/VSheet';
import { defineAsyncComponent } from 'vue';
import { urlNotifications } from 'InvestCommon/global/links';

const WdNotificationTable = defineAsyncComponent({
  loader: () => import('./VNotificationTable.vue'),
});

defineProps({
  isStaticSite: String,
});

const notificationsStore = useNotifications();
const { notificationUnreadLength, isSidebarOpen } = storeToRefs(notificationsStore);

const onClose = () => {
  notificationsStore.onSidebarToggle(false);
};
</script>
<template>
  <VSheet
    v-model:open="isSidebarOpen"
    class="VNotificationSidebar v-notification-sidebar"
  >
    <VSheetContent
      :aria-describedby="undefined"
      class="v-notification-sidebar__content"
    >
      <VSheetHeader class="v-notification-sidebar__header">
        <VSheetTitle>
          Notifications
          <span v-if="notificationUnreadLength">
            (+{{ notificationUnreadLength }})
          </span>
        </VSheetTitle>
      </VSheetHeader>
      <div class="v-notification-sidebar__text">
        <WdNotificationTable
          v-if="isSidebarOpen"
          small
          class="v-notification-sidebar__table"
          :is-static-site="isStaticSite"
        />
      </div>
      <VSheetFooter class="v-notification-sidebar__bottom">
        <VButton
          size="large"
          variant="link"
          :as="+isStaticSite ? 'a' : 'router-link'"
          :to="{ name: ROUTE_NOTIFICATIONS }"
          :href="urlNotifications"
          @click="onClose"
        >
          View All
          <arrowRight
            class="v-notification-sidebar__icon"
            alt="modal layout close icon"
          />
        </VButton>
      </VSheetFooter>
    </VSheetContent>
  </VSheet>
</template>

<style lang="scss">
@use 'UiKit/styles/_variables.scss' as *;
.v-notification-sidebar {

  &__header {
    box-shadow: $box-shadow-small;
    color: $black;
  }

  &__content {
    max-width: 700px !important;
    z-index: 101;

    .wd-notification-table__toolbar-left {
      flex-wrap: initial;
      @media screen and (max-width: $tablet){
        flex-wrap: wrap;
      }
    }
  }
  &__text {
    padding: 28px 20px 20px 20px;
    max-height: calc(100vh - 65px - 80px);
    height: 100%;
    overflow-y: auto;
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
}
</style>
