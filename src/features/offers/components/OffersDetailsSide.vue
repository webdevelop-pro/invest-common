<script setup lang="ts">

import { IOffer } from 'InvestCommon/types/api/offers';
import { currency } from 'InvestCommon/helpers/currency';
import { useOfferStore } from 'InvestCommon/store/useOffer';
import { PropType, computed } from 'vue';
import { storeToRefs } from 'pinia';
import { urlContactUs } from 'InvestCommon/global/links';
import { useClipboard } from '@vueuse/core';
import VSkeleton from 'UiKit/components/Base/VSkeleton/VSkeleton.vue';
import share from 'UiKit/assets/images/share.svg';
import file from 'UiKit/assets/images/file.svg';
import OffersDetailsBtn from './OffersDetailsBtn.vue';
import VProgress from 'UiKit/components/Base/VProgress/VProgress.vue';
import VButton from 'UiKit/components/Base/VButton/VButton.vue';
import { useRepositoryFiler } from 'InvestCommon/data/filer/filer.repository';
import { FilerFormatter } from 'InvestCommon/data/filer/filer.formatter';

const props = defineProps({
  offer: {
    type: Object as PropType<IOffer>,
  },
  loading: {
    type: Boolean,
    default: true,
  },
});
defineEmits(['invest']);

const offerStore = useOfferStore();
const filerRepository = useRepositoryFiler();
const { getFilesState, getPublicFilesState } = storeToRefs(filerRepository);


const filesFormatted = computed(() => (
  FilerFormatter.getFormattedInvestmentDocuments(getFilesState.value.data, getPublicFilesState.value.data)));

const { copy, copied } = useClipboard({ legacy: true });

const isSharesReached = computed(() => (
  (props.offer?.total_shares || 0) - (props.offer?.subscribed_shares || 0) < props.offer?.min_investment
));

const amountPercent = computed(() => offerStore.getOfferFundedPercent(props.offer));

const readOnlyInfo = computed(() => ([
  {
    title: 'Share Price:',
    text: currency(props.offer?.price_per_share),
  },
  {
    title: 'Pre-Money Valuation:',
    text: currency(props.offer?.valuation, 0),
  },
  {
    title: 'Security Type:',
    text: props.offer?.security_type,
  },
  {
    title: 'Interest Rate:',
    text: props.offer?.data?.apy,
  },
  {
    title: 'Distribution Frequency:',
    text: props.offer?.data?.distribution_frequency,
  },
  {
    title: 'Investment Strategy:',
    text: props.offer?.data?.investment_strategy,
  },
  {
    title: 'Estimated Hold Period:',
    text: props.offer?.data?.estimated_hold_period,
  },
]));

const investmentDocUrl = computed(() => {
  const filterDoc = filesFormatted.value.filter((doc) => (doc.name.toLowerCase().includes('investment agreement')))[0];
  return filterDoc?.url;
});

const onShareClick = () => {
  copy(window?.location?.href);
};
</script>

<template>
  <div class="OfferDetailsSide offer-details-side">
    <div class="offer-details-side__share-wrap">
      <VButton
        size="small"
        variant="tetriary"
        icon-placement="left"
        class="offer-details-side__share"
        @click.stop="onShareClick"
      >
        <share
          class="offer-details-side__share-icon"
        />
        <span v-if="!copied">Share</span>
        <span v-else>Copied!</span>
      </VButton>
    </div>
    <div class="offer-details-side__progress-wrap">
      <VProgress
        :model-value="amountPercent"
        with-text
      />
    </div>
    <div class="offer-details-side__side-card">
      <div class="offer-details-side__side-details">
        <template
          v-for="(item, index) in readOnlyInfo"
          :key="index"
        >
          <div
            v-if="item.text"
            class="offer-details-side__side-details-info"
          >
            <span class="offer-details-side__side-details-label is--h6__title">
              {{ item.title }}
            </span>

            <VSkeleton
              v-if="loading"
              height="26px"
              width="100px"
              class="offer-details-side__side-details-value is--body"
            />
            <span
              v-else
              class="offer-details-side__side-details-value is--body"
            >
              {{ item.text }}
            </span>
          </div>
        </template>
        <VButton
          v-if="investmentDocUrl"
          :href="investmentDocUrl"
          as="a"
          target="_blank"
          rel="noopener norefferer"
          size="small"
          variant="outlined"
          block
          color="secondary"
          icon-placement="left"
          class="offer-details-side__document-button"
        >
          <file
            class="offer-details-side__document-icon"
          />
          Investment Agreement
        </VButton>
      </div>
      <div class="offer-details-side__side-card-footer">
        <div class="offer-details-side__min-invest">
          <span class="offer-details-side__min-invest-label is--h6__title">
            Min investment:
          </span>
          <span class="offer-details-side__min-invest-value is--h4__title">
            {{ currency(offer?.min_investment * offer?.price_per_share, 0) }}
          </span>
        </div>
        <OffersDetailsBtn
          :is-shares-reached="isSharesReached"
          :loading="loading"
          class="offer-details-side__button"
          @invest="$emit('invest')"
        />
      </div>
    </div>
    <VButton
      as="a"
      :href="urlContactUs"
      size="small"
      variant="link"
      block
    >
      Contact Investor Relation Team
    </VButton>
  </div>
</template>

<style lang="scss">
.offer-details-side {

  &__progress-wrap {
    margin-bottom: 22px;

    @include media-lte(tablet) {
      margin-top: 12px;
    }
  }

  &__share-wrap {
    display: flex;
    justify-content: end;
    margin-bottom: 46px;
  }

  &__side-card {
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: flex-start;
    align-self: stretch;
    border-radius: 2px;
    border: 1px solid $gray-20;
    background: $white;
    box-shadow: $box-shadow-small;
    margin-bottom: 20px;
  }

  &__side-details {
    display: flex;
    padding: 20px;
    flex-direction: column;
    align-items: flex-start;
    align-self: stretch;
    border-bottom: 1px solid $gray-20;
  }

  &__side-details-info {
    display: flex;
    justify-content: space-between;
    width: 100%;
    align-items: center;

    & + & {
      margin-top: 7px;
    }

    &:last-of-type:not(:last-child) {
      margin-bottom: 22px !important;
    }
  }

  &__side-details-label {
    color: $gray-70;
  }

  &__side-details-value {
    color: $gray-80;
  }

  &__min-invest-label {
    color: $gray-70;
    min-width: 141px;
  }

  &__min-invest-value {
    color: $primary;
  }

  &__min-invest {
    display: flex;
    flex-direction: column;
  }

  &__side-card-footer {
    padding: 20px;
    display: flex;
    align-items: center;
    gap: 12px;
    align-self: stretch;
    justify-content: space-between;
  }

  &__button {
    width: 100%;
    max-width: 170px;
  }

  &__share-icon {
    width: 16px;
  }

  &__document-icon {
    width: 15px;
  }
}
</style>
