import type { Component } from 'vue';

/** Payload emitted by VFilter @apply - used by tokens and transactions composables */
export interface WalletFilterApplyPayload {
  value: string;
  model: string[];
}

export type WalletFilterApplyHandler = (items: WalletFilterApplyPayload[]) => void;

/** Filter item shape for VFilter (title, options, model) */
export interface WalletFilterItem {
  value: string;
  title: string;
  options: string[];
  model: string[];
}

/** Table config shape returned by useWalletTokens / useWalletTransactions (first table in array) */
export interface DashboardWalletTableConfig {
  header: { text?: string }[];
  data: unknown[];
  loading?: boolean;
  rowLength?: number;
  colspan?: number;
  tableRowComponent: Component;
  infiniteScroll?: boolean;
  infiniteScrollDisabled?: boolean;
  onLoadMore?: () => void;
}
