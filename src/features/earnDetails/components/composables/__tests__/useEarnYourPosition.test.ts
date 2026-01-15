import { describe, it, expect } from 'vitest';
import { useEarnYourPosition, type StatItem } from '../useEarnYourPosition';
import type { IEarnTransaction } from '../useEarnTransactionItem';

describe('useEarnYourPosition', () => {
  const mockStats: StatItem[] = [
    {
      label: 'Amount Staked:',
      amount: 1000,
      valueInUsd: '$1,000.00',
    },
    {
      label: 'Earned:',
      amount: 50,
      valueInUsd: '$50.00',
    },
  ];

  const mockTransactions: IEarnTransaction[] = [
    {
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
    },
    {
      id: 2,
      date: '2024-01-14',
      time: '09:15',
      amount: '$500.00',
      transaction_id: 'tx-456',
      type: 'withdraw',
      status: {
        text: 'Pending',
        tooltip: 'Transaction is pending',
      },
      tagColor: 'red',
    },
  ];

  describe('balances', () => {
    it('should map stats to balance format', () => {
      const composable = useEarnYourPosition({
        stats: mockStats,
        transactions: mockTransactions,
        loading: false,
      });

      const balances = composable.balances.value;
      expect(balances).toHaveLength(2);
      expect(balances[0]).toEqual({
        title: 'Amount Staked:',
        balance: '$1,000.00',
      });
      expect(balances[1]).toEqual({
        title: 'Earned:',
        balance: '$50.00',
      });
    });

    it('should return empty array when stats are undefined', () => {
      const composable = useEarnYourPosition({
        stats: undefined,
        transactions: mockTransactions,
        loading: false,
      });

      expect(composable.balances.value).toEqual([]);
    });

    it('should return empty array when stats is empty', () => {
      const composable = useEarnYourPosition({
        stats: [],
        transactions: mockTransactions,
        loading: false,
      });

      expect(composable.balances.value).toEqual([]);
    });
  });

  describe('tables', () => {
    it('should create table configuration with transactions', () => {
      const composable = useEarnYourPosition({
        stats: mockStats,
        transactions: mockTransactions,
        loading: false,
      });

      const tables = composable.tables.value;
      expect(tables).toHaveLength(1);
      
      const table = tables[0];
      expect(table.title).toBe('Transactions:');
      expect(table.header).toHaveLength(5);
      expect(table.header[0].text).toBe('Date');
      expect(table.header[1].text).toBe('Transaction ID');
      expect(table.header[2].text).toBe('Type');
      expect(table.header[3].text).toBe('Status');
      expect(table.header[4].text).toBe('Amount');
      expect(table.data).toEqual(mockTransactions);
      expect(table.loading).toBe(false);
      expect(table.rowLength).toBe(5);
      expect(table.colspan).toBe(5);
    });

    it('should set loading to true when loading prop is true', () => {
      const composable = useEarnYourPosition({
        stats: mockStats,
        transactions: mockTransactions,
        loading: true,
      });

      const tables = composable.tables.value;
      expect(tables[0].loading).toBe(true);
    });

    it('should default loading to false when not provided', () => {
      const composable = useEarnYourPosition({
        stats: mockStats,
        transactions: mockTransactions,
      });

      const tables = composable.tables.value;
      expect(tables[0].loading).toBe(false);
    });

    it('should use empty array for transactions when undefined', () => {
      const composable = useEarnYourPosition({
        stats: mockStats,
        transactions: undefined,
        loading: false,
      });

      const tables = composable.tables.value;
      expect(tables[0].data).toEqual([]);
    });

    it('should include tableRowComponent', () => {
      const composable = useEarnYourPosition({
        stats: mockStats,
        transactions: mockTransactions,
        loading: false,
      });

      const tables = composable.tables.value;
      expect(tables[0].tableRowComponent).toBeDefined();
    });
  });
});

