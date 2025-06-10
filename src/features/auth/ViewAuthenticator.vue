<script setup lang="ts">
import VFormAuthAuthenticator from 'InvestCommon/components/forms/ory/VFormAuthAuthenticator.vue';
import { useGlobalLoader } from 'InvestCommon/store';

useGlobalLoader().hide();
</script>

<template>
  <div class="ViewAuthenticator view-authenticator">
    <div class="view-authenticator__wrap">
      <h1 class="view-authenticator__title">
        2-Step Verification
      </h1>

      <p class="is--color-red view-authenticator__subtitle">
        Please complete the second authentication challenge.
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
  }

  &__title {
    text-align: center;
    margin-bottom: 20px;
  }

  &__subtitle {
    text-align: center;
    margin-bottom: 20px;
  }

  &__separator {
    margin: 40px 0;
  }
}
</style>
