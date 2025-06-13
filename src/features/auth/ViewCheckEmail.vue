<script setup lang="ts">
import VFormAuthVerification from './components/VFormAuthVerification.vue';
import { useGlobalLoader } from 'InvestCommon/store';

useGlobalLoader().hide();
</script>

<template>
  <div class="ViewCheckEmail view-check-email">
    <div class="view-check-email__wrap">
      <h1 class="view-check-email__title">
        Check Your Email
      </h1>

      <VFormAuthVerification />
    </div>
  </div>
</template>

<style lang="scss">
.view-check-email {
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
