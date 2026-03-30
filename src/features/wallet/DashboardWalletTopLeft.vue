<script setup lang="ts">
import { useWallet } from 'InvestCommon/features/wallet/logic/useWallet';
import DashboardWalletHeaderTotal from 'InvestCommon/features/wallet/components/DashboardWalletHeaderTotal.vue';

const {
  totalBalanceMainFormatted,
  totalBalanceCoins,
  isWalletDataLoading,
} = useWallet();
</script>

<template>
  <DashboardWalletHeaderTotal
    :amount="totalBalanceMainFormatted"
    :coin="totalBalanceCoins"
    :loading="isWalletDataLoading"
    class="DashboardWalletTopLeft dashboard-wallet-top-left"
  />
</template>
