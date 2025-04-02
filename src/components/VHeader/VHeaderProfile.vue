<script setup lang="ts">
import {
  computed, defineAsyncComponent, hydrateOnVisible, PropType,
} from 'vue';
import { useNotificationsStore } from 'InvestCommon/store/useNotifications';
import { useUsersStore } from 'InvestCommon/store/useUsers';
import VDropdown from 'UiKit/components/VDropdown.vue';
import { storeToRefs } from 'pinia';
import VAvatar from 'UiKit/components/VAvatar.vue';
import { VDropdownMenuItem } from 'UiKit/components/Base/VDropdownMenu';
import message from 'UiKit/assets/images/message.svg';
import { useDialogs } from 'InvestCommon/store/useDialogs';
import { useUserProfilesStore } from 'InvestCommon/store/useUserProfiles';
import env from 'InvestCommon/global';

const { FILER_URL } = env;

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
const useDialogsStore = useDialogs();
const { isDialogLogoutOpen } = storeToRefs(useDialogsStore);
const userProfileStore = useUserProfilesStore();
const { getUserData } = storeToRefs(userProfileStore);

const userEmail = computed(() => userAccountData.value?.email);

const onLogout = () => {
  isDialogLogoutOpen.value = true;
};
const onSidebarOpen = () => {
  if (notificationLength.value) notificationsStore.notificationSidebarOpen();
};
const imageID = computed(() => getUserData.value?.image_link_id);
</script>

<template>
  <div class="VHeaderProfile v-header-profile">
    <div class="v-header-profile__divider is--gt-tablet-show" />
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
    <VDropdown
      with-chevron
      :menu="menu"
      :content-props="{ sideOffset: 14 }"
    >
      <VAvatar
        size="small"
        :src="imageID > 0 ? `${FILER_URL}/auth/files/${imageID}?size=medium` : undefined"
        alt="avatar image"
        class="v-header-profile__avatar"
      />
      <span class="is--h6__title">
        {{ userEmail }}
      </span>
      <template #content>
        <VDropdownMenuItem
          class="v-header-profile__item"
          data-testid="header-profile-logout"
          @click="onLogout"
        >
          Log Out
        </VDropdownMenuItem>
      </template>
    </VDropdown>
  </div>
</template>

<style lang="scss">
@use 'UiKit/styles/_variables.scss' as *;
.v-header-profile {
  $root: &;

  width: fit-content;
  display: flex;
  align-items: center;
  gap: 28px;
  z-index: 0;

  @media screen and (max-width: $tablet){
    flex-direction: column;
  }

  &__dropdown {
    width: fit-content;
  }

  &__avatar {
    margin-right: 5px;
  }

  &__item {
    padding: 8px 12px;

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
