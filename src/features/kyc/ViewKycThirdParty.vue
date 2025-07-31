<script setup lang="ts">
import { useGlobalLoader } from 'InvestCommon/store';
import { onMounted } from 'vue';
import { useKycThirdParty } from './store/useKycThirdParty';

const { handlePlaidKycThirdParty, plaidSuccess } = useKycThirdParty();
useGlobalLoader().hide();

onMounted(() => {
  handlePlaidKycThirdParty();
});
</script>

<template>
  <div class="ViewKYCThirdParty view-kyc-third-party is--page">
    <div
      v-if="plaidSuccess"
      class="kyc-success-message"
    >
      <h2>
        Thank you for completing KYC
      </h2>
      <p class="is--subheading-1">
        Your KYC process is now complete.
      </p>
    </div>
  </div>
</template>

<style lang="scss">
.view-kyc-third-party {
  width: 100%;
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
}
.kyc-success-message {
  text-align: center;
  margin: 0 auto;
  padding: 20px;
}
</style>
