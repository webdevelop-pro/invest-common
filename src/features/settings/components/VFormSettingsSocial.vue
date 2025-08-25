<script setup lang="ts">
import VButton from 'UiKit/components/Base/VButton/VButton.vue';
import { capitalizeFirstLetter } from 'UiKit/helpers/text';
import checkIcon from 'UiKit/assets/images/circle-check.svg';
import { useSettingsSocial } from './logic/useSettingsSocial';

const { data, onSocialLoginHandler } = useSettingsSocial();
</script>

<template>
  <div class="VFormSettingsSocial v-form-setting-social">
    <div
      v-for="item in data"
      :key="item?.provider"
      class="v-form-setting-social__item"
    >
      <checkIcon
        v-if="item?.linked || item?.disabled"
        class="v-form-setting-social__icon"
      />
      <VButton
        variant="outlined"
        size="small"
        :color="item?.linked ? 'secondary' : 'primary'"
        :class="item?.classes"
        @click.stop.prevent="onSocialLoginHandler(item?.provider, !item?.linked)"
      >
        <component
          :is="item?.icon"
          :alt="item?.classes"
          class="v-form-setting-social__item-icon"
        />
        <component
          :is="item?.iconHover"
          :alt="item?.classes"
          class="v-form-setting-social__item-icon-hover"
        />
        <span v-if="!item.disabled">
          {{ item?.linked ? 'Unlink ' : 'Link ' }}
        </span>
        {{ capitalizeFirstLetter(item?.provider || '') }}
      </VButton>
    </div>
  </div>
</template>

<style lang="scss">
@use 'UiKit/styles/_colors.scss' as colors;
@use 'UiKit/styles/_variables.scss' as *;

.v-form-setting-social {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: flex-end;
  gap: 8px;
  align-self: stretch;
  width: 190px;

  @media screen and (max-width: $desktop) {
      flex-direction: row;
      width: 100%;
      flex-wrap: wrap;
    }

  &__icon {
    margin-right: 8px;
    width: 16px;
    flex-shrink: 0;
    color: colors.$secondary;
  }

  &__item-icon,
  &__item-icon-hover {
    width: 16px;
    height: 16px;
    transition: all 0.3s ease;
  }

  &__item-icon-hover {
    display: none;
    transition: all 0.3s ease;
  }

  &__item {
    flex: 1 1 auto;
    display: flex;
    align-items: center;
    width: 190px;
    flex-shrink: 0;
    justify-content: end;

    @media screen and (max-width: $desktop) {
      flex-direction: row-reverse;
      justify-content: flex-end;
    }

    &:hover {
      .v-form-setting-social__item-icon {
        display: none;
        transition: all 0.3s ease;
      }
      .v-form-setting-social__item-icon-hover {
        display: block;
        transition: all 0.3s ease;
      }
    }
  }

  .v-button {
    width: 166px;
  }
}
</style>
