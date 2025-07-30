<script setup lang="ts">
import { useOfferStore } from 'InvestCommon/store/useOffer';
import { usePlaidStore } from 'InvestCommon/store/usePlaid';
import { useProfilesStore } from 'InvestCommon/domain/profiles/store/useProfiles';
import { storeToRefs } from 'pinia';
import VTimeline from 'UiKit/components/Base/VTimeline/VTimeline.vue';
import VTimelineItem from 'UiKit/components/Base/VTimeline/VTimelineItem.vue';
import VTimelineCard from 'UiKit/components/Base/VTimeline/VTimelineCard.vue';
import { computed } from 'vue';
import {
  AccreditationTypes, IAccreditationData, IKycData, InvestKycTypes,
} from 'InvestCommon/types/api/invest';
import { ACCREDITATION_HISTORY, INVEST_KYC_HISTORY, ITimelineItemsHistory } from '../utils';
import { OfferStatuses } from 'InvestCommon/types/api/offers';
import VButton from 'UiKit/components/Base/VButton/VButton.vue';
import { sortByDate } from 'UiKit/helpers/allData';
import { useRepositoryInvestment } from 'InvestCommon/data/investment/investment.repository';

const investmentRepository = useRepositoryInvestment();
const { getInvestOneState } = storeToRefs(investmentRepository);
const profilesStore = useProfilesStore();
const { selectedUserProfileId, selectedUserProfileData } = storeToRefs(profilesStore);
const offerStore = useOfferStore();
const plaidStore = usePlaidStore();
const { isCreateTokenLoading } = storeToRefs(plaidStore);

const funded = computed(() => offerStore.getOfferFundedPercent(getInvestOneState.value.data?.offer));
const dateDurationDifference = (created: string, completed: string) => {
  const d1 = new Date(created).getTime();
  const d2 = new Date(completed).getTime();
  let difference;
  if (d1 > d2) difference = d1 - d2;
  else difference = d2 - d1;
  const totalDays = Math.ceil(difference / (1000 * 3600 * 24));
  return totalDays === 1 ? `${totalDays} day.` : `${totalDays} days.`;
};

// const filterAccreditationDuplicatedCards = (data: IAccreditationData[]): IAccreditationData[] => {
//   const latestMap = new Map<string, IAccreditationData>();
//   data.forEach((item) => {
//     const existingItem = latestMap.get(item.status);
//     if (!existingItem || (new Date(item.created_at) > new Date(existingItem.created_at))) {
//       latestMap.delete(item.status);
//       latestMap.set(item.status, item);
//     }
//   });

//   // Convert the map values back to an array
//   return Array.from(latestMap.values());
// };

const isAccreditationCompleted = computed(() => (
  selectedUserProfileData.value?.accreditation_status === AccreditationTypes.approved));
const isAccreditationPending = computed(() => (
  selectedUserProfileData.value?.accreditation_status === AccreditationTypes.pending));
const accreditationParsedData = computed(() => {
  if (selectedUserProfileData.value?.accreditation_data && selectedUserProfileData.value?.accreditation_status) {
    const accreditationDataString = selectedUserProfileData.value?.accreditation_data;
    return sortByDate(accreditationDataString, 'created_at');
  }
  return null;
});

const getAccreditationDuration = (item: IAccreditationData, index: number) => {
  if (!accreditationParsedData.value) return;
  const next = accreditationParsedData.value[index + 1];
  // eslint-disable-next-line consistent-return
  if (next) return dateDurationDifference(item.created_at, next.created_at);
  // eslint-disable-next-line consistent-return
  return ACCREDITATION_HISTORY[item.status].duration;
};

const ApprovedAccreditationText = computed(() => (
  `The accreditation status of your ${selectedUserProfileData.value?.type} investment profile has been successfully approved.`));

