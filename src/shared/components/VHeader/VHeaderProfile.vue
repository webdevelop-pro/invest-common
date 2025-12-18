<script setup lang="ts">
import { computed, PropType } from 'vue';
import VDropdown from 'UiKit/components/VDropdown.vue';
import { storeToRefs } from 'pinia';
import VAvatar from 'UiKit/components/VAvatar.vue';
import { VDropdownMenuItem } from 'UiKit/components/Base/VDropdownMenu';
import { useDialogs } from 'InvestCommon/domain/dialogs/store/useDialogs';
import NotificationsSidebarButton from 'InvestCommon/features/notifications/VNotificationsSidebarButton.vue';
import env from 'InvestCommon/domain/config/env';
import { useSessionStore } from 'InvestCommon/domain/session/store/useSession';
import { useRepositoryProfiles } from 'InvestCommon/data/profiles/profiles.repository';
import LogOutIcon from 'UiKit/assets/images/menu_common/logout.svg';
import type { MenuItem } from 'InvestCommon/types/global';

const { IS_STATIC_SITE, FILER_URL } = env;

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

const userSessionStore = useSessionStore();
const { userSessionTraits } = storeToRefs(userSessionStore);
const useDialogsStore = useDialogs();
const { isDialogLogoutOpen } = storeToRefs(useDialogsStore);

const useRepositoryProfilesStore = useRepositoryProfiles();
const { getUserState } = storeToRefs(useRepositoryProfilesStore);

const userEmail = computed(() => userSessionTraits.value?.email);

const onLogout = () => {
  isDialogLogoutOpen.value = true;
};
const imageID = computed(() => getUserState.value.data?.image_link_id);
</script>

<template>
  <div class="VHeaderProfile v-header-profile">
    <div class="v-header-profile__divider is--gt-tablet-show" />
    <NotificationsSidebarButton
      :is-static-site="IS_STATIC_SITE"
      :show-icon="isMobilePwa || isDesktop"
    />
    <VDropdown
      with-chevron
      :menu="menu"
      :content-props="{ sideOffset: 14 }"
    >
      <VAvatar
        size="small"
        :src="imageID > 0 ? `${FILER_URL}/auth/files/${imageID}?size=small` : undefined"
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
  $root: &;

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

  &__avatar {
    margin-right: 5px;
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
