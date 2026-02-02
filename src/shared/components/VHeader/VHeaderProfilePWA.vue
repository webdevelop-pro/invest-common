<script setup lang="ts">
import { computed, ref } from 'vue';
import { storeToRefs } from 'pinia';
import VAvatar from 'UiKit/components/VAvatar.vue';
import env from 'InvestCommon/domain/config/env';
import { useSessionStore } from 'InvestCommon/domain/session/store/useSession';
import { useRepositoryProfiles } from 'InvestCommon/data/profiles/profiles.repository';
import { useProfilesStore } from 'InvestCommon/domain/profiles/store/useProfiles';
import { useRepositoryFiler } from 'InvestCommon/data/filer/filer.repository';
import { useDialogs } from 'InvestCommon/domain/dialogs/store/useDialogs';
import {
  urlContactUs,
  urlFaq,
  urlSettingsAccountDetails,
  urlSettingsMfa,
  urlSettingsSecurity,
} from 'InvestCommon/domain/config/links';
import VHeaderProfileOverlayPWA from 'InvestCommon/shared/components/pwa/VHeaderProfileOverlayPWA.vue';

const { FILER_URL } = env;

const userSessionStore = useSessionStore();
const { userSessionTraits } = storeToRefs(userSessionStore);

const useRepositoryProfilesStore = useRepositoryProfiles();
const { getUserState } = storeToRefs(useRepositoryProfilesStore);
const profilesStore = useProfilesStore();
const { selectedUserProfileId } = storeToRefs(profilesStore);
const filerRepository = useRepositoryFiler();
const { postSignurlState } = storeToRefs(filerRepository);
const dialogsStore = useDialogs();
const { isDialogLogoutOpen } = storeToRefs(dialogsStore);

const userEmail = computed(() => userSessionTraits.value?.email);
const imageID = computed(() => getUserState.value.data?.image_link_id);
const avatarSrc = computed(() => (
  imageID.value > 0 ? `${FILER_URL}/auth/files/${imageID.value}?size=small` : undefined
));
const userId = computed(() => getUserState.value.data?.id);
const getProfileId = computed(() => Number(selectedUserProfileId.value));

const toPathname = (url: string) => {
  try {
    return new URL(url, window.location.origin).pathname;
  } catch {
    return url;
  }
};

const accountDetailsPath = computed(() => (
  Number.isFinite(getProfileId.value) ? urlSettingsAccountDetails(getProfileId.value) : ''
));
const mfaPath = computed(() => (
  Number.isFinite(getProfileId.value) ? urlSettingsMfa(getProfileId.value) : ''
));
const securityPath = computed(() => (
  Number.isFinite(getProfileId.value) ? urlSettingsSecurity(getProfileId.value) : ''
));
const helpCenterPath = computed(() => toPathname(urlFaq));
const contactUsPath = computed(() => toPathname(urlContactUs));

const refFiles = ref<HTMLInputElement>();
const isAvatarLoading = ref(false);
const isProfileOverlayOpen = ref(false);

const onAvatarClick = () => {
  refFiles.value?.click();
};

const onFileChange = async () => {
  const fileList = refFiles.value?.files;
  const file = fileList && fileList.length ? fileList[0] : undefined;
  const userId = Number(getUserState.value.data?.id);
  if (!file || !Number.isFinite(userId)) {
    return;
  }

  isAvatarLoading.value = true;
  await filerRepository.uploadHandler(file, userId, 'user', userId);
  const uploadedId = postSignurlState.value.data?.meta?.id;
  if (uploadedId) {
    await useRepositoryProfilesStore.updateUserData(userId, { image_link_id: uploadedId });
    await useRepositoryProfilesStore.getUser();
  }
  isAvatarLoading.value = false;
};

const openProfileOverlay = () => {
  isProfileOverlayOpen.value = true;
  if (typeof document !== 'undefined') {
    document.body?.classList.add('pwa-profile-overlay-open');
  }
};

const closeProfileOverlay = () => {
  isProfileOverlayOpen.value = false;
  if (typeof document !== 'undefined') {
    document.body?.classList.remove('pwa-profile-overlay-open');
  }
};

const onLogout = () => {
  isDialogLogoutOpen.value = true;
};
</script>

<template>
  <div class="VHeaderProfilePWA v-header-profile-pwa">
    <button
      type="button"
      class="v-header-profile-pwa__avatar-btn"
      :class="{ 'is--loading': isAvatarLoading }"
      @click="onAvatarClick"
    >
      <VAvatar
        size="small"
        :src="avatarSrc"
        alt="avatar image"
        class="v-header-profile-pwa__avatar"
      />
    </button>
    <input
      ref="refFiles"
      name="file"
      type="file"
      accept="image/png, image/jpeg, image/jpg"
      hidden
      @change="onFileChange"
    >
    <button
      type="button"
      class="v-header-profile-pwa__email is--h6__title"
      @click="openProfileOverlay"
    >
      {{ userEmail }}
    </button>

    <VHeaderProfileOverlayPWA
      v-if="isProfileOverlayOpen"
      :email="userEmail"
      :avatar-src="avatarSrc"
      :account-details-href="accountDetailsPath"
      :mfa-href="mfaPath"
      :security-href="securityPath"
      :help-href="helpCenterPath"
      :contact-href="contactUsPath"
      @close="closeProfileOverlay"
      @logout="onLogout"
    />
  </div>
</template>

<style lang="scss">
@use 'UiKit/styles/_variables.scss' as *;

.v-header-profile-pwa {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  width: fit-content;
  z-index: 0;

  &__avatar {
    margin-right: 0;
  }

  &__avatar-btn,
  &__email {
    border: none;
    background: transparent;
    padding: 0;
    cursor: pointer;
  }

  &__avatar-btn.is--loading {
    opacity: 0.6;
    pointer-events: none;
  }

}

body.pwa-profile-overlay-open .pwamenu {
  display: none;
}
</style>
