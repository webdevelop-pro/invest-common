<script setup lang="ts">
import {
  computed, onMounted, onUnmounted, ref, watch,
} from 'vue';
import { useRoute } from 'vitepress';
import VButton from 'UiKit/components/Base/VButton/VButton.vue';
import VKycActionButton from 'InvestCommon/features/kyc/VKycActionButton.vue';
import { storeToRefs } from 'pinia';
import { navigateWithQueryParams } from 'UiKit/helpers/general';
import { urlSignin } from 'InvestCommon/domain/config/links';
import { useSessionStore } from 'InvestCommon/domain/session/store/useSession';
import { useProfilesStore } from 'InvestCommon/domain/profiles/store/useProfiles';
import { useKycAlertViewModel } from 'InvestCommon/features/kyc/logic/useKycAlertViewModel';
import { useSendAnalyticsEvent } from 'InvestCommon/domain/analytics/useSendAnalyticsEvent';
import { useEventListener } from '@vueuse/core';
import { OfferTabTypes } from './logic/useOffersDetailsContent';
import { useSyncWithUrl } from 'UiKit/composables/useSyncWithUrl';

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
const { alertModel: kycAlertModel } = useKycAlertViewModel();
const route = useRoute();
const { sendEvent } = useSendAnalyticsEvent();

const rootEl = ref<HTMLElement | null>(null);
const isFloating = ref(false);
const initialBottom = ref<number | null>(null);
const footerEl = ref<HTMLElement | null>(null);
const isFooterVisible = ref(false);
const isClient = typeof window !== 'undefined';
const isClientReady = ref(false);
let footerObserver: IntersectionObserver | null = null;
let frameId = 0;

const activeTab = useSyncWithUrl<string>({
  key: 'tab',
  defaultValue: OfferTabTypes.description,
});

const showInvestBtn = computed(() => (
  selectedUserProfileData.value?.isKycApproved
  || hasAnyKycApprovedProfile.value
  || props.isSharesReached
));
const showKycBtn = computed(() => (
  !hasAnyKycApprovedProfile.value
  && !showInvestBtn.value
  && kycAlertModel.value.show
  && Boolean(kycAlertModel.value.buttonText)
  && !props.isSharesReached
));
const canFloatButton = computed(() => (
  isClient
  && activeTab.value === OfferTabTypes.description
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

const updateFloatingState = () => {
  if (!canFloatButton.value) {
    isFloating.value = false;
    return;
  }

  // Use floating behavior only on mobile / small screens
  const isMobile = window.innerWidth < 768;
  if (!isMobile) {
    isFloating.value = false;
    return;
  }

  // Only show floating button on the Description tab
  if (activeTab.value && activeTab.value !== OfferTabTypes.description) {
    isFloating.value = false;
    return;
  }

  // If we haven't measured the original button position yet, do nothing
  if (!initialBottom.value) return;

  // Start floating once the original button has completely scrolled above the viewport
  const scrolledPastButton = window.scrollY >= initialBottom.value;

  isFloating.value = scrolledPastButton && !isFooterVisible.value;
};

const scheduleFloatingStateUpdate = () => {
  if (!isClient) return;
  if (frameId) return;
  frameId = window.requestAnimationFrame(() => {
    frameId = 0;
    updateFloatingState();
  });
};

const updateInitialBottom = () => {
  if (!isClient || !rootEl.value) return;
  const rect = rootEl.value.getBoundingClientRect();
  initialBottom.value = rect.bottom + window.scrollY;
};

if (isClient) {
  useEventListener(window, 'scroll', scheduleFloatingStateUpdate, { passive: true });
  useEventListener(window, 'resize', () => {
    updateInitialBottom();
    scheduleFloatingStateUpdate();
  });
}

watch(
  () => activeTab.value,
  () => {
    scheduleFloatingStateUpdate();
  },
);

onMounted(() => {
  if (!isClient) return;

  footerEl.value = document.querySelector('.app-layout-default__footer') as HTMLElement | null;
  if (footerEl.value && typeof IntersectionObserver !== 'undefined') {
    footerObserver = new IntersectionObserver(
      ([entry]) => {
        isFooterVisible.value = entry.isIntersecting;
        scheduleFloatingStateUpdate();
      },
      {
        root: null,
        threshold: 0,
        rootMargin: '0px 0px -24px 0px',
      },
    );
    footerObserver.observe(footerEl.value);
  }

  updateInitialBottom();

  scheduleFloatingStateUpdate();
  isClientReady.value = true;
});

watch(() => rootEl.value, () => {
  updateInitialBottom();
  scheduleFloatingStateUpdate();
});

onUnmounted(() => {
  if (frameId) {
    window.cancelAnimationFrame(frameId);
    frameId = 0;
  }
  if (footerObserver) {
    footerObserver.disconnect();
    footerObserver = null;
  }
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
      <VKycActionButton
        v-else-if="showKycBtn"
        class="offer-details-btn__btn"
        size="large"
      />
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
