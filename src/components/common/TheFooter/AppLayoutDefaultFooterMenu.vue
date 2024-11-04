<script setup lang="ts">
import { PropType } from 'vue';

type MenuItem = {
  to?: string;
  href?: string;
  text: string;
  children?: MenuItem[];
}
defineProps({
  menu: Array as PropType<MenuItem[]>,
})
</script>

<template>
  <!-- eslint-disable vue/no-multiple-template-root -->
  <div class="AppLayoutDefaultFooterMenu app-layout-default-footer-menu">
    <ul class="app-layout-default-footer-menu__menu-list">
      <li
        v-for="menuItem in menu"
        :key="menuItem.text"
        class="app-layout-default-footer-menu__menu-item"
      >
        <router-link
          v-if="menuItem.to"
          :to="menuItem.to"
          class="app-layout-default-footer-menu__item is--h6__title"
        >
          {{ menuItem.text }}
        </router-link>
        <a
          v-if="menuItem.href"
          :href="menuItem.href"
          class="app-layout-default-footer-menu__item is--h6__title"
        >
          {{ menuItem.text }}
        </a>
        <div
          v-if="!menuItem.href && !menuItem.to"
          class="app-layout-default-footer-menu__item-not-link is--h5__title"
        >
          {{ menuItem.text }}
        </div>
        <div
          v-if="menuItem.children && menuItem.children.length > 0"
          class="app-layout-default-footer-menu__children"
          :class="{ 'is--two-col': menuItem.children.length > 8 }"
        >
          <template
            v-for="childItem in menuItem.children"
            :key="childItem.text"
          >
            <router-link
              v-if="childItem.to"
              :to="childItem.to"
              class="app-layout-default-footer-menu__item is--h6__title"
            >
              {{ childItem.text }}
            </router-link>
            <a
              v-if="childItem.href"
              :href="childItem.href"
              class="app-layout-default-footer-menu__item is--h6__title"
            >
              {{ childItem.text }}
            </a>
          </template>
        </div>
      </li>
    </ul>
  </div>
</template>


<style lang="scss">
.app-layout-default-footer-menu {
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
    &:hover {
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
        grid-template-columns: repeat(2, 1fr);
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
  }
}
</style>
