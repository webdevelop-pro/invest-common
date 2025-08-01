<script setup lang="ts">
import VFormAuthAuthenticator from './components/VFormAuthAuthenticator.vue';
import { useGlobalLoader } from 'UiKit/store/useGlobalLoader';

useGlobalLoader().hide();
</script>

<template>
  <div class="ViewAuthenticator view-authenticator">
    <div class="view-authenticator__wrap">
      <h1 class="view-authenticator__title">
        Security Verification
      </h1>

      <p class="view-authenticator__subtitle">
        Enter the 6-digit code from your authentication app
      </p>

      <VFormAuthAuthenticator />
    </div>
  </div>
</template>

<style lang="scss">
.view-authenticator {
  width: 100%;
  padding-top: $header-height;
  min-height: 100vh;

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
    margin-bottom: 20px;
  }

  &__subtitle {
    text-align: center;
    margin-bottom: 40px;
  }
}
</style>
