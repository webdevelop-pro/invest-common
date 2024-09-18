<script setup lang="ts">
import DefaultAvatar from 'InvestCommon/components/common/DefaultAvatar.vue';
import BaseTag from 'UiKit/components/BaseTag/BaseTag.vue';

defineProps({
  imageSrc: String,
  text: String,
  date: String,
  title: String,
  background: {
    type: String,
    default: '#F0F4FF',
  },
  tag: String,
});

</script>

<template>
  <div class="TheComment the-comment">
    <DefaultAvatar
      class="the-comment__image"
      :image-src="imageSrc"
    />
    <div class="the-comment__content">
      <div class="the-comment__top">
        <div class="the-comment__left">
          <span
            v-if="title"
            itemprop="author"
            class="the-comment__title is--h5__title"
          >
            {{ title }}
          </span>
          <BaseTag
            v-if="tag"
            size="small"
            background="#004FFF"
            white-text-color
            round
          >
            {{ tag[0].toUpperCase() + tag.slice(1) }}
          </BaseTag>
        </div>
        <div
          v-if="date"
          class="the-comment__right"
        >
          <span
            class="the-comment__date is--small"
            itemprop="datePublished"
          >
            {{ date }}
          </span>
        </div>
      </div>
      <p
        class="the-comment__text"
        itemprop="reviewBody"
      >
        {{ text }}
      </p>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.the-comment {
  display: flex;
  align-items: flex-end;
  gap: 12px;
  align-self: stretch;

  &__content {
    display: flex;
    width: 100%;
    padding: 16px 20px;
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
    align-self: stretch;
    border-radius: 12px 12px 12px 0;
    background: v-bind(background);
  }

  &__text {
    color: $gray-80;
  }

  &__top {
    display: flex;
    align-items: center;
    gap: 8px;
    align-self: stretch;
    justify-content: space-between;
  }

  &__title {
    color: $black;
  }

  &__date {
    color: $gray-60;
  }

  &__left {
    display: flex;
    align-items: center;
    gap: 8px;
  }
}
</style>
