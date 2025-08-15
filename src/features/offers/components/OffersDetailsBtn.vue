<script setup lang="ts">
import { computed } from 'vue';
import { InvestKycTypes } from 'InvestCommon/types/api/invest';
import VButton from 'UiKit/components/Base/VButton/VButton.vue';
import { storeToRefs } from 'pinia';
import { navigateWithQueryParams } from 'UiKit/helpers/general';
import { urlProfileKYC, urlSignin } from 'InvestCommon/global/links';
import { useSessionStore } from 'InvestCommon/domain/session/store/useSession';
import { useProfilesStore } from 'InvestCommon/domain/profiles/store/useProfiles';

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
const { selectedUserProfileId, selectedUserIndividualProfile } = storeToRefs(profilesStore);

const isAuth = computed(() => userLoggedIn.value);
const kycStatus = computed(() => (selectedUserIndividualProfile.value?.kyc_status ?? InvestKycTypes.none));
const showInvestBtn = computed(() => (
  kycStatus.value === InvestKycTypes.approved
  || props.isSharesReached
));
const showKYCBtn = computed(() => (
  kycStatus.value === InvestKycTypes.new
  && !props.isSharesReached
));

const query = computed(() => (
  (window && window?.location?.search) ? new URLSearchParams(window?.location?.search).get('redirect') : null));

const signInHandler = () => {
  navigateWithQueryParams(urlSignin, query.value);
};

const startKycHandler = () => {
  // if (selectedUserProfileShowKycInitForm.value) {
  navigateWithQueryParams(urlProfileKYC(selectedUserProfileId.value));
  // } else await plaidStore.handlePlaidKyc();
  // TODO
};
</script>

<template>
  <div class="OffersDetailsBtn offer-details-btn">
    <VButton
      v-if="!isAuth"
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
      class="offer-details-btn__kyc-info is--small"
    >
      You haven't passed KYC!
    </p>
    <p
      v-if="isSharesReached && showInvestBtn"
      class="offer-details-btn__kyc-info is--small"
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

  &__kyc-info {
    margin-top: 8px;
    color: $gray-70;
  }
}

</style>
