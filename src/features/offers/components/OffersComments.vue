<script setup lang="ts">
import { useOfferStore } from 'InvestCommon/store/useOffer';
import VSkeleton from 'UiKit/components/Base/VSkeleton/VSkeleton.vue';
import VFormComments from 'InvestCommon/components/forms/VFormComments.vue';
import VCommentItems from 'UiKit/components/VComment/VCommentItems.vue';
import { storeToRefs } from 'pinia';
import { onBeforeMount } from 'vue';

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

const offerStore = useOfferStore();
const { isGetOfferCommentsLoading, getOfferCommentsData: comments } = storeToRefs(offerStore);

// onMounted(() => void offerStore.getOfferComments(props.offerId));
onBeforeMount(() => offerStore.setOfferCommentOptions());
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
      v-if="isGetOfferCommentsLoading"
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
