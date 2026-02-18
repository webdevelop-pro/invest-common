import { useSettingsBankAccounts } from 'InvestCommon/features/settings/components/logic/useSettingsBankAccounts';

export interface DashboardWalletAlertEmit {
  (e: 'click'): void;
  (e: 'contactUsClick', event: Event): void;
}

export function useDashboardWalletAlert(emit: DashboardWalletAlertEmit) {
  const { onAddAccountClick, isLinkBankAccountLoading } = useSettingsBankAccounts({ skipInitialUpdate: true });

  const handleDescriptionClick = (event: Event) => {
    const target = event.target as HTMLElement;
    const link = target?.closest('a[href]') as HTMLAnchorElement | null;

    if (link?.href && link.href.includes('bank-accounts')) {
      event.preventDefault();
      event.stopPropagation();
      void onAddAccountClick();
      return;
    }

    const contactUsTarget = target?.closest('[data-action="contact-us"]');
    if (contactUsTarget) {
      event.preventDefault();
      event.stopPropagation();
      emit('contactUsClick', event);
    }
  };

  return {
    handleDescriptionClick,
    isLinkBankAccountLoading,
  };
}

