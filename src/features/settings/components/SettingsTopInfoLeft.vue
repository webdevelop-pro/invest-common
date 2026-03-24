<script setup lang="ts">
import { computed, ref } from 'vue';
import VSkeleton from 'UiKit/components/Base/VSkeleton/VSkeleton.vue';
import { storeToRefs } from 'pinia';
import VAvatarUpload from 'InvestCommon/features/filer/VAvatarUpload.vue';
import env from 'InvestCommon/config/env';
import pen from 'UiKit/assets/images/pen.svg?component';
import VButton from 'UiKit/components/Base/VButton/VButton.vue';
import { ROUTE_SETTINGS_ACCOUNT_DETAILS } from 'InvestCommon/domain/config/enums/routes';
import { useBreakpoints } from 'UiKit/composables/useBreakpoints';
import { useSessionStore } from 'InvestCommon/domain/session/store/useSession';
import { useRepositoryProfiles } from 'InvestCommon/data/profiles/profiles.repository';
import { useProfilesStore } from 'InvestCommon/domain/profiles/store/useProfiles';
import { reportError } from 'InvestCommon/domain/error/errorReporting';
import { useFilerNotificationRefresh } from 'InvestCommon/domain/filer/useFilerNotificationRefresh';

const { FILER_URL } = env;

const userSessionStore = useSessionStore();
const { userSessionTraits } = storeToRefs(userSessionStore);
const useRepositoryProfilesStore = useRepositoryProfiles();
const { getUserState } = storeToRefs(useRepositoryProfilesStore);
const { isTablet } = useBreakpoints();
const profilesStore = useProfilesStore();
const { selectedUserProfileId } = storeToRefs(profilesStore);

const isLoading = computed(() => getUserState.value.loading);
const imageID = computed(() => Number(getUserState.value.data?.image_link_id || 0));
const isAvatarLoading = ref(false);
const avatarLoadingState = computed(() => isLoading.value || isAvatarLoading.value);

useFilerNotificationRefresh({
  delayMs: 3000,
  enabled: computed(() => !getUserState.value.loading && !isAvatarLoading.value),
  match: (fields) => fields.type !== 'file_thumbnail',
  refresh: () => useRepositoryProfilesStore.getUser(),
  refreshErrorMessage: 'Failed to refresh user data',
});

const {
  clearPendingRefresh: clearAvatarNotificationRefresh,
  scheduleFallbackRefresh,
} = useFilerNotificationRefresh({
  enabled: isAvatarLoading,
  fallbackMs: 5000,
  match: (fields) => fields.type === 'file_thumbnail',
  refresh: () => useRepositoryProfilesStore.getUser(),
  refreshErrorMessage: 'Failed to refresh avatar after thumbnail generation',
  fallbackErrorMessage: 'Failed to refresh avatar after upload',
  onSettled: () => {
    isAvatarLoading.value = false;
  },
});

const finishAvatarRefresh = () => {
  clearAvatarNotificationRefresh();
  isAvatarLoading.value = false;
};

const onUploadId = async (id: string) => {
  isAvatarLoading.value = true;

  const body = {
    image_link_id: id,
  };

  try {
    await useRepositoryProfilesStore.updateUserData(body as Record<string, unknown>);
    await useRepositoryProfilesStore.getUser();
    scheduleFallbackRefresh();
  } catch (error) {
    reportError(error, 'Failed to update avatar');
    finishAvatarRefresh();
  }
};
</script>

<template>
  <div class="SettingsTopInfoLeft settings-top-info-left">
    <VAvatarUpload
      size="x-large"
      :src="imageID > 0 ? `${FILER_URL}/auth/files/${imageID}?size=medium` : undefined"
      :user-id="selectedUserProfileId"
      :image-id="imageID"
      :loading="avatarLoadingState"
      alt="avatar image"
      class="settings-top-info-left__avatar is--gt-tablet-show"
      @upload-id="onUploadId"
    />
    <div class="settings-top-info-left__data">
      <VSkeleton
        v-if="isLoading"
        height="18px"
        width="400px"
      />
      <span
        v-else-if="getUserState.data?.created_at"
        class="is--small is--color-gray-80 settings-top-info-left__date"
      >
        User since {{ getUserState.data?.createdAtFormattedShortMonth }}
      </span>

      <VSkeleton
        v-if="isLoading"
        height="75px"
        width="400px"
      />
      <h1 v-else>
        {{ getUserState.data?.fullName }}
      </h1>

      <VSkeleton
        v-if="isLoading"
        height="30px"
        width="400px"
      />
      <div
        v-else
        class="settings-top-info-left__info"
      >
        <span
          class="is--color-gray-60"
          :class="{
            'is--color-black': userSessionTraits?.email,
            'is--subheading-2': !isTablet
          }"
        >
          {{ userSessionTraits?.email }}
        </span>
        <span
          v-if="getUserState.data?.phone"
          class="is--gt-desktop-lg-show"
        >|</span>
        <span
          v-if="getUserState.data?.phone"
          class="is--color-gray-60"
          :class="{
            'is--color-black': getUserState.data?.phone,
            'is--subheading-2': !isTablet
          }"
        >
          {{ getUserState.data?.phoneFormatted || '+1 (___) ___ - ____' }}
        </span>
      </div>
    </div>
    <VButton
      size="small"
      variant="link"
      as="router-link"
      :to="{ name: ROUTE_SETTINGS_ACCOUNT_DETAILS }"
    >
      <pen
        alt="edit icon"
      />
      Edit
    </VButton>
  </div>
</template>

<style lang="scss">
@use 'UiKit/styles/_variables.scss' as *;

.settings-top-info-left {
  display: flex;
  gap: 20px;
  align-items: flex-start;

  @media screen and (max-width: $tablet-xs) {
      flex-direction: column;
      align-items: flex-start;
      word-break: break-all;
    }

  &__date {
    opacity: 0.8;
  }

  &__data {
    display: flex;
    gap: 8px;
    flex-direction: column;
  }

  &__info {
    display: flex;
    gap: 16px;
    align-items: center;
    color: $gray-40;

    @media screen and (max-width: $desktop-lg) {
      flex-direction: column;
      align-items: flex-start;
      word-break: break-all;
    }
  }

  .v-avatar {
    @media screen and (max-width: $tablet) {
      max-width: 30px;
      max-height: 30px;
    }
  }
}
</style>
