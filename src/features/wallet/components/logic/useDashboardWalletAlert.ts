export interface DashboardWalletAlertEmit {
  (e: 'click'): void;
  (e: 'contactUsClick', event: Event): void;
}

export function useDashboardWalletAlert(emit: DashboardWalletAlertEmit) {
  const handleDescriptionClick = (event: Event) => {
    const target = (event.target as HTMLElement)?.closest('[data-action="contact-us"]');
    if (target) {
      event.preventDefault();
      event.stopPropagation();
      emit('contactUsClick', event);
    }
  };

  return {
    handleDescriptionClick,
  };
}

