<script setup lang="ts">
import user from 'InvestCommon/assets/images/icons/user.svg?component';

defineProps({
  imageSrc: String,
});
</script>

<template>
  <div
    class="DefaultAvatar default-avatar"
    :class="{ 'is--show-image': imageSrc }"
  >
    <img
      v-if="imageSrc"
      class="default-avatar__image"
      :src="imageSrc"
      alt="avatar"
    >
    <user
      v-else
      class="default-avatar__icon"
      alt="avatar"
    />
  </div>
</template>

<style lang="scss">
.default-avatar {
  $root: &;

  width: 30px;
  height: 30px;
  flex-shrink: 0;
  border-radius: 100%;
  border: 1px solid $gray-30;
  background: $gray-20;
  display: flex;
  align-items: center;
  justify-content: center;

  &.is--show-image {
    background-color: transparent;
    #{$root}__image {
      height: 14px;
    }
  }

  &__image {
    width: auto;
    height: 16px;
    max-width: 100%;
    max-height: 100%;
    flex-shrink: 0;
    color: $gray-50;
  }

  &__icon {
    width: auto;
    height: 16px;
    max-width: 100%;
    max-height: 100%;
    flex-shrink: 0;
    color: $gray-50;
  }
}
</style>
