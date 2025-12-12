<script setup lang="ts">
import { computed } from 'vue';
import { useRoute } from 'vitepress';
import VButton from 'UiKit/components/Base/VButton/VButton.vue';
import { storeToRefs } from 'pinia';
import { navigateWithQueryParams } from 'UiKit/helpers/general';
import { urlSignin } from 'InvestCommon/domain/config/links';
import { useSessionStore } from 'InvestCommon/domain/session/store/useSession';
import { useProfilesStore } from 'InvestCommon/domain/profiles/store/useProfiles';
import { useKycButton } from 'InvestCommon/features/kyc/store/useKycButton';
import { useSendAnalyticsEvent } from 'InvestCommon/domain/analytics/useSendAnalyticsEvent';

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
    service_name: 'vitepress-app',
  });
  emit('invest');
};


const startKycHandler = () => {
  kycButtonStore.onClick();
};
</script>

<template>
  <div class="OffersDetailsBtn offer-details-btn">
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
}

</style>
