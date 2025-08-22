<script setup lang="ts">
import VButton from 'UiKit/components/Base/VButton/VButton.vue';
import { useRouter, type RouteLocationRaw } from 'vue-router';
import VBreadcrumbs from 'UiKit/components/VBreadcrumb/VBreadcrumbsList.vue';
import type { IBreadcrumb } from 'UiKit/components/VBreadcrumb/VBreadcrumbsList.vue';
import { PropType } from 'vue';
import arrowLeft from 'UiKit/assets/images/arrow-left.svg';

const props = defineProps({
  buttonText: String,
  buttonRoute: {
    type: [String, Object] as PropType<RouteLocationRaw>,
    default: undefined,
  },
  breadcrumbs: Object as PropType<IBreadcrumb[]>,
  isDisabledButton: {
    type: Boolean,
    default: false,
  },
  isLoading: {
    type: Boolean,
    default: false,
  },
});

const emit = defineEmits(['save']);

const router = useRouter();

const onBackClick = () => {
  if (props.buttonRoute) {
    router.push(props.buttonRoute);
  } else {
    router.back();
  }
};

const saveHandler = () => {
  emit('save');
};
</script>

<template>
  <div
    class="VLayoutForm layout-back-button"
    :class="{ 'is--loading': isLoading }"
  >
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
        <div class="layout-back-button__right-footer">
          <VButton
            size="large"
            variant="outlined"
            @click="onBackClick"
          >
            Cancel
          </VButton>
          <VButton
            size="large"
            :disabled="isDisabledButton"
            :loading="isLoading"
            @click="saveHandler"
          >
            Save
          </VButton>
        </div>
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
@use 'UiKit/styles/_variables.scss' as *;
.layout-back-button {
  $root: &;

  width: 100%;
  padding-top: $header-height;
  margin-bottom: 60px;

  &.is--loading {
    cursor: wait !important;
  }

  &__container {
    width: 100%;
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    padding-top: 40px;
    gap: 85px;
    margin-bottom: 130px;

    @media screen and (max-width: $desktop){
      flex-direction: column;
      gap: 40px;
    }
  }

  &__left {
    flex-shrink: 0;
  }

  &__right {
    width: 100%;

    #{$root}.is--loading & {
      opacity: 0.5;
      pointer-events: none;
    }
  }

  &__back-icon {
    width: 20px;
  }

  &__right-footer {
    display: flex;
    justify-content: flex-end;
    align-items: flex-start;
    gap: 12px;
    margin-top: 40px;
  }
}
</style>
