<template>
  <div class="wd-layout-default">
    <div
      class="wd-layout-default__main"
    >
      <div
        class="wd-layout-default__content wd-container"
      >
        <WdError500 v-if="isError500" />

        <template v-else>
          <div
            v-if="title || $slots.title"
            class="wd-layout-default__title-container"
          >
            <slot name="title">
              <h1
                v-if="title"
                class="wd-layout-default__title"
                v-text="title"
              />
            </slot>
          </div>

          <div
            v-if="details || $slots.details"
            class="wd-layout-default__details-container"
          >
            <slot name="details">
              <h2
                class="wd-layout-default__details"
                v-text="details"
              />
            </slot>
          </div>

          <div
            v-if="$slots.breadcrumbs"
            class="wd-layout-default__breadcrumbs-container"
          >
            <slot name="breadcrumbs" />
          </div>

          <slot />
        </template>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useCore } from 'InvestCommon/store';

import WdError500 from 'InvestCommon/components/common/WdError500.vue';

export default defineComponent({
  name: 'WdLayoutDefault',
  components: {
    WdError500,
  },
  props: {
    title: String,
    details: String,
    checkKyc: Boolean,
    withScrollUp: Boolean,
  },
  setup() {
    const route = useRoute();
    const router = useRouter();
    const { person } = useCore();

    const isError500 = computed(() => {
      const queryParams = { ...route.query };
      if (person.value.isServerError) void router.replace({ ...route, query: { ...queryParams, error500: '1' } });
      else if (route.query?.error500) {
        delete queryParams.error500;
        void router.replace({ ...route, query: queryParams });
      }
      return person.value.isServerError;
    });

    return {
      isError500,
    };
  },
});
</script>

<style lang="scss">
.wd-layout-default {
  $root: &;

  position: relative;
  z-index: 1;
  width: 100%;
  padding-bottom: 50px;
  overflow: hidden; // need for 1060px and overflow bg-grass.svg
  background: $wd-color-white;

  @include media-lte(tablet) {
    padding-bottom: 30px;
  }

  &.view-terms {
    #{$root}__details-container {
      margin: 0 0 30px;
    }
  }

  &__content {
    position: relative;
    z-index: 3;
    margin: 60px auto 30px;

    &.is-content-835 {
      max-width: 835px;
    }

    &.is-content-575 {
      max-width: 575px;
    }

    @include media-lte(tablet) {
      margin: 30px auto;
    }
  }

  &__title-container {
    margin-bottom: 14px;
  }

  &__details-container {
    margin-bottom: 15px;
  }

  &__breadcrumbs-container {
    margin-bottom: 15px;
  }

  &__title-container + &__details-container,
  &__title-container + &__breadcrumbs-container {
    margin-top: -14px;
  }

  &__title,
  &__details {
    line-height: 100%;
    color: $wd-color-text-black;
    letter-spacing: 0.01em;
  }

  &__title {
    font-size: 33px;
    font-weight: 300;
  }

  &__details {
    font-size: 18px;
    font-weight: 300;
  }

  &__scroll-up-btn {
    z-index: 1;
  }

  &__whale {
    top: 250px;
    right: 40px;
  }

  &__grass {
    top: 230px;
    left: -64px;
  }

  &__mountain {
    top: 106px;
    right: -0.44%;
  }

  &__small-fishes {
    top: 657.38px;
    left: 115px;
    width: 1315.6px;
    height: 817.28px;
  }

  .is-bg-img {
    position: absolute;
    z-index: 2;
    display: none;

    @include media-gte(desktop) {
      display: block;
    }
  }

  & &__warning-message {
    top: 50%;
    z-index: 3;
    transform: translateY(-50%);
  }
}
</style>
