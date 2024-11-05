<template>
  <div class="error-500">
    <div class="error-500__content">
      <h1 class="error-500__title">
        System Error
      </h1>
      <p class="error-500__description">
        Oops, server response with an error
        please try again in a couple minutes
      </p>
      <BaseButton
        class="error-500__btn"
        @click="onClick"
      >
        Try again
      </BaseButton>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { useRouter } from 'vue-router';

import BaseButton from 'UiKit/components/BaseButton/BaseButton.vue';

export default defineComponent({
  name: 'WdError500',
  components: {
    BaseButton,
  },
  setup() {
    const router = useRouter();

    const onClick = () => {
      void router.go(0);
    };

    return {
      onClick,
    };
  },
});
</script>

<style lang="scss" scoped>
.error-500 {
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background-color: $white;
  padding: 150px 0;

  &__content {
    width: 100%;
    color: $black;
    text-align: center;
  }

  &__title {
    margin-bottom: 10px;
    font-size: 44px;
    font-weight: 900;
    line-height: 64px;

    @include media-lt(tablet) {
      font-size: 35px;
      line-height: 54px;
    }
  }

  &__description {
    margin-bottom: 21px;
    font-size: 17px;
    font-weight: 400;
  }

  &__btn {
    width: 190px;
  }
}
</style>
