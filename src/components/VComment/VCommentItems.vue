<script setup lang="ts">
import { PropType } from 'vue';
import { IOfferComment } from 'InvestCommon/types/api/offers';
import TheCommentThread from 'InvestCommon/components/VComment/VCommentThread.vue';

defineProps({
  comments: {
    type: Array as PropType<IOfferComment[]>,
    required: true,
  },
});
</script>

<template>
  <div class="VCommentItems v-comment-items">
    <div class="v-comment-items__title is--h2__title">
      Questions
    </div>
    <TheCommentThread
      v-for="item in comments"
      :key="item.created_at"
      :comment="item"
      class="v-comment-items__thread"
    />
  </div>
</template>

<style lang="scss">
.v-comment-items {
  margin-top: 60px;

  &__title {
    margin-bottom: 24px;
  }

  &__thread {
    margin-bottom: 32px;
  }
}
</style>
