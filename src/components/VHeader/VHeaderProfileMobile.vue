<script setup lang="ts">
import { computed, PropType } from 'vue';
import { useNotificationsStore } from 'InvestCommon/store/useNotifications';
import { useUsersStore } from 'InvestCommon/store/useUsers';
import { useDialogs } from 'InvestCommon/store/useDialogs';
import { storeToRefs } from 'pinia';
import {
  VNavigationMenuList, VNavigationMenuItem, VNavigationMenuLink, VNavigationMenu,
} from 'UiKit/components/Base/VNavigationMenu';
import VAvatar from 'UiKit/components/VAvatar.vue';

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

const emit = defineEmits(['click']);

const usersStore = useUsersStore();
const { userAccountData } = storeToRefs(usersStore);
const notificationsStore = useNotificationsStore();
const { notificationLength, notificationUnreadLength } = storeToRefs(notificationsStore);
const useDialogsStore = useDialogs();
const { isDialogLogoutOpen } = storeToRefs(useDialogsStore);

const userEmail = computed(() => userAccountData.value?.email);

const onClick = () => {
  emit('click');
};

const onLogout = () => {
  isDialogLogoutOpen.value = true;
  onClick();
};
const onSidebarOpen = () => {
  onClick();
  if (notificationLength.value) notificationsStore.notificationSidebarOpen();
};

const getComponentName = (item: MenuItem) => {
  if (item.to) return 'router-link';
  if (item.href) return 'a';
  return 'div';
};
</script>

<template>
  <VNavigationMenu
    orientation="vertical"
    class="VHeaderProfileMobile v-header-profile-mobile"
  >
    <VNavigationMenuList>
      <VNavigationMenuItem>
        <div class="is--h6__title">
          <VAvatar
            size="small"
            src=""
            alt="avatar image"
            class="v-header-profile-mobile__avatar"
          />
          {{ userEmail }}
        </div>
      </VNavigationMenuItem>
      <VNavigationMenuItem>
        <div
          class="v-header-profile-mobile__notification is--h6__title"
          data-testid="header-profile"
          @click="onSidebarOpen"
        >
          Notifications
          <span
            v-if="notificationUnreadLength && (notificationUnreadLength > 0)"
            class="v-header-profile-mobile__notification-dot"
          />
        </div>
      </VNavigationMenuItem>
      <VNavigationMenuItem
        v-for="(menuItem, index) in menu"
        :id="index"
        :key="JSON.stringify(menuItem)"
        @click="onClick"
      >
        <VNavigationMenuLink
          as-child
        >
          <component
            :is="getComponentName(menuItem)"
            :to="menuItem.to"
            :href="menuItem.href"
          >
            {{ menuItem.text }}
          </component>
        </VNavigationMenuLink>
      </VNavigationMenuItem>
      <VNavigationMenuItem
        data-testid="header-profile-logout"
        @click="onLogout"
      >
        <VNavigationMenuLink>
          Log Out
        </VNavigationMenuLink>
      </VNavigationMenuItem>
    </VNavigationMenuList>
  </VNavigationMenu>
</template>

<style lang="scss">
.v-header-profile-mobile {
  $root: &;

  width: 100%;
  display: flex;
  align-items: center;
  gap: 28px;
  z-index: 0;
  flex-direction: column;

  & > div {
    width: 100%;
  }

  &__avatar {
    margin-right: 5px;
  }

  &__notification {
    position: relative;
    cursor: pointer;
  }

  &__notification-dot {
    width: 8px;
    height: 8px;
    position: absolute;
    right: -8px;
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
