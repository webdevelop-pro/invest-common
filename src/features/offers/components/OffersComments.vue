<script setup lang="ts">
import VFormComments from './VFormComments.vue';
import VCommentItems from 'UiKit/components/VComment/VCommentItems.vue';
import { storeToRefs } from 'pinia';
import { computed, onBeforeMount } from 'vue';
import type { IOfferComment } from 'InvestCommon/types/api/offers';
import { useRepositoryOffer } from 'InvestCommon/data/offer/offer.repository';

const props = defineProps({
  offerId: {
    type: Number,
    required: true,
  },
  offerName: {
    type: String,
    required: true,
  },
  loading: {
    type: Boolean,
    default: false,
  },
});


const offerRepository = useRepositoryOffer();
const { getOfferCommentsState, setOfferCommentOptionsState } = storeToRefs(offerRepository);

const comments = computed<IOfferComment[]>(() => getOfferCommentsState.value.data?.data || []);
const isLoading = computed(() => (
  props.loading || getOfferCommentsState.value.loading || setOfferCommentOptionsState.value.loading));

onBeforeMount(() => {
  if (!setOfferCommentOptionsState.value.data) offerRepository.setOfferCommentOptions()
});
</script>

<template>
  <div
    class="OffersComments offer-comments"
    itemprop="review"
    itemscope
    itemtype="https://schema.org/Review"
  >
    <VFormComments
      :offer-id="offerId"
      :offer-name="offerName"
      :loading="isLoading"
    />
    <VCommentItems
      v-if="(comments && comments.length > 0) || isLoading"
      :comments="comments"
      :loading="isLoading"
    />
    <p
      v-else
      class="offer-comments__info"
    >
      There are no questions yet, but you can be the first!
    </p>
  </div>
</template>

<style lang="scss">
.offer-comments {

  &__skeleton {
    margin-top: 20px;
  }

  &__info {
    margin-top: 60px;
    text-align: center;
    font-size: 20px;
    line-height: 32px;
  }
}
</style>
