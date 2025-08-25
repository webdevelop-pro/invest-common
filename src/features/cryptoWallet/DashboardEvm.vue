<script setup lang="ts">
import {
  computed, defineAsyncComponent, nextTick, watch,
} from 'vue';
import { useProfilesStore } from 'InvestCommon/domain/profiles/store/useProfiles';
import DashboardTabsTopInfo from '@/views/Dashboard/components/DashboardTabsTopInfo.vue';
import { storeToRefs } from 'pinia';
import { useRouter } from 'vue-router';
import { urlContactUs } from 'InvestCommon/global/links';
import DashboardEvmWalletTokens from './components/DashboardEvmWalletTokens.vue';
import { useSessionStore } from 'InvestCommon/domain/session/store/useSession';
import { useRepositoryEvm } from 'InvestCommon/data/evm/evm.repository';
import { useRepositoryProfiles } from 'InvestCommon/data/profiles/profiles.repository';

const EVM_WALLET_TAB_INFO = {
  title: 'Crypto Wallet',
  text: `
    Crypto wallet statuses and transactions
  `,
};

const VAlert = defineAsyncComponent({
  loader: () => import('UiKit/components/VAlert.vue'),
});

const router = useRouter();
const profilesStore = useProfilesStore();
const { selectedUserProfileId, selectedUserProfileData } = storeToRefs(profilesStore);
const userSessionStore = useSessionStore();
const { userLoggedIn } = storeToRefs(userSessionStore);
const useRepositoryProfilesStore = useRepositoryProfiles();
const { getProfileByIdState } = storeToRefs(useRepositoryProfilesStore);

  const evmRepository = useRepositoryEvm();
  const { getEvmWalletState, canLoadEvmWalletData } = storeToRefs(evmRepository);

    // KYC and wallet status logic
  const isWalletError = computed(() => getEvmWalletState.value.data?.isStatusAnyError || getEvmWalletState.value.error);
  const isKYCNeedToPass = computed(() => ((
    selectedUserProfileData.value.isKycNone || selectedUserProfileData.value.isKycNew
    || selectedUserProfileData.value.isKycPending) && !isWalletError.value));
  const isKYCInProgress = computed(() => (
    selectedUserProfileData.value.isKycInProgress && !isWalletError.value));
  const isWalletCreated = computed(() => (
    getEvmWalletState.value.data?.isStatusCreated && !isWalletError.value));
  const isError = computed(() => (
    selectedUserProfileData.value.isKycDeclined || isWalletError.value || selectedUserProfileData.value.isTypeSdira));

  const isAlertShow = computed(() => (
    (isKYCNeedToPass.value || isKYCInProgress.value || isWalletCreated.value || isError.value)
    && !getProfileByIdState.value.loading
  ));

  const isTopTextShow = computed(() => (
    !isWalletError.value && !selectedUserProfileData.value.isKycDeclined
  ));

  const isAlertType = computed(() => {
    if (isWalletCreated.value) return 'info';
    return 'error';
  });

  const isAlertText = computed(() => {
    if (isError.value) {
      return `Unfortunately, we were not able to create a wallet for you. Please <a href="${urlContactUs}">contact us</a>\n    to resolve the issue.`;
    }
    if (isWalletCreated.value) {
      return `This usually takes a few moments. If \n    it takes longer than expected, <a href="${urlContactUs}">contact us</a> for assistance.`;
    }
    if (isKYCNeedToPass.value) return `You need to <a href="/profile/${selectedUserProfileId.value}/kyc">pass KYC </a>\n    before you can make a transfer`;
    if (isKYCInProgress.value) return `Your KYC is in progress. You need to pass KYC before you can make a transfer`;
    return undefined;
  });

  const alertTitle = computed(() => {
    if (isKYCNeedToPass.value) return 'Identity verification is needed. ';
    if (isWalletCreated.value) return 'Your wallet is being created and verified.';
    return undefined;
  });

  const alertButtonText = computed(() => {
    if (isKYCNeedToPass.value) return 'Verify Identity';
    return undefined;
  });

  const updateData = async () => {
    if (canLoadEvmWalletData.value && !getEvmWalletState.value.loading && !getEvmWalletState.value.error) {
      await evmRepository.getEvmWalletByProfile(selectedUserProfileId.value);
    }
  };

  const onAlertButtonClick = () => {
    if (isKYCNeedToPass.value) {
      router.push({ name: 'ROUTE_SUBMIT_KYC', params: { profileId: selectedUserProfileId.value } });
    }
  };

  watch(() => [selectedUserProfileData.value.id, selectedUserProfileData.value.kyc_status], () => {
    nextTick(() => {
      if (canLoadEvmWalletData.value) updateData();
    });
  });
</script>

<template>
  <div class="DashboardEvmWallet dashboard-evm-wallet">
    <DashboardTabsTopInfo
      :title="EVM_WALLET_TAB_INFO.title"
      :text="isTopTextShow ? EVM_WALLET_TAB_INFO.text : null"
    />
    <VAlert
      v-if="isAlertShow"
      :variant="isAlertType"
      data-testid="funding-alert"
      class="dashboard-evm-wallet__alert"
      :button-text="alertButtonText"
      @click="onAlertButtonClick"
    >
      <template #title>
        {{ alertTitle }}
      </template>
      <template #description>
        <span v-html="isAlertText" />
      </template>
    </VAlert>
    <div
      v-if="!isWalletError"
      class="dashboard-evm-wallet__content"
    >
      <div class="dashboard-evm-wallet__transactions">
        <DashboardEvmWalletTokens
          :profile-id="selectedUserProfileId"
          :logged-in="userLoggedIn"
          :is-error="isAlertShow || selectedUserProfileData.isTypeSdira"
        />
      </div>
    </div>
  </div>
</template>

<style lang="scss">
.dashboard-evm-wallet {
  &__table-title {
    margin-right: 20px;
  }

  &__tooltip-activator {
    text-transform: uppercase;
    border-bottom: 1px dotted $primary;
    color: $black;
    transition: all .3s ease;

    &:hover {
      color: $primary;
      border-color: transparent;
    }
  }

  &__top-info {
    margin-top: 40px;
    margin-bottom: 40px;
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  &__table-top {
    margin-bottom: 20px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    font-size: 20px;
  }

  &__funds-button-wrap {
    display: flex;
    justify-content: flex-end;
    margin: 30px 0;
  }

  &__funds-button {
    width: 100%;
    max-width: 200px;

    & + & {
      margin-left: 10px;
    }
  }

  &__table-numbers {
    display: flex;
    justify-content: space-between;
    margin-bottom: 40px;
  }

  &__content {
    display: flex;
    align-items: flex-start;
    gap: 80px;

    @media screen and (max-width: $tablet){
      gap: 40px;
      flex-direction: column-reverse;
    }
  }

  &__transactions {
    width: 50%;

    @media screen and (max-width: $tablet){
      width: 100%;
    }
  }

  &__bank-accounts {
    width: 50%;

    @media screen and (max-width: $tablet){
      width: 100%;
    }
  }

  &__alert {
    margin-bottom: 40px !important;
  }
}
</style>
