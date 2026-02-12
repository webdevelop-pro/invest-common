<script setup lang="ts">
import {
  computed, onMounted, ref,
} from 'vue';
import { useRoute } from 'vitepress';
import VButton from 'UiKit/components/Base/VButton/VButton.vue';
import { storeToRefs } from 'pinia';
import { navigateWithQueryParams } from 'UiKit/helpers/general';
import { urlSignin } from 'InvestCommon/domain/config/links';
import { useSessionStore } from 'InvestCommon/domain/session/store/useSession';
import { useProfilesStore } from 'InvestCommon/domain/profiles/store/useProfiles';
import { useKycButton } from 'InvestCommon/features/kyc/store/useKycButton';
import { useSendAnalyticsEvent } from 'InvestCommon/domain/analytics/useSendAnalyticsEvent';
import { useEventListener } from '@vueuse/core';

const props = defineProps({
  isSharesReached: {
    type: Boolean,
    required: true,
  },
  loading: Boolean,
});

const emit = defineEmits(['invest']);

const userSessionStore = useSessionStore();
const { userLoggedIn } = storeToRefs(userSessionStore);
const profilesStore = useProfilesStore();
const { selectedUserProfileData, hasAnyKycApprovedProfile } = storeToRefs(profilesStore);
const kycButtonStore = useKycButton();
const route = useRoute();
const { sendEvent } = useSendAnalyticsEvent();

const rootEl = ref<HTMLElement | null>(null);
const isFloating = ref(false);
const initialBottom = ref<number | null>(null);
const footerEl = ref<HTMLElement | null>(null);
const isClient = typeof window !== 'undefined';
const isClientReady = ref(false);

const showInvestBtn = computed(() => (
  selectedUserProfileData.value?.isKycApproved
  || hasAnyKycApprovedProfile.value
  || props.isSharesReached
));
const showKYCBtn = computed(() => (
  !hasAnyKycApprovedProfile.value
  && selectedUserProfileData.value?.isKycNew
  && !props.isSharesReached
));

const signInHandler = () => {
  const redirect = `${route.path}${window.location.search}${window.location.hash}`;
  navigateWithQueryParams(urlSignin, { redirect });
};

const investClickHandler = async () => {
  await sendEvent({
    event_type: 'click',
    method: 'GET',
    httpRequestMethod: 'GET',
    service_name: 'vitepress-app',
    request_path: route.path,
  });
  emit('invest');
};


const startKycHandler = () => {
  kycButtonStore.onClick();
};

const updateFloatingState = () => {
  if (!isClient) return;

  // Use floating behavior only on mobile / small screens
  const isMobile = window.innerWidth < 768;
  if (!isMobile) {
    isFloating.value = false;
    return;
  }

  // If we haven't measured the original button position yet, do nothing
  if (!initialBottom.value) return;

  // Start floating once the original button has completely scrolled above the viewport
  const scrolledPastButton = window.scrollY >= initialBottom.value;

  let footerVisible = false;

  if (footerEl.value) {
    const footerRect = footerEl.value.getBoundingClientRect();
    // Add a small margin so we hide the floating button slightly before the footer overlaps it
    const margin = 24;
    footerVisible = footerRect.top < window.innerHeight - margin;
  }

  isFloating.value = scrolledPastButton && !footerVisible;
};

if (isClient) {
  useEventListener(window, 'scroll', updateFloatingState, { passive: true });
  useEventListener(window, 'resize', updateFloatingState);
}

onMounted(() => {
  if (!isClient) return;

  footerEl.value = document.querySelector('.app-layout-default__footer') as HTMLElement | null;

  if (rootEl.value) {
    const rect = rootEl.value.getBoundingClientRect();
    // Bottom of the button relative to the document
    initialBottom.value = rect.bottom + window.scrollY;
  }

  updateFloatingState();
  isClientReady.value = true;
});
</script>

<template>
  <div
    ref="rootEl"
    class="OffersDetailsBtn offer-details-btn"
    :class="{ 'offer-details-btn--floating': isFloating }"
  >
    <VButton
      v-if="!isClientReady"
      class="offer-details-btn__btn"
      size="large"
      disabled
    >
      Loading...
    </VButton>
    <template v-else>
      <VButton
        v-if="!userLoggedIn"
        size="large"
        class="offer-details-btn__btn"
        @click="signInHandler"
      >
        Log in
      </VButton>
      <VButton
        v-else-if="showInvestBtn"
        class="offer-details-btn__btn"
        size="large"
        :disabled="loading || isSharesReached"
        @click="investClickHandler"
      >
        Invest Now
      </VButton>
      <VButton
        v-else-if="showKYCBtn"
        class="offer-details-btn__btn"
        size="large"
        @click="startKycHandler"
      >
        Start KYC
      </VButton>
      <p
        v-else
        class="offer-details-btn__info is--small"
      >
        You haven't passed KYC!
      </p>
      <p
        v-if="isSharesReached && showInvestBtn"
        class="offer-details-btn__info is--small"
      >
        Offer already reached subscription
      </p>
    </template>
  </div>
</template>

<style lang="scss">
.offer-details-btn {
  &__btn {
    width: 100%;
  }

  &__info {
    margin-top: 8px;
    color: $gray-70;
  }

  &.offer-details-btn--floating {
    position: fixed;
    left: 0;
    right: 0;
    bottom: 12px;
    z-index: 90;
    margin: 0 auto;
  }
}

</style>
