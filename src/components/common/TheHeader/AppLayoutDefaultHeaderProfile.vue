<script setup lang="ts">
import { computed, PropType } from 'vue';
import { useNotificationsStore, useUsersStore } from 'InvestCommon/store';
import { useLogoutModal } from 'InvestCommon/components/modals/modals';
import BaseDropdown from 'UiKit/components/BaseDropdown/BaseDropdown.vue';
import { storeToRefs } from 'pinia';
import DefaultAvatar from 'InvestCommon/components/common/DefaultAvatar.vue';
import { BaseSvgIcon } from 'UiKit/components/BaseSvgIcon';

type MenuItem = {
  to?: string;
  href?: string;
  text: string;
  children?: MenuItem[];
}

defineProps({
  menu: Array as PropType<MenuItem[]>,
})

const usersStore = useUsersStore();
const { userAccountData, selectedUserProfileId } = storeToRefs(usersStore);
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
</script>

<template>
  <div class="AppLayoutDefaultHeaderProfile app-layout-default-header-profile">
    <div class="app-layout-default-header-profile__divider" />
    <div
      class="app-layout-default-header-profile__notification"
      data-testid="header-profile"
      @click="onSidebarOpen"
    >
      <BaseSvgIcon
        alt="notification icon"
        class="app-layout-default-header-profile__notification-icon"
        name="message"
      />
      <span
        v-if="notificationUnreadLength && (notificationUnreadLength > 0)"
        class="app-layout-default-header-profile__notification-dot"
      />
    </div>
    <BaseDropdown
      hover
      class="app-layout-default-header-profile__dropdown"
    >
      <div class="app-layout-default-header-profile__icon-wrap">
        <DefaultAvatar />
      </div>
      <span class="app-layout-default-header-profile__value is--h6__title">
        {{ userEmail }}
      </span>

      <template #listItem>
        <template
          v-for="menuItem in menu"
          :key="menuItem.text"
        >
          <router-link
            v-if="menuItem.to"
            :to="menuItem.to"
            class="app-layout-default-header-profile__item is--h6__title"
          >
            {{ menuItem.text }}
          </router-link>
          <a
            v-if="menuItem.href"
            :href="menuItem.href"
            class="app-layout-default-header-profile__item is--h6__title"
          >
          {{ menuItem.text }}
          </a>
        </template>
        <div
          class="app-layout-default-header-profile__item is--h6__title"
          data-testid="header-profile-logout"
          @click="onLogout"
        >
          Log Out
        </div>
      </template>
    </BaseDropdown>
  </div>
</template>

<style lang="scss">
.base-dropdown {
  min-width: 80px;
  &__selected {
    min-width: 100px;
  }
}

.app-layout-default-header-profile {
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
    margin-right: 9px;
    color: $black;
  }

  &__dropdown {
    width: fit-content;
  }

  &__item {
    display: block;
    color: $black;
    width: 100%;
    padding: 8px 12px;
    cursor: pointer;

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