const accreditationParsedHistory = computed(() => {
  if (accreditationParsedData.value?.length === 0) {
    return [{
      ...ACCREDITATION_HISTORY[selectedUserProfileData.value?.accreditation_status || 'new'],
      variant: ((accreditationParsedData.value?.length || 0) > 1) ? 'inner' : 'primary',
      type: isAccreditationCompleted.value ? 'complete' : 'active',
      showButton: !isAccreditationCompleted.value,
    }];
  }
  if (isAccreditationCompleted.value) {
    return [{
      ...ACCREDITATION_HISTORY[selectedUserProfileData.value?.accreditation_status || 'new'],
      text: ApprovedAccreditationText.value,
      duration: null,
      variant: 'primary',
      type: 'complete',
      showButton: !isAccreditationCompleted.value,
    }];
  }
  return accreditationParsedData.value?.map((item: IAccreditationData, index: number) => (
    {
      ...ACCREDITATION_HISTORY[item.status],
      duration: getAccreditationDuration(item, index),
      text: item.status === 'approved' ? ApprovedAccreditationText.value : ACCREDITATION_HISTORY[item.status].text,
      variant: ((accreditationParsedData.value?.length || 0) > 1) ? 'inner' : 'primary',
      type: isAccreditationCompleted.value ? 'complete' : 'active',
      showButton: !isAccreditationCompleted.value && !isAccreditationPending.value,
    }
  ));
});

const isKYCCompleted = computed(() => selectedUserProfileData.value?.kyc_status === InvestKycTypes.approved);
const isKYCDeclined = computed(() => selectedUserProfileData.value?.kyc_status === InvestKycTypes.declined);
const kycParsedData = computed(() => {
  if (selectedUserProfileData.value?.kyc_data && selectedUserProfileData.value?.kyc_status) {
    const kycDataString = selectedUserProfileData.value?.kyc_data;
    return kycDataString;
  }
  return null;
});

const getKYCDuration = (item: IKycData, index: number) => {
  if (!accreditationParsedData.value) return;
  const next = accreditationParsedData.value[index - 1];
  // eslint-disable-next-line consistent-return
  if (next) return dateDurationDifference(item.created_at, next.created_at);
  // eslint-disable-next-line consistent-return
  return INVEST_KYC_HISTORY[item.status].duration;
};

const kycParsedHistory = computed(() => {
  if (kycParsedData.value?.length === 0) {
    return [{
      ...INVEST_KYC_HISTORY[selectedUserProfileData.value?.kyc_status || 'new'],
      variant: 'primary',
      type: isKYCCompleted.value ? 'complete' : 'active',
      showButton: !isKYCCompleted.value && !isKYCDeclined.value,
    }];
  }
  if (isKYCCompleted.value) {
    return [{
      ...INVEST_KYC_HISTORY[selectedUserProfileData.value?.kyc_status || 'new'],
      duration: null,
      variant: 'primary',
      type: 'complete',
      showButton: !isKYCCompleted.value && !isKYCDeclined.value,
    }];
  }
  return kycParsedData.value?.map((item, index: number) => ({
    ...INVEST_KYC_HISTORY[item.status],
    duration: getKYCDuration(item, index),
    variant: ((kycParsedData.value?.length || 0) > 1) ? 'inner' : 'primary',
    type: isKYCCompleted.value ? 'complete' : 'active',
    showButton: !isKYCCompleted.value && ((item.status === InvestKycTypes.declined) && isKYCDeclined.value),
  }));
});

const isFundedCompleted = computed(() => (
  getInvestOneState.value.data?.offer.status === OfferStatuses.legal_closed)
  || (getInvestOneState.value.data?.offer.status === OfferStatuses.closed_successfully)
  || (getInvestOneState.value.data?.offer.status === OfferStatuses.closed_unsuccessfully));
const isLegalUnLocked = computed(() => (
  getInvestOneState.value.data?.offer.status === OfferStatuses.legal_closed)
  || (getInvestOneState.value.data?.offer.status === OfferStatuses.closed_successfully)
  || (getInvestOneState.value.data?.offer.status === OfferStatuses.closed_unsuccessfully));
const getLegalCircleType = computed(() => {
  if (isLegalUnLocked.value && (getInvestOneState.value.data?.offer.status === OfferStatuses.legal_closed)) {
    return 'highlight';
  }
  if (isLegalUnLocked.value && (getInvestOneState.value.data?.offer.status === OfferStatuses.closed_successfully)) {
    return 'complete';
  }
  return 'not-complete';
});
const getLegalCardType = computed(() => {
  if (isLegalUnLocked.value && (getInvestOneState.value.data?.offer.status === OfferStatuses.legal_closed)) {
    return 'active';
  }
  if (isLegalUnLocked.value && (getInvestOneState.value.data?.offer.status === OfferStatuses.closed_successfully)) {
    return 'complete';
  }
  return 'not-complete';
});

