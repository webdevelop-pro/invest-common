<script setup lang="ts">
import { PropType, computed } from 'vue';
import VComment from 'InvestCommon/components/VComment/VComment.vue';
import { IOfferComment } from 'InvestCommon/types/api/offers';
import { formatToDate } from 'InvestCommon/helpers/formatters/formatToDate';
import logoMob from 'InvestCommon/assets/images/logo-mob.svg?url';

defineProps({
  comment: {
    type: Object as PropType<IOfferComment>,
    required: true,
  },
});


const showAnswer = computed(() => false);
</script>

<template>
  <div class="VCommentThread v-comment-thread">
    <VComment
      class="v-comment-thread__comment"
      :title="`${ comment?.user.first_name } ${ comment?.user.last_name }`"
      :date="formatToDate(new Date(comment.created_at).toISOString())"
      :text="comment?.comment"
      :tag="comment.related"
    />

    <VComment
      v-if="showAnswer"
      class="v-comment-thread__comment is--reply"
      :title="`${ comment?.user.first_name } ${ comment?.user.last_name }`"
      :date="formatToDate(new Date(comment.created_at).toISOString())"
      :text="comment?.comment"
      :tag="comment.related"
      :image-src="logoMob"
      background="#F8F9FA"
    />
  </div>
</template>

<style lang="scss">
.v-comment-thread {
  .is--reply {
    margin-left: 16px;
    border-left: 1px solid $gray-20;
    padding-left: 12px;
    margin-top: 12px;
  }
}
</style>
