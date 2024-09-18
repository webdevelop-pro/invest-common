<script setup lang="ts">
import { useRouter } from 'vue-router';
import { PropType } from 'vue';

const router = useRouter();

type MenuItem = {
  to?: string;
  href?: string;
  text: string;
  children?: MenuItem[];
}

defineProps({
  menu: Array as PropType<MenuItem[]>,
})
const getActive = (to: { name: string }) => {
  if (router.currentRoute.value.name === to.name) {
    return 'is--active';
  }
  return '';
};
</script>

<template>
  <div class="AppLayoutDefaultHeaderNavigation app-layout-default-header-navigation">
    <div
      v-for="menuItem in menu"
      :key="menuItem.text"
      class="app-layout-default-header-navigation__item-wrap"
    >
      <router-link
        v-if="menuItem.to"
        :to="menuItem.to"
        class="app-layout-default-header-navigation__item is--h6__title"
        :class="{ 'is--link': menuItem.to }"
      >
        {{ menuItem.text }}
      </router-link>
      <span
        v-else
        class="app-layout-default-header-navigation__item is--h6__title"
      >
        {{ menuItem.text }}
      </span>
      <div
        v-if="menuItem.children && menuItem.children.length > 0"
        class="app-layout-default-header-navigation__children"
        :class="{ 'is--two-col': menuItem.children.length > 8 }"
      >
        <template
          v-for="childItem in menuItem.children"
          :key="childItem.text"
        >
          <router-link
            v-if="childItem.to"
            :to="childItem.to"
            :class="[getActive(childItem.to), { 'is--link': childItem.to }]"
            class="app-layout-default-header-navigation__item is--h6__title"
          >
            {{ childItem.text }}
          </router-link>
        </template>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.app-layout-default-header-navigation {
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

    @include media-lte(desktop-md) {
      display: none;
    }

    &.is--link:hover {
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
    height: $wd-header-height;
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
