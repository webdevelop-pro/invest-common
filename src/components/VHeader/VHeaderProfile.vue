<script setup lang="ts">
import { computed, PropType } from 'vue';
import { useNotificationsStore } from 'InvestCommon/store/useNotifications';
import { useUsersStore } from 'InvestCommon/store/useUsers';
import { useLogoutModal } from 'InvestCommon/components/modals/modals';
import VDropdown from 'UiKit/components/VDropdown.vue';
import { storeToRefs } from 'pinia';
import VAvatar from 'UiKit/components/VAvatar.vue';
import {
  VDropdownMenu, VDropdownMenuTrigger, VDropdownMenuContent, VDropdownMenuItem,
} from 'UiKit/components/Base/VDropdownMenu';
import message from 'UiKit/assets/images/message.svg';

type MenuItem = {
  to?: string;
  href?: string;
  text: string;
  active?: boolean;
  children?: MenuItem[];
}

defineProps({
  menu: Array as PropType<MenuItem[]>,
});

const usersStore = useUsersStore();
const { userAccountData } = storeToRefs(usersStore);
const notificationsStore = useNotificationsStore();
const { notificationLength, notificationUnreadLength } = storeToRefs(notificationsStore);
const logoutModal = useLogoutModal();

const userEmail = computed(() => userAccountData.value?.email);

const onLogout = () => {
  // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
  void logoutModal.show({});
};
const onSidebarOpen = () => {
  if (notificationLength.value) notificationsStore.notificationSidebarOpen();
};


const getComponentName = (item: MenuItem) => {
  if (item.to) return 'router-link';
  if (item.href) return 'a';
  return 'div';
};
const getComponentClass = (item: MenuItem) => {
  if (item.to || item.href) return 'v-header-profile__item';
  return 'v-header-profile__item-not-link';
};
</script>

<template>
  <div class="VHeaderProfile v-header-profile">
    <div class="v-header-profile__divider" />
    <div
      class="v-header-profile__notification"
      data-testid="header-profile"
      @click="onSidebarOpen"
    >
      <message
        alt="notification icon"
        class="v-header-profile__notification-icon"
      />
      <span
        v-if="notificationUnreadLength && (notificationUnreadLength > 0)"
        class="v-header-profile__notification-dot"
      />
    </div>
    <VDropdownMenu>
      <VDropdownMenuTrigger>
        <VAvatar
          size="small"
          src=""
          alt="avatar image"
          class="v-header-profile__avatar"
        />
        <span class="is--h6__title">
          {{ userEmail }}
        </span>
      </VDropdownMenuTrigger>

      <VDropdownMenuContent>
        <VDropdownMenuItem
          v-for="menuItem in menu"
          :key="menuItem.text"
        >
          <component
            :is="getComponentName(menuItem)"
            :href="menuItem.href"
            :to="menuItem.to"
            class="is--h6__title"
            :class="[getComponentClass(menuItem), { 'is--active': menuItem.active }]"
          >
            {{ menuItem.text }}
          </component>
        </VDropdownMenuItem>
        <VDropdownMenuItem
          class="v-header-profile__item is--h6__title"
          data-testid="header-profile-logout"
          @click="onLogout"
        >
          Log Out
        </VDropdownMenuItem>
      </VDropdownMenuContent>
    </VDropdownMenu>
  </div>
</template>

<style lang="scss">
.v-header-profile {
  $root: &;

  width: fit-content;
  display: flex;
  align-items: center;
  gap: 28px;
  z-index: 0;

  &__dropdown {
    width: fit-content;
  }

  &__avatar {
    margin-right: 5px;
  }

   & &__item {
    display: block;
    color: $black;
    width: 100%;
    padding: 8px 12px;
    cursor: pointer;
    text-decoration: none;

    &:hover {
      background-color: $gray-20;
    }

    &.router-link-active {
      color: $primary;
    }
  }

  &__divider {
    width: 1px;
    height: 30px;
    border-left: 1px solid $gray-40;
  }

  &__notification {
    display: flex;
    align-items: center;
    position: relative;
    cursor: pointer;
  }

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
