<script setup lang="ts">
import { useGlobalLoader } from 'UiKit/store/useGlobalLoader';
import { onMounted } from 'vue';
import { useKycThirdParty } from './logic/useKycThirdParty';

const { launch, screen, status } = useKycThirdParty();
useGlobalLoader().hide();

onMounted(() => {
  void launch();
});
</script>

<template>
  <div class="ViewKYCThirdParty view-kyc-third-party is--page">
    <div
      class="view-kyc-third-party__panel"
      :data-state="status"
      data-testid="kyc-third-party-message"
    >
      <h2 class="view-kyc-third-party__title">
        {{ screen.title }}
      </h2>
      <p class="view-kyc-third-party__description is--subheading-1">
        {{ screen.description }}
      </p>
    </div>
  </div>
</template>

<style scoped lang="scss">
.view-kyc-third-party {
  width: 100%;
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;

  &__panel {
    max-width: 520px;
    margin: 0 auto;
    padding: 20px;
    text-align: center;
  }

  &__title {
    margin-bottom: 12px;
  }

  &__description {
    margin: 0;
  }
}
</style>
