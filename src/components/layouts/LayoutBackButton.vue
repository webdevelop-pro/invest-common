<script setup lang="ts">
import BaseButton from 'UiKit/components/BaseButton/BaseButton.vue';
import { useRouter } from 'vue-router';
import BaseBreadcrumbs, { IBreadcrumb } from 'UiKit/components/BaseBreadcrumbs/BaseBreadcrumbs.vue';
import { PropType } from 'vue';
import { BaseSvgIcon } from 'UiKit/components/BaseSvgIcon';

defineProps({
  buttonText: String,
  breadcrumbs: Object as PropType<IBreadcrumb[]>,
});

const router = useRouter();

const onBackClick = () => {
  void router.back();
};
</script>

<template>
  <div class="LayoutBackButton layout-back-button">
    <div class="wd-container layout-back-button__container">
      <div class="layout-back-button__left">
        <BaseButton
          variant="link"
          size="large"
          icon-placement="left"
          @click.stop="onBackClick"
        >
          <BaseSvgIcon
            name="arrow-left"
            alt="arrow left"
            class="layout-back-button__back-icon"
          />
          {{ buttonText }}
        </BaseButton>
      </div>
      <div class="layout-back-button__right">
        <slot />
      </div>
    </div>
    <div class="wd-container layout-back-button__footer">
      <BaseBreadcrumbs
        :data="breadcrumbs"
        class="layout-back-button__breadcrumbs"
      />
    </div>
  </div>
</template>


<style lang="scss" scoped>
.layout-back-button {
  width: 100%;
  padding-top: $wd-header-height;
  margin-bottom: 60px;

  &__container {
    width: 100%;
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    padding-top: 40px;
    gap: 85px;
    margin-bottom: 130px;
  }

  &__left {
    flex-shrink: 0;
  }

  &__right {
    max-width: 852px;
    width: 100%;
  }

  &__back-icon {
    width: 20px;
  }
}
</style>
