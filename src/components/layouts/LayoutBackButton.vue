<script setup lang="ts">
import VButton from 'UiKit/components/Base/VButton/VButton.vue';
import { useRouter } from 'vue-router';
import VBreadcrumbs, { IBreadcrumb } from 'UiKit/components/VBreadcrumbs/VBreadcrumbs.vue';
import { PropType } from 'vue';
import arrowLeft from 'UiKit/assets/images/arrow-left.svg';

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
    <div class="is--container layout-back-button__container">
      <div class="layout-back-button__left">
        <VButton
          variant="link"
          size="large"
          icon-placement="left"
          @click.stop="onBackClick"
        >
          <arrowLeft
            alt="arrow left"
            class="layout-back-button__back-icon"
          />
          {{ buttonText }}
        </VButton>
      </div>
      <div class="layout-back-button__right">
        <slot />
      </div>
    </div>
    <div class="is--container layout-back-button__footer">
      <VBreadcrumbs
        :data="breadcrumbs"
        class="layout-back-button__breadcrumbs"
      />
    </div>
  </div>
</template>


<style lang="scss">
.layout-back-button {
  width: 100%;
  padding-top: $header-height;
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
