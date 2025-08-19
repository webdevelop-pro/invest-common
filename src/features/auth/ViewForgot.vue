<script setup lang="ts">
import VFormAuthForgot from './components/VFormAuthForgot.vue';
import { useGlobalLoader } from 'UiKit/store/useGlobalLoader';

useGlobalLoader().hide();
</script>

<template>
  <div class="ViewForgot view-forgot">
    <div class="view-forgot__wrap">
      <h1 class="view-forgot__title">
        Forgot Password
      </h1>

      <VFormAuthForgot />
    </div>
  </div>
</template>

<style lang="scss">
.view-forgot {
  width: 100%;
  padding-top: $header-height;

  &__wrap {
    max-width: 558px;
    margin: 40px auto 130px;

    @media screen and (width < $tablet){
      margin: 40px auto 100px;
      padding: 0 15px;
    }
  }

  &__title {
    text-align: center;
    margin-bottom: 40px;
  }
}
</style>
