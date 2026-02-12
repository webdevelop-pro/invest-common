import { computed } from 'vue';
import type { VMoreActionsItem } from 'UiKit/components/Base/VMoreActions';

export type PrimaryActionButton = {
  id: string | number;
  label: string;
  variant?: string;
  disabled?: boolean;
  loading?: boolean;
  icon?: unknown;
  transactionType?: unknown;
};

export interface DashboardWalletHeaderProps {
  amount: string | number;
  coin?: string;
  loading?: boolean;
  buttons: PrimaryActionButton[];
  moreButtons?: PrimaryActionButton[];
}

export type DashboardWalletHeaderEmit = (e: 'click', id: string | number, transactionType?: unknown) => void;

export function useDashboardWalletHeader(
  props: Readonly<DashboardWalletHeaderProps>,
  emit: DashboardWalletHeaderEmit,
) {
  const visibleButtons = computed(() => props.buttons);

  const moreActionsItems = computed(
    (): VMoreActionsItem[] => (props.moreButtons ?? []).map((b) => ({
      id: b.id,
      label: b.label,
      icon: b.icon,
      disabled: b.disabled,
      transactionType: b.transactionType,
    })),
  );

  const handleClick = (button: PrimaryActionButton) => {
    emit('click', button.id, button.transactionType);
  };

  const handleMoreSelect = (item: VMoreActionsItem) => {
    handleClick(item as PrimaryActionButton);
  };

  return {
    visibleButtons,
    moreActionsItems,
    handleClick,
    handleMoreSelect,
  };
}

