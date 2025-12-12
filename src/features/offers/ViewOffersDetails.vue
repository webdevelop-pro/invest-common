<script setup lang="ts">
import { useGlobalLoader } from 'UiKit/store/useGlobalLoader';
import { InvestStepTypes } from 'InvestCommon/types/api/invest';
import OffersDetails from './components/OffersDetails.vue';
import { storeToRefs } from 'pinia';
import {
  computed, onBeforeMount, ref, watch, nextTick,
} from 'vue';
import { useData, useRoute } from 'vitepress';
import { navigateWithQueryParams } from 'UiKit/helpers/general';
import env from 'InvestCommon/domain/config/env';
import { useSessionStore } from 'InvestCommon/domain/session/store/useSession';
import { useProfilesStore } from 'InvestCommon/domain/profiles/store/useProfiles';
import { useRepositoryInvestment } from 'InvestCommon/data/investment/investment.repository';
import { useRepositoryOffer } from 'InvestCommon/data/offer/offer.repository';
import { useRepositoryFiler } from 'InvestCommon/data/filer/filer.repository';
import { useSendAnalyticsEvent } from 'InvestCommon/domain/analytics/useSendAnalyticsEvent';

const defaultInvestSteps = {
  [InvestStepTypes.amount]: {
    title: 'Investment',
    value: InvestStepTypes.amount,
    done: false,
    to: 'amount',
  },
  [InvestStepTypes.ownership]: {
    title: 'Ownership',
    value: InvestStepTypes.ownership,
    done: false,
    to: 'ownership',
  },
  [InvestStepTypes.signature]: {
    title: 'Signature',
    value: InvestStepTypes.signature,
    done: false,
    to: 'signature',
  },
  [InvestStepTypes.funding]: {
    title: 'Funding',
    value: InvestStepTypes.funding,
    done: false,
    to: 'funding',
  },
  [InvestStepTypes.review]: {
    title: 'Confirmation',
    value: InvestStepTypes.review,
    done: false,
    to: 'review',
  },
};


const { params } = useData();

const userSessionStore = useSessionStore();
const { userLoggedIn } = storeToRefs(userSessionStore);
const profilesStore = useProfilesStore();
const { selectedUserProfileId, userProfiles } = storeToRefs(profilesStore);
const offerRepository = useRepositoryOffer();
const { getOfferOneState } = storeToRefs(offerRepository);

const investmentRepository = useRepositoryInvestment();
const { setInvestState, getInvestUnconfirmedOne } = storeToRefs(investmentRepository);
const filerRepository = useRepositoryFiler();
const { sendEvent } = useSendAnalyticsEvent();

const investSteps = computed(() => defaultInvestSteps);
const offer = ref(params.value?.data || null);

const offerLoading = ref(true);

const investHandler = async () => {
  // If current selected profile is not KYC approved, switch to a random approved profile (if any)
  try {
    const profiles = userProfiles.value || [];
    if (profiles.length > 0) {
      const current = profiles.find((p: unknown) => p?.id === selectedUserProfileId.value);
      const isCurrentApproved = (current as { isKycApproved?: boolean } | undefined)?.isKycApproved;
      if (!isCurrentApproved) {
        const approvedProfiles = profiles.filter((p: unknown) => p?.isKycApproved);
        if (approvedProfiles.length > 0) {
          const randomApproved = approvedProfiles[Math.floor(Math.random() * approvedProfiles.length)];
          if (randomApproved?.id && randomApproved.id !== selectedUserProfileId.value) {
            profilesStore.setSelectedUserProfileById(randomApproved.id);
            await nextTick();
          }
        }
      }
    }
  } catch {}

  if (!getInvestUnconfirmedOne.value) {
    await investmentRepository.setInvest(params.value?.slug as string, selectedUserProfileId.value, 0);

    if (setInvestState.value.data) {
      getInvestUnconfirmedOne.value = setInvestState.value.data;
      navigateWithQueryParams(`${env.FRONTEND_URL_DASHBOARD}/invest/${params.value?.slug}/amount/${setInvestState.value.data.id}/${selectedUserProfileId.value}`);
    }
  } else if (getInvestUnconfirmedOne.value) {
    const { step }: { step: InvestStepTypes } = getInvestUnconfirmedOne.value;
    const name = Object.keys(investSteps.value).includes(step) ? investSteps.value[step].to : 'amount';
    navigateWithQueryParams(`${env.FRONTEND_URL_DASHBOARD}/invest/${params.value?.slug}/${name}/${getInvestUnconfirmedOne.value.id}/${selectedUserProfileId.value}`);
  }
};

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
    void sendEvent({
      event_type: 'open',
      service_name: 'vitepress-app',
    });
  }
});

watch(() => getOfferOneState.value.loading, () => {
  offerLoading.value = getOfferOneState.value.loading;
});

watch(() => getOfferOneState.value.data, (newValue) => {
  if (newValue) {
    offer.value = newValue;
  }
}, { immediate: true });
watch(() => offer.value?.id, () => {
  if (offer.value?.id !== 0) {
    offerRepository.getOfferComments(offer.value?.id);
    filerRepository.getPublicFiles(offer.value?.id, 'offer');
    if (userLoggedIn.value) filerRepository.getFiles(offer.value?.id, 'offer');
  }
}, { immediate: true });
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
