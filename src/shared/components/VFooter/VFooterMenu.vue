<script setup lang="ts">
import { PropType } from 'vue';

type MenuItem = {
  to?: string;
  href?: string;
  text: string;
  active?: boolean;
  children?: MenuItem[];
}
defineProps({
  menu: Array as PropType<MenuItem[]>,
  path: String,
});

const getComponentName = (item: MenuItem) => {
  if (item.to) return 'router-link';
  if (item.href) return 'a';
  return 'div';
};
const getComponentClass = (item: MenuItem) => {
  if (item.to || item.href) return 'v-footer-menu__item';
  return 'v-footer-menu__item-not-link';
};
</script>

<template>
  <!-- eslint-disable vue/no-multiple-template-root -->
  <nav class="VFooterMenu v-footer-menu">
    <ul class="v-footer-menu__menu-list">
      <li
        v-for="menuItem in menu"
        :key="menuItem.text"
        class="v-footer-menu__menu-item"
      >
        <component
          :is="getComponentName(menuItem)"
          :href="menuItem.href"
          :to="menuItem.to"
          class="is--h6__title"
          :class="[getComponentClass(menuItem), { 'router-link-active': menuItem.href?.includes(path) }]"
        >
          {{ menuItem.text }}
        </component>
        <div
          v-if="menuItem.children && menuItem.children.length > 0"
          class="v-footer-menu__children"
          :class="{ 'is--two-col': menuItem.children.length > 8 }"
        >
          <template
            v-for="childItem in menuItem.children"
            :key="childItem.text"
          >
            <component
              :is="getComponentName(menuItem)"
              :href="childItem.href"
              :to="childItem.to"
              class="is--h6__title"
              :class="[getComponentClass(childItem), { 'is--active': childItem.active }]"
            >
              {{ childItem.text }}
            </component>
          </template>
        </div>
      </li>
    </ul>
  </nav>
</template>

<style lang="scss">
.v-footer-menu {
  $root: &;

  &__menu-item {
    gap: 10px;
    display: flex;
    flex-direction: column;
  }
  &__item-not-link {
    color: $gray-60;
  }
  &__item {
    white-space: nowrap;
    color: $white;
    text-decoration: none;
    &:hover,
    &.is--active {
      color: $primary;
    }
  }
  &__children {
    display: flex;
    flex-direction: column;
    flex-wrap: wrap;
    gap: 0 40px;
    @include media-lte(tablet) {
      gap: 0;
    }

    &.is--two-col {
      @include media-gte(mobile) {
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
      }
    }

    #{$root}__item {
      padding: 8px 0;
    }
  }
  &__menu-list {
    display: flex;
    gap: 16px;
    flex-direction: column;
    list-style-type: none;

    @include media-lte(tablet) {
      padding-left: 0;
    }
  }
}
</style>
