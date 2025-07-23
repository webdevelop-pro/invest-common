<script setup lang="ts">
import { storeToRefs } from 'pinia';
import VButton from 'UiKit/components/Base/VButton/VButton.vue';
import InfoSlot from 'UiKit/components/VInfo/VInfoSlot.vue';
import VSkeleton from 'UiKit/components/Base/VSkeleton/VSkeleton.vue';
import plus from 'UiKit/assets/images/plus.svg?component';
import closeIcon from 'UiKit/assets/images/close.svg?component';
import { useWalletBankAccounts } from './store/useWalletBankAccounts';
import { watch } from 'vue';

const props = defineProps({
  profileData: {
    type: Object,
    required: true,
  },
  loggedIn: {
    type: Boolean,
    required: true,
  },
  isError: Boolean,
});

const walletBankAccountsStore = useWalletBankAccounts();
const {
  fundingSource,
  isCanAddBankAccount,
  isLinkBankAccountLoading,
  isSkeleton,
  deleteLinkedAccountState,
} = storeToRefs(walletBankAccountsStore);

watch(() => [props.profileData, props.loggedIn], ([newProfileData, newLoggedIn]) => {
  walletBankAccountsStore.setProfileContext(newProfileData, Boolean(newLoggedIn));
}, { immediate: true });
</script>

<template>
  <div class="DashboardWalletBankAccounts dashboard-wallet-bank-accounts">
    <div class="dashboard-wallet-bank-accounts__top">
      <span class="dashboard-wallet-bank-accounts__title is--h3__title">
        Connected Bank Accounts
      </span>

      <VButton
        :disabled="!isCanAddBankAccount"
        :loading="isLinkBankAccountLoading"
        icon-placement="left"
        size="small"
        variant="link"
        class="dashboard-wallet-bank-accounts__button"
        data-testid="funding-add-account-btn"
        @click="walletBankAccountsStore.onAddAccountClick"
      >
        <plus
          alt="plus icon"
          class="dashboard-wallet-bank-accounts__button-icon"
        />
        Add Bank Account
      </VButton>
    </div>
    <VSkeleton
      v-if="isSkeleton"
      height="22px"
      width="100%"
      class="dashboard-wallet-bank-accounts__skeleton"
    />
    <div
      v-else
      class="dashboard-wallet-bank-accounts__form"
    >
      <InfoSlot
        v-for="item in fundingSource"
        :key="item.id"
      >
        <div class="dashboard-wallet-bank-accounts__item">
          <div class="dashboard-wallet-bank-accounts__item-text">
            <span
              v-if="item.bank_name || item.name"
              class="is--h6__title is--color-gray-70"
            >
              {{ item.bank_name }}: {{ item.name }}
            </span>
            <span
              v-if="item.last4"
              class="is--body is--color-gray-80"
            >
              **** {{ item.last4 }}
            </span>
          </div>

          <VButton
            :loading="deleteLinkedAccountState.loading"
            size="small"
            variant="link"
            icon-only
            class="dashboard-wallet-bank-accounts__item-button"
            @click="walletBankAccountsStore.onDeleteAccountClick(item.id)"
          >
            <closeIcon
              alt="close icon"
              class="dashboard-wallet-bank-accounts__button-icon"
            />
          </VButton>
        </div>
      </InfoSlot>
    </div>
  </div>
</template>

<style lang="scss">
.dashboard-wallet-bank-accounts {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 16px;
  flex: 1 0 0;

  &__top {
    display: flex;
    align-items: center;
    gap: 12px;
    align-self: stretch;

    @media screen and (max-width: $tablet){
      flex-direction: column;
      align-items: flex-start;
    }
  }

  &__title {
    flex: 1 0 0;
  }

  &__form {
    width: 100%;
  }

  &__button-icon {
    width: 16px;
  }

  &__item-text {
    display: flex;
    flex-direction: column;
    gap: 8px;
    flex: 1 0 0;
  }

  &__item {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    width: 100%;
  }
}
</style>
