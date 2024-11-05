<script setup lang="ts">
import { BaseSvgIcon } from 'UiKit/components/BaseSvgIcon';

const modelValue = defineModel<boolean>();
defineEmits(['update:modelValue']);
</script>

<template>
  <div
    class="AppMobileMenuBurger app-mobile-menu-burger"
    :class="{ 'is-close': modelValue }"
    @click="$emit('update:modelValue', !modelValue)"
  >
    <div
      v-if="!modelValue"
      class="app-mobile-menu-burger__btn"
    >
      <span />
      <span />
      <span />
    </div>
    <span v-if="modelValue">
      <BaseSvgIcon
        name="close"
        class="app-mobile-menu-burger__icon is-close"
        alt="header burger icon is close"
      />
    </span>
  </div>
</template>

<style lang="scss" scoped>
$z-index-menu-bg: 99;
$z-index-menu: 999;
$z-index-menu-burger: $z-index-menu + 1;

.app-mobile-menu-burger {
  z-index: $z-index-menu-burger;
  color: $black;
  cursor: pointer;
  transition: color 0.3s;

  span {
    display: flex;
    align-items: center;
  }

  @include media-lt(tablet) {
    margin: 0 0 0 15px;
  }

  &__btn {
    position: relative;
    width: 30px;
    height: 20px;
    cursor: pointer;
    span {
      background-color: $black;
      border-radius: 1px;
      display: block;
      width: 30px;
      height: 3px;
      position: relative;
      top: 0;
      left: 0;
      margin: 4px 0;
      &:nth-child(1) {
        transition-delay: 0.5s;
      }
      &:nth-child(2) {
        transition-delay: 0.625s;
        width: 25px;
        left: 5px;
      }
      &:nth-child(3) {
        transition-delay: 0.75s;
        width: 20px;
        left: 10px;
      }
    }
  }

  &.is-close {
    position: fixed;
    top: 16px;
    right: 8px;
    margin: 0;
    color: $black;
  }

  &__icon {
    width: 26px;
    height: 16px;
  }
}
</style>
