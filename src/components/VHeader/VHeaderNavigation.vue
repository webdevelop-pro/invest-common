<script setup lang="ts">
import { PropType } from 'vue';
import env from 'InvestCommon/global';

const { EXTERNAL } = env;

type MenuItem = {
  to?: string;
  href?: string;
  active?: boolean;
  text: string;
  children?: MenuItem[];
}

defineProps({
  menu: Array as PropType<MenuItem[]>,
})
const getComponentName = (item: MenuItem) => {
  if (item.to) return 'router-link';
  if (item.href) return 'a';
  return 'div';
};
const getComponentClass = (item: MenuItem) => {
  if (item.to || item.href) return 'v-header-navigation__item';
  return 'v-header-navigation__item-not-link';
};
</script>

<template>
  <div class="VHeaderNavigation v-header-navigation">
    <div
      v-for="menuItem in menu"
      :key="menuItem.text"
      class="v-header-navigation__item-wrap"
    >
      <component
        :is="getComponentName(menuItem)"
        :href="menuItem.href"
        :to="menuItem.to"
        class="is--h6__title"
        :class="[getComponentClass(menuItem), { 'is--active': menuItem.active }]"
      >
        {{ menuItem.text }}
      </component>
      <div
        v-if="menuItem.children && menuItem.children.length > 0"
        class="v-header-navigation__children"
        :class="{ 'is--two-col': menuItem.children.length > 8 }"
      >
        <template
          v-for="childItem in menuItem.children"
          :key="childItem.text"
        >
          <component
            :is="getComponentName(childItem)"
            :href="childItem.href"
            :to="childItem.to"
            class="is--h6__title"
            :class="[getComponentClass(childItem), { 'is--active': childItem.active }]"
          >
            {{ childItem.text }}
          </component>
        </template>
      </div>
    </div>
  </div>
</template>

<style lang="scss">
.v-header-navigation {
  $root: &;

  width: 100%;
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 28px;

  &__item {
    color: $black;
    white-space: nowrap;
    cursor: pointer;
    text-decoration: none;

    @include media-lte(desktop-md) {
      display: none;
    }

    &:hover {
      color: $primary;
    }

    &.is--active {
      color: $primary;
    }

    &.router-link-active {
      color: $primary;
    }
  }

  &__children {
    position: absolute;
    cursor: pointer;
    overflow: hidden;
    padding: 8px 0;
    visibility: hidden;
    opacity: 0;
    box-shadow: $box-shadow-small;
    background-color: $white;
    transition: 0.1s all ease;
    left: 50%;
    top: 100%;
    transform: translateX(-50%);
    display: flex;
    flex-direction: column;
    flex-wrap: wrap;

    &.is--two-col {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 0 25px;
    }

    #{$root}__item {
      padding: 8px 12px;
      flex: 0 0 50%;
    }
  }

  &__item-wrap {
    position: relative;
    height: $header-height;
    display: flex;
    align-items: center;

    &:hover {
      #{$root}__children {
        visibility: visible;
        opacity: 1;
      }
    }
  }
}
</style>
