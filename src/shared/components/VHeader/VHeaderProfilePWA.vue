<script setup lang="ts">
import {
  computed, onMounted, onUnmounted, ref,
} from 'vue';
import { storeToRefs } from 'pinia';
import VAvatar from 'UiKit/components/VAvatar.vue';
import { useRepositoryProfiles } from 'InvestCommon/data/profiles/profiles.repository';
import { useProfilesStore } from 'InvestCommon/domain/profiles/store/useProfiles';
import { useRepositoryFiler } from 'InvestCommon/data/filer/filer.repository';
import { useDialogs } from 'InvestCommon/domain/dialogs/store/useDialogs';
import { reportError } from 'InvestCommon/domain/error/errorReporting';
import {
  urlContactUs,
  urlFaq,
  urlHowItWorks,
  urlSettingsAccountDetails,
  urlSettingsMfa,
  urlSettingsSecurity,
} from 'InvestCommon/domain/config/links';
import VHeaderProfileOverlayPWA from 'InvestCommon/shared/components/pwa/VHeaderProfileOverlayPWA.vue';
import { useHeaderUser } from './useHeaderUser';

const useRepositoryProfilesStore = useRepositoryProfiles();
const { getUserState } = storeToRefs(useRepositoryProfilesStore);
const profilesStore = useProfilesStore();
const { selectedUserProfileId } = storeToRefs(profilesStore);
const filerRepository = useRepositoryFiler();
const { postSignurlState } = storeToRefs(filerRepository);
const dialogsStore = useDialogs();
const { isDialogLogoutOpen } = storeToRefs(dialogsStore);

const { userEmail, avatarSrc } = useHeaderUser();
const getProfileId = computed(() => Number(selectedUserProfileId.value));
const USER_MENU_QUERY_KEY = 'fromUserMenu';
const USER_MENU_QUERY_VALUE = '1';
const USER_MENU_FROM_QUERY_KEY = 'menuFrom';
const USER_MENU_OPEN_QUERY_KEY = 'openUserMenu';
const OPEN_PWA_PROFILE_OVERLAY_EVENT = 'invest:pwa-profile-overlay:open';

const toPathname = (url: string) => {
  try {
    return new URL(url, window.location.origin).pathname;
  } catch {
    return url;
  }
};

const getAppBasePath = () => {
  if (typeof window === 'undefined') {
    return '';
  }

  try {
    const baseHref = document.querySelector('base')?.getAttribute('href') || '/';
    const basePath = new URL(baseHref, window.location.origin).pathname.replace(/\/$/, '');
    return basePath === '/' ? '' : basePath;
  } catch {
    return '';
  }
};

const normalizePathWithBase = (path: string) => {
  if (!path.startsWith('/')) {
    return path;
  }

  const basePath = getAppBasePath();
  if (!basePath) {
    return path;
  }
  if (path === basePath || path.startsWith(`${basePath}/`)) {
    return path;
  }
  return `${basePath}${path}`;
};

const withUserMenuSource = (url: string) => {
  if (!url) {
    return '';
  }

  const getCurrentMenuSource = () => {
    if (typeof window === 'undefined') {
      return '/';
    }
    const current = new URL(window.location.href);
    current.searchParams.delete(USER_MENU_QUERY_KEY);
    current.searchParams.delete(USER_MENU_FROM_QUERY_KEY);
    current.searchParams.delete(USER_MENU_OPEN_QUERY_KEY);
    return `${current.pathname}${current.search}${current.hash}`;
  };

  if (typeof window === 'undefined') {
    const hasQuery = url.includes('?');
    const suffix = `${USER_MENU_QUERY_KEY}=${USER_MENU_QUERY_VALUE}`;
    return `${url}${hasQuery ? '&' : '?'}${suffix}`;
  }

  try {
    const parsed = new URL(url, window.location.origin);
    parsed.searchParams.set(USER_MENU_QUERY_KEY, USER_MENU_QUERY_VALUE);
    parsed.searchParams.set(USER_MENU_FROM_QUERY_KEY, getCurrentMenuSource());
    const normalizedPath = normalizePathWithBase(parsed.pathname);
    return `${normalizedPath}${parsed.search}${parsed.hash}`;
  } catch {
    const hasQuery = url.includes('?');
    const suffix = `${USER_MENU_QUERY_KEY}=${USER_MENU_QUERY_VALUE}`;
    return `${url}${hasQuery ? '&' : '?'}${suffix}`;
  }
};

const accountDetailsPath = computed(() => (
  Number.isFinite(getProfileId.value) ? withUserMenuSource(urlSettingsAccountDetails(getProfileId.value)) : ''
));
const mfaPath = computed(() => (
  Number.isFinite(getProfileId.value) ? withUserMenuSource(urlSettingsMfa(getProfileId.value)) : ''
));
const securityPath = computed(() => (
  Number.isFinite(getProfileId.value) ? withUserMenuSource(urlSettingsSecurity(getProfileId.value)) : ''
));
const howItWorksPath = computed(() => withUserMenuSource(toPathname(urlHowItWorks)));
const contactUsPath = computed(() => withUserMenuSource(toPathname(urlContactUs)));
const faqPath = computed(() => withUserMenuSource(toPathname(urlFaq)));

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
  try {
    await filerRepository.uploadHandler(file, userId, 'user', userId);
    const uploadedId = postSignurlState.value.data?.meta?.id;
    if (uploadedId) {
      await useRepositoryProfilesStore.updateUserData({ image_link_id: uploadedId });
      await useRepositoryProfilesStore.getUser();
    }
  } catch (e) {
    reportError(e, 'Failed to update avatar');
  } finally {
  isAvatarLoading.value = false;
  }
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
  closeProfileOverlay();
  isDialogLogoutOpen.value = true;
};

onMounted(() => {
  if (typeof window !== 'undefined') {
    const current = new URL(window.location.href);
    const shouldOpenMenu = current.searchParams.get(USER_MENU_OPEN_QUERY_KEY) === USER_MENU_QUERY_VALUE;
    if (shouldOpenMenu) {
      openProfileOverlay();
      current.searchParams.delete(USER_MENU_OPEN_QUERY_KEY);
      window.history.replaceState({}, '', `${current.pathname}${current.search}${current.hash}`);
    }
    window.addEventListener(OPEN_PWA_PROFILE_OVERLAY_EVENT, openProfileOverlay);
  }
});

onUnmounted(() => {
  closeProfileOverlay();
  if (typeof window !== 'undefined') {
    window.removeEventListener(OPEN_PWA_PROFILE_OVERLAY_EVENT, openProfileOverlay);
  }
});
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
      id="pwa-profile-avatar-upload"
      ref="refFiles"
      name="file"
      type="file"
      accept="image/png, image/jpeg, image/jpg"
      aria-label="Upload avatar image"
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
      :how-it-works-href="howItWorksPath"
      :faq-href="faqPath"
      :contact-href="contactUsPath"
      @close="closeProfileOverlay"
      @logout="onLogout"
      @avatar-click="onAvatarClick"
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
