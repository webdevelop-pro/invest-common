<script setup lang="ts">
import VButton from 'UiKit/components/Base/VButton/VButton.vue';
import plus from 'UiKit/assets/images/plus.svg?component';
import VInfoBankAccountItem from 'UiKit/components/VInfo/VInfoBankAccountItem.vue';
import { useSettingsBankAccounts } from './logic/useSettingsBankAccounts';

const {
  fundingSource,
  isCanAddBankAccount,
  isLinkBankAccountLoading,
  deleteLinkedAccountState,
  onAddAccountClick,
  onDeleteAccountClick,
  showSkeletonPlaceholders,
  skeletonItemCount,
} = useSettingsBankAccounts();
</script>

<template>
  <div class="settings-bank-accounts">
    <h2 class="settings-bank-accounts__title">
      Connected Bank Accounts
    </h2>

    <div
      v-if="fundingSource.length > 0"
      class="settings-bank-accounts__list"
    >
      <template v-if="showSkeletonPlaceholders">
        <VInfoBankAccountItem
          v-for="i in skeletonItemCount"
          :key="`skeleton-${i}`"
          loading
        />
      </template>
      <template v-else>
        <VInfoBankAccountItem
          v-for="item in fundingSource"
          :key="item.id"
          :bank-name="item.bank_name"
          :name="item.name"
          :last4="item.last4"
          :loading="deleteLinkedAccountState.loading"
          @delete="onDeleteAccountClick(item.id)"
        />
      </template>
    </div>

    <VButton
      :disabled="!isCanAddBankAccount"
      :loading="isLinkBankAccountLoading"
      variant="link"
      block
      class="settings-bank-accounts__add-btn"
      data-testid="funding-add-account-btn"
      @click="onAddAccountClick"
    >
      <plus
        alt=""
        class="settings-bank-accounts__add-btn-icon"
      />
      Add Bank Account
    </VButton>
  </div>
</template>

<style lang="scss">
.settings-bank-accounts {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 40px;
  flex: 1 0 0;

  &__title {
    margin: 0;
  }

  &__list {
    width: 100%;
  }

  &__add-btn-icon {
    width: 16px;
    height: 16px;
  }
}
</style>