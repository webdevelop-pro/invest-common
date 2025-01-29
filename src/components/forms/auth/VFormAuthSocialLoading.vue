<script setup lang="ts">
import VSkeleton from 'UiKit/components/Base/VSkeleton/VSkeleton.vue';
</script>

<template>
  <div class="VFormAuthSocialLoading social-form  is--no-margin">
    <VSkeleton
      v-for="item in 4"
      :key="item"
      height="48px"
      width="100%"
      class="social-form__item"
    />
  </div>
</template>

<style lang="scss">
.social-form {
  display: flex;
  justify-content: center;
  align-items: flex-start;
  gap: 40px;
  align-self: stretch;
  width: 100%;

  &__item-icon,
  &__item-icon-hover {
    width: 20px;
    height: 20px;
    transition: all 0.3 ease;
  }

  &__item-icon-hover {
    display: none;
  }

  &__item {
    // width: 100%;

    &:hover {
      .social-form__item-icon {
        display: none;
      }
      .social-form__item-icon-hover {
        display: block;
      }
    }
  }
}
</style>
