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

const props = defineProps({
  isSharesReached: {
    type: Boolean,
    required: true,
  },
  loading: Boolean,
});

defineEmits(['invest']);

const userSessionStore = useSessionStore();
const { userLoggedIn } = storeToRefs(userSessionStore);
const profilesStore = useProfilesStore();
const { selectedUserProfileData } = storeToRefs(profilesStore);
const kycButtonStore = useKycButton();
const route = useRoute();

const showInvestBtn = computed(() => (
  selectedUserProfileData.value?.isKycApproved
  || props.isSharesReached
));
const showKYCBtn = computed(() => (
  selectedUserProfileData.value?.isKycNew
  && !props.isSharesReached
));

const signInHandler = () => {
  const redirect = `${route.path}${window.location.search}${window.location.hash}`;
  navigateWithQueryParams(urlSignin, { redirect });
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
      Sign in
    </VButton>
    <VButton
      v-else-if="showKYCBtn"
      class="offer-details-btn__btn"
      size="large"
      @click="startKycHandler"
    >
      Start KYC
    </VButton>
    <VButton
      v-else-if="showInvestBtn"
      class="offer-details-btn__btn"
      size="large"
      :disabled="loading || isSharesReached"
      @click="$emit('invest')"
    >
      Invest Now
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