const isDividentsUnLocked = computed(() => (
  (getInvestOneState.value.data?.offer.status === OfferStatuses.closed_successfully)));

const data = computed(() => ([
  {
    circleType: isKYCCompleted.value ? 'complete' : 'highlight',
    items: kycParsedHistory.value,
    onButtonClick() {
      void plaidStore.handlePlaidKyc();
    },
  },
  {
    circleType: isAccreditationCompleted.value ? 'complete' : 'highlight',
    items: accreditationParsedHistory.value,
    onButtonClick() { },
  },
  {
    circleType: isFundedCompleted.value ? 'complete' : 'active',
    title: `${funded.value}% FUNDED`,
    items: [
      {
        title: 'The offer closes fundraising campaign',
        duration: '~1 week',
        text: 'Once 100% funded, investors are no longer able to cancel their investments. Learn more info '
          + '<a href="/resource-center/can-i-cancel-my-investment-and-get-a-refund" class="is--link-1">here</a> about the process.',
        type: isFundedCompleted.value ? 'complete' : 'active',
      },
    ] as unknown as ITimelineItemsHistory[],
    onButtonClick() { },
  },
  {
    circleType: getLegalCircleType.value,
    items: [
      {
        title: 'Final legal checks',
        duration: '~2 weeks',
        text: 'Our system makes final legal checks and we seal the deal and send information to the '
          + 'government structures. Learn more info <a href="/resource-center/can-i-cancel-my-investment-and-get-a-refund" class="is--link-1">here</a> about the process.',
        type: getLegalCardType.value,
      },
    ] as unknown as ITimelineItemsHistory[],
    onButtonClick() { },
  },
  {
    circleType: isDividentsUnLocked.value ? 'active' : 'not-complete',
    items: [
      {
        title: 'Collect distributions and manage taxes',
        duration: '6 months',
        text: 'Don’t forget to check your emails or web notifications in order not to miss '
          + 'important tax and distribution updates. Learn more info <a href="/resource-center/can-i-cancel-my-investment-and-get-a-refund" class="is--link-1 is--gray-10">here</a> '
          + 'about the process.',
        variant: 'highlight',
        type: isDividentsUnLocked.value ? 'active' : 'not-complete',
      },
    ] as unknown as ITimelineItemsHistory[],
    onButtonClick() { },
  },
]));

const getButtonTag = (item: ITimelineItemsHistory) => {
  if (item.buttonRoute) return 'router-link';
  if (item.buttonHref) return 'a';
  return 'button';
};
</script>

<template>
  <div class="InvestmentTimeline investment-timeline">
    <h1 class="investment-timeline__title is--h2__title">
      Investment Timeline
    </h1>

    <VTimeline
      class="investment-timeline__timeline"
      :content-style-default="false"
    >
      <VTimelineItem
        v-for="(dataItem, index) in data"
        :key="index"
        :circle-type="dataItem.circleType"
        :title="dataItem.title"
        class="investment-timeline__timeline-item"
      >
        <VTimelineCard
          v-for="(item, i) in dataItem.items"
          :key="i"
          :title="item.title"
          :duration="item.duration"
          :variant="item.variant"
          :type="item.type"
        >
          <div class="investment-timeline__timeline-text">
            <p
              class="investment-timeline__text"
              v-html="item.text"
            />
            <VButton
              v-if="item.buttonText && item.showButton"
              :as="getButtonTag(item)"
              :to="item.buttonRoute ? { name: item.buttonRoute, params: { profileId: selectedUserProfileId } } : null"
              :href="item.buttonHref"
              :loading="isCreateTokenLoading"
              class="investment-timeline__timeline-button"
              @click.stop="dataItem.onButtonClick"
            >
              {{ item.buttonText }}
            </VButton>
          </div>
        </VTimelineCard>
      </VTimelineItem>
    </VTimeline>
  </div>
</template>

<style lang="scss">
.investment-timeline {
  $root: &;

  &__title {
    color: $black;
    margin-bottom: 24px;
  }

  &__timeline-text {
    display: flex;
    gap: 20px;
    align-items: center;
    width: 100%;

    @media screen and (max-width: $tablet){
      flex-direction: column;
    }
  }

  &__timeline-button {
    flex-shrink: 0;
  }

  &__timeline {
    max-width: 850px;
  }

  &__text {
    width: 100%;
  }
}
</style>
