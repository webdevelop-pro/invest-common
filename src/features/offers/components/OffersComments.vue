<script setup lang="ts">
import VSkeleton from 'UiKit/components/Base/VSkeleton/VSkeleton.vue';
import VFormComments from './VFormComments.vue';
import VCommentItems from 'UiKit/components/VComment/VCommentItems.vue';
import { storeToRefs } from 'pinia';
import { computed, onBeforeMount } from 'vue';
import type { IOfferComment } from 'InvestCommon/types/api/offers';
import { useRepositoryOffer } from 'InvestCommon/data/offer/offer.repository';

defineProps({
  offerId: {
    type: Number,
    required: true,
  },
  offerName: {
    type: String,
    required: true,
  },
});


const offerRepository = useRepositoryOffer();
const { getOfferCommentsState, setOfferCommentOptionsState } = storeToRefs(offerRepository);

const comments = computed<IOfferComment[]>(() => getOfferCommentsState.value.data?.data || []);

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
    />
    <VSkeleton
      v-if="getOfferCommentsState.loading"
      height="22px"
      width="100%"
      class="offer-comments__skeleton"
    />
    <VCommentItems
      v-else-if="comments && comments.length > 0"
      :comments="comments"
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
