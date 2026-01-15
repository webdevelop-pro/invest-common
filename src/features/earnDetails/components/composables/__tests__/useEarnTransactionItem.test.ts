import { describe, it, expect } from 'vitest';
import { useEarnTransactionItem, type IEarnTransaction } from '../useEarnTransactionItem';

describe('useEarnTransactionItem', () => {
  const mockTransaction: IEarnTransaction = {
    id: 1,
    date: '2024-01-15',
    time: '10:30',
    amount: '$1,000.00',
    transaction_id: 'tx-123',
    type: 'deposit',
    status: {
      text: 'Completed',
      tooltip: 'Transaction completed',
    },
    tagColor: 'green',
  };

  describe('formattedType', () => {
    it('should capitalize first letter of transaction type', () => {
      const composable = useEarnTransactionItem({
        data: mockTransaction,
        loading: false,
      });
      expect(composable.formattedType.value).toBe('Deposit');
    });

    it('should handle withdraw type', () => {
      const withdrawTx = { ...mockTransaction, type: 'withdraw' };
      const composable = useEarnTransactionItem({
        data: withdrawTx,
        loading: false,
      });
      expect(composable.formattedType.value).toBe('Withdraw');
    });

    it('should return empty string when type is undefined', () => {
      const txWithoutType = { ...mockTransaction, type: undefined as any };
      const composable = useEarnTransactionItem({
        data: txWithoutType,
        loading: false,
      });
      expect(composable.formattedType.value).toBe('');
    });

    it('should return empty string when data is undefined', () => {
      const composable = useEarnTransactionItem({
        data: undefined,
        loading: false,
      });
      expect(composable.formattedType.value).toBe('');
    });
  });

  describe('hasTransactionId', () => {
    it('should return true when transaction_id exists', () => {
      const composable = useEarnTransactionItem({
        data: mockTransaction,
        loading: false,
      });
      expect(composable.hasTransactionId.value).toBe(true);
    });

    it('should return false when transaction_id is missing', () => {
      const txWithoutId = { ...mockTransaction, transaction_id: '' };
      const composable = useEarnTransactionItem({
        data: txWithoutId,
        loading: false,
      });
      expect(composable.hasTransactionId.value).toBe(false);
    });

    it('should return false when data is undefined', () => {
      const composable = useEarnTransactionItem({
        data: undefined,
        loading: false,
      });
      expect(composable.hasTransactionId.value).toBe(false);
    });
  });

  describe('badgeColor', () => {
    it('should map green tagColor to secondary-light badge', () => {
      const composable = useEarnTransactionItem({
        data: { ...mockTransaction, tagColor: 'green' },
        loading: false,
      });
      expect(composable.badgeColor.value).toBe('secondary-light');
    });

    it('should map GREEN (uppercase) tagColor to secondary-light badge', () => {
      const composable = useEarnTransactionItem({
        data: { ...mockTransaction, tagColor: 'GREEN' },
        loading: false,
      });
      expect(composable.badgeColor.value).toBe('secondary-light');
    });

    it('should map red tagColor to red-light badge', () => {
      const composable = useEarnTransactionItem({
        data: { ...mockTransaction, tagColor: 'red' },
        loading: false,
      });
      expect(composable.badgeColor.value).toBe('red-light');
    });

    it('should map yellow tagColor to yellow-light badge', () => {
      const composable = useEarnTransactionItem({
        data: { ...mockTransaction, tagColor: 'yellow' },
        loading: false,
      });
      expect(composable.badgeColor.value).toBe('yellow-light');
    });

    it('should return default badge for unknown colors', () => {
      const composable = useEarnTransactionItem({
        data: { ...mockTransaction, tagColor: 'blue' },
        loading: false,
      });
      expect(composable.badgeColor.value).toBe('default');
    });

    it('should return undefined when tagColor is missing', () => {
      const txWithoutColor = { ...mockTransaction, tagColor: undefined as any };
      const composable = useEarnTransactionItem({
        data: txWithoutColor,
        loading: false,
      });
      expect(composable.badgeColor.value).toBeUndefined();
    });

    it('should return undefined when data is undefined', () => {
      const composable = useEarnTransactionItem({
        data: undefined,
        loading: false,
      });
      expect(composable.badgeColor.value).toBeUndefined();
    });

    it('should handle color strings that contain the color name', () => {
      const composable = useEarnTransactionItem({
        data: { ...mockTransaction, tagColor: 'light-green' },
        loading: false,
      });
      expect(composable.badgeColor.value).toBe('secondary-light');
    });
  });
});

