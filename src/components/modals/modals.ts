/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-return */
import { defineAsyncComponent } from 'vue';

// eslint-disable-next-line object-curly-newline
import { useModal } from 'UiKit/components/BaseModal';
import { IInvest } from 'InvestCommon/types/api/invest';


export {
  useModal,
};

export const useLogoutModal = () => {
  const AsyncComponent = defineAsyncComponent(() => import(
    './WdModalLogOut.vue'
  ));

  return useModal(AsyncComponent);
};

export const useDocumentModal = () => {
  const AsyncComponent = defineAsyncComponent(() => import(
    './WdModalDocument.vue'
  ));

  type IPropsData = { signUrl: string; close: () => void; open: (url: string, domEl: string) => void };
  return useModal<IPropsData>(AsyncComponent, {
    maximized: true,
  });
};

export const usePortfolioWireModal = () => {
  const AsyncComponent = defineAsyncComponent(() => import(
    './WdModalPortfolioWire.vue'
  ));

  type IPropsData = { investment: IInvest; userName: string };
  return useModal<IPropsData>(AsyncComponent);
};

export const usePortfolioTransactionModal = () => {
  const AsyncComponent = defineAsyncComponent(() => import(
    './WdModalPortfolioTransaction.vue'
  ));

  type IPropsData = { investment: IInvest };
  return useModal<IPropsData>(AsyncComponent);
};

export const usePortfolioCancelInvestmentModal = () => {
  const AsyncComponent = defineAsyncComponent(() => import(
    './WdModalPortfolioCancelInvestment.vue'
  ));

  type IPropsData = { investment: IInvest };
  return useModal<IPropsData>(AsyncComponent);
};

export const useWalletAddTransactionModal = () => {
  const AsyncComponent = defineAsyncComponent(() => import(
    './WdModalWalletAddTransaction.vue'
  ));

  type IPropsData = { transactionType: string };
  return useModal<IPropsData>(AsyncComponent);
};

