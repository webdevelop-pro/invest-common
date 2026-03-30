<script setup lang="ts">
import { computed, PropType, ref } from 'vue';
import { storeToRefs } from 'pinia';

import VDropdown from 'UiKit/components/VDropdown.vue';
import {
  DropdownMenuPortal,
  VDropdownMenuItem,
  VDropdownMenuSub,
  VDropdownMenuSubContent,
  VDropdownMenuSubTrigger,
} from 'UiKit/components/Base/VDropdownMenu';
import { useDialogs } from 'InvestCommon/domain/dialogs/store/useDialogs';
import NotificationsSidebarButton from 'InvestCommon/features/notifications/VNotificationsSidebarButton.vue';
import env from 'InvestCommon/config/env';
import LogOutIcon from 'UiKit/assets/images/menu_common/logout.svg';
import VAvatarIdentity from 'UiKit/components/VAvatarIdentity.vue';
import type { MenuItem } from 'InvestCommon/types/global';
import ProfileSwitchMenuList from 'InvestCommon/features/profiles/components/ProfileSwitchMenuList.vue';
import { useProfileSwitchMenu } from 'InvestCommon/features/profiles/composables/useProfileSwitchMenu';
import { useHeaderUser } from './useHeaderUser';
import { getProfileAvatarInitial } from './getProfileAvatarInitial';

const { IS_STATIC_SITE } = env;

defineProps({
  menu: Array as PropType<MenuItem[]>,
  showLogoutIcon: {
    type: Boolean,
    default: false,
  },
  isMobilePwa: {
    type: Boolean,
    default: false,
  },
  isDesktop: {
    type: Boolean,
    default: false,
  }
});

const { userEmail, userDisplayName } = useHeaderUser();
const { selectedProfileLabel } = useProfileSwitchMenu();

const useDialogsStore = useDialogs();
const { isDialogLogoutOpen } = storeToRefs(useDialogsStore);

const profileAvatarInitial = computed(() => getProfileAvatarInitial(selectedProfileLabel.value));
const isMenuOpen = ref(false);

const closeMenu = () => {
  isMenuOpen.value = false;
};

const onLogout = () => {
  closeMenu();
  isDialogLogoutOpen.value = true;
};
</script>

<template>
  <div class="VHeaderProfile v-header-profile">
    <div class="v-header-profile__divider is--gt-tablet-show" />
    <NotificationsSidebarButton
      :is-static-site="IS_STATIC_SITE"
      :show-icon="isMobilePwa || isDesktop"
    />
    <VDropdown
      v-model:open="isMenuOpen"
      with-chevron
      :menu="menu"
      :content-props="{ sideOffset: 14 }"
    >
      <VAvatarIdentity
        class="v-header-profile__avatar"
        size="small"
        :src="undefined"
        alt="avatar image"
        :avatar-text="profileAvatarInitial"
        :label="selectedProfileLabel"
      />

      <template #content-start>
        <div class="v-header-profile__menu-head">
          <div class="v-header-profile__menu-title is--h6__title">
            {{ userDisplayName }}
          </div>
          <div class="v-header-profile__menu-email is--small">
            {{ userEmail }}
          </div>
        </div>

        <VDropdownMenuSub>
          <VDropdownMenuSubTrigger class="v-header-profile__switch-trigger">
            <span class="v-header-profile__switch-text is--h6__title">
              Switch profile
            </span>
          </VDropdownMenuSubTrigger>
          <DropdownMenuPortal>
            <VDropdownMenuSubContent
              side="left"
              :side-offset="2"
            >
              <ProfileSwitchMenuList @select="closeMenu" />
            </VDropdownMenuSubContent>
          </DropdownMenuPortal>
        </VDropdownMenuSub>
      </template>
      <template #content>
        <VDropdownMenuItem
          class="v-header-profile__item"
          data-testid="header-profile-logout"
          @click="onLogout"
        >
          <LogOutIcon
            v-if="showLogoutIcon"
            class="v-header-profile__icon"
            aria-hidden="true"
          />
          <span class="v-header-profile__label">
            Log Out
          </span>
        </VDropdownMenuItem>
      </template>
    </VDropdown>
  </div>
</template>

<style lang="scss">
@use 'UiKit/styles/_variables.scss' as *;
@use 'UiKit/styles/_colors.scss' as colors;

.v-header-profile {
  width: fit-content;
  display: flex;
  align-items: center;
  gap: 28px;
  z-index: 0;

  @media screen and (width < $tablet){
    flex-direction: column;
  }

  &__dropdown {
    width: fit-content;
  }

  &__menu-head {
    padding: 4px 14px 12px;
  }

  &__menu-email {
    color: colors.$gray-70;
    margin-top: 2px;
    overflow-wrap: anywhere;
  }

  &__switch-trigger {
    border: 1px solid colors.$gray-20;
    border-radius: 2px;
    background: colors.$gray-10;
    padding: 12px 14px;
  }

  &__item {
    padding: 8px 12px;
    display: flex;
    align-items: center;
    gap: 12px;
    color: inherit;

    &:hover {
      background-color: colors.$gray-20;
    }

    &.router-link-active,
    &.is--active {
      color: colors.$primary;
    }
  }

  .is--active {
    color: colors.$primary;
  }

  &__icon {
    width: 18px;
    height: 18px;
    flex-shrink: 0;
    color: colors.$gray-50;

    path {
      fill: currentcolor;
    }

    path[stroke] {
      stroke: currentcolor;
    }
  }

  &__label {
    flex: 1;
  }

  &__divider {
    width: 1px;
    height: 30px;
    border-left: 1px solid colors.$gray-40;
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
    color: colors.$gray-50;
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
      top: 1px;
      background-color: colors.$primary;
      border-radius: 100%;
      z-index: 0;
    }
  }
}

.v-dropdown-menu-item.is--border-top {
  border-top: none;
}
</style>
