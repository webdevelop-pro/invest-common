<script setup lang="ts">
import { useGlobalLoader } from 'InvestCommon/store';
import { onMounted } from 'vue';
import { useKycThirdParty } from './store/useKycThirdParty';

const kycThirdPartyStore = useKycThirdParty();
useGlobalLoader().hide();
onMounted(() => {
  kycThirdPartyStore.handlePlaidKycThirdParty();
});
</script>

<template>
  <div class="ViewKYCThirdParty view-kyc-third-party is--page" />
</template>

<style lang="scss">
.view-kyc-third-party {
  width: 100%;
  min-height: 100vh;
}
</style>
