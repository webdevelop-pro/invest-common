<script setup lang="ts">
import { useGlobalLoader } from 'UiKit/store/useGlobalLoader';
import { InvestStepTypes } from 'InvestCommon/types/api/invest';
import OffersDetails from './components/OffersDetails.vue';
import { storeToRefs } from 'pinia';
import {
  computed, onBeforeMount, ref, watch,
} from 'vue';
import { useData, useRoute } from 'vitepress';
import { navigateWithQueryParams } from 'UiKit/helpers/general';
import { defaultInvestSteps } from './utils';
import env from 'InvestCommon/global/index';
import { useSessionStore } from 'InvestCommon/domain/session/store/useSession';
import { useProfilesStore } from 'InvestCommon/domain/profiles/store/useProfiles';
import { useRepositoryInvestment } from 'InvestCommon/data/investment/investment.repository';
import { useRepositoryOffer } from 'InvestCommon/data/offer/offer.repository';

const { params } = useData();

const userSessionStore = useSessionStore();
const { userLoggedIn } = storeToRefs(userSessionStore);
const profilesStore = useProfilesStore();
const { selectedUserProfileId } = storeToRefs(profilesStore);
const offerRepository = useRepositoryOffer();
const { getOfferOneState } = storeToRefs(offerRepository);

const investmentRepository = useRepositoryInvestment();
const { setInvestState, getInvestUnconfirmedOne } = storeToRefs(investmentRepository);

const unconfirmedOffer = computed(() => getInvestUnconfirmedOne.value);

const investSteps = computed(() => defaultInvestSteps);
const offer = ref(params.value?.data || null);

const offerLoading = ref(true);

const investHandler = async () => {
  if (!unconfirmedOffer.value) {
    await investmentRepository.setInvest(params.value?.slug as string, selectedUserProfileId.value, 0);

    if (setInvestState.value.data) {
      getInvestUnconfirmedOne.value = setInvestState.value.data;
      navigateWithQueryParams(`${env.FRONTEND_URL_DASHBOARD}/invest/${params.value?.slug}/amount/${setInvestState.value.data.id}/${selectedUserProfileId.value}`);
    }
  } else if (unconfirmedOffer.value) {
    const { step }: { step: InvestStepTypes } = unconfirmedOffer.value;
    const name = Object.keys(investSteps.value).includes(step) ? investSteps.value[step].to : 'amount';
    navigateWithQueryParams(`${env.FRONTEND_URL_DASHBOARD}/invest/${params.value?.slug}/${name}/${unconfirmedOffer.value.id}/${selectedUserProfileId.value}`);
  }
};

useGlobalLoader().hide();
const route = useRoute();

watch(
  () => route.path,
  () => {
    setTimeout(() => {
      useGlobalLoader().hide();
    }, 100);
  },
);

onBeforeMount(() => {
  if (userLoggedIn.value && params.value?.slug) {
    investmentRepository.getInvestUnconfirmed(String(params.value?.slug), selectedUserProfileId.value);
  }
  if (params.value?.slug) {
    offerRepository.getOfferOne(String(params.value?.slug));
  }
});

watch(() => getOfferOneState.value.loading, () => {
  offerLoading.value = getOfferOneState.value.loading;
});

watch(() => getOfferOneState.value.data, (newValue) => {
  if (newValue) {
    offer.value = newValue;
  }
});
watch(() => offer.value?.id, () => {
  if (offer.value?.id !== 0) {
    offerRepository.getOfferComments(offer.value?.id);
  }
});
</script>

<template>
  <div
    class="ViewOffersDetails view-offers-details is--page"
    itemscope
    itemtype="https://schema.org/Product"
  >
    <div class="is--container">
      <OffersDetails
        v-if="offer || offerLoading"
        :offer="offer"
        :loading="offerLoading"
        @invest="investHandler"
      />
      <p
        v-else
        class="view-offers-details__not-found"
        data-testid="not-found-offer"
      >
        Offer with slug <strong>{{ params.value?.slug }}</strong> not found
      </p>
    </div>
  </div>
</template>

<style lang="scss">
.view-offers-details {
  width: 100%;

  &__title-wrap {
    margin-bottom: 30px;
  }

  &__not-found {
    text-align: center;
    font-size: 20px;

    strong {
      font-weight: 800;
    }
  }
}
</style>
