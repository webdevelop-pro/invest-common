<script setup lang="ts">
import { computed, PropType } from 'vue';
import { useNotificationsStore, useUsersStore } from 'InvestCommon/store';
import { useLogoutModal } from 'InvestCommon/components/modals/modals';
import VDropdown from 'UiKit/components/VDropdown/VDropdown.vue';
import { storeToRefs } from 'pinia';
import DefaultAvatar from 'InvestCommon/components/common/DefaultAvatar.vue';
import { VSvgIcon } from 'UiKit/components/VSvgIcon';

type MenuItem = {
  to?: string;
  href?: string;
  text: string;
  active?: boolean;
  children?: MenuItem[];
}

defineProps({
  menu: Array as PropType<MenuItem[]>,
})

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
      <VSvgIcon
        alt="notification icon"
        class="v-header-profile__notification-icon"
        name="message"
      />
      <span
        v-if="notificationUnreadLength && (notificationUnreadLength > 0)"
        class="v-header-profile__notification-dot"
      />
    </div>
    <VDropdown
      hover
      class="v-header-profile__dropdown"
    >
      <div class="v-header-profile__icon-wrap">
        <DefaultAvatar />
      </div>
      <span class="v-header-profile__value is--h6__title">
        {{ userEmail }}
      </span>

      <template #listItem>
        <template
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
        </template>
        <div
          class="v-header-profile__item is--h6__title"
          data-testid="header-profile-logout"
          @click="onLogout"
        >
          Log Out
        </div>
      </template>
    </VDropdown>
  </div>
</template>

<style lang="scss">
.V-dropdown {
  min-width: 80px;
  &__selected {
    min-width: 100px;
  }
}

.v-header-profile {
  $root: &;

  width: fit-content;
  display: flex;
  align-items: center;
  gap: 31px;
  z-index: 0;

  &__icon {
    width: 25px;
  }

  &__icon-wrap {
    position: relative;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 25px;
    height: 25px;
    margin-right: 7px;
  }

  &__value {
    margin-right: 9px !important;
    color: $black;
  }

  &__dropdown {
    width: fit-content;
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
