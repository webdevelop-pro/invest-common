import { describe, it, expect } from 'vitest';
import { useEarnTopInfo, type InfoDataItem } from '../useEarnTopInfo';
import type { DefiLlamaYieldPoolFormatted } from 'InvestCommon/data/3dParty/formatter/yields.formatter';

describe('useEarnTopInfo', () => {
  const mockPoolData: DefiLlamaYieldPoolFormatted = {
    pool: 'pool-123',
    symbol: 'USDC',
    apy: 5.5,
    tvlUsd: 1000000,
    chain: 'ethereum',
    project: 'Aave',
  };

  const mockInfoData: InfoDataItem[] = [
    { text: 'TVL:', value: '$1,000,000' },
    { text: 'APY:', value: '5.5%' },
    { text: 'Base APY:', value: '4.0%' },
    { text: 'Reward APY:', value: '1.5%' },
  ];

  describe('defaultSymbol', () => {
    it('should return pool symbol when poolData exists', () => {
      const composable = useEarnTopInfo({
        poolData: mockPoolData,
        loading: false,
        infoData: mockInfoData,
      });
      expect(composable.defaultSymbol.value).toBe('USDC');
    });

    it('should return default USDC when poolData is undefined', () => {
      const composable = useEarnTopInfo({
        poolData: undefined,
        loading: false,
        infoData: mockInfoData,
      });
      expect(composable.defaultSymbol.value).toBe('USDC');
    });

    it('should return default USDC when poolData has no symbol', () => {
      const poolWithoutSymbol = { ...mockPoolData, symbol: undefined };
      const composable = useEarnTopInfo({
        poolData: poolWithoutSymbol as DefiLlamaYieldPoolFormatted,
        loading: false,
        infoData: mockInfoData,
      });
      expect(composable.defaultSymbol.value).toBe('USDC');
    });
  });

  describe('hasPoolData', () => {
    it('should return true when poolData exists', () => {
      const composable = useEarnTopInfo({
        poolData: mockPoolData,
        loading: false,
        infoData: mockInfoData,
      });
      expect(composable.hasPoolData.value).toBe(true);
    });

    it('should return false when poolData is undefined', () => {
      const composable = useEarnTopInfo({
        poolData: undefined,
        loading: false,
        infoData: mockInfoData,
      });
      expect(composable.hasPoolData.value).toBe(false);
    });
  });

  describe('displayInfoData', () => {
    it('should return skeleton items when loading and no infoData', () => {
      const composable = useEarnTopInfo({
        poolData: mockPoolData,
        loading: true,
        infoData: [],
      });
      
      const displayData = composable.displayInfoData.value;
      expect(displayData.length).toBeGreaterThan(0);
      expect(displayData[0].text).toBe('TVL:');
      expect(displayData[0].value).toBe('');
    });

    it('should return infoData when not loading', () => {
      const composable = useEarnTopInfo({
        poolData: mockPoolData,
        loading: false,
        infoData: mockInfoData,
      });
      
      expect(composable.displayInfoData.value).toEqual(mockInfoData);
    });

    it('should return infoData when loading but data exists', () => {
      const composable = useEarnTopInfo({
        poolData: mockPoolData,
        loading: true,
        infoData: mockInfoData,
      });
      
      expect(composable.displayInfoData.value).toEqual(mockInfoData);
    });

    it('should return empty array when not loading and no infoData', () => {
      const composable = useEarnTopInfo({
        poolData: mockPoolData,
        loading: false,
        infoData: [],
      });
      
      expect(composable.displayInfoData.value).toEqual([]);
    });

    it('should default loading to false when not provided', () => {
      const composable = useEarnTopInfo({
        poolData: mockPoolData,
        infoData: mockInfoData,
      });
      
      expect(composable.displayInfoData.value).toEqual(mockInfoData);
    });

    it('should default infoData to empty array when not provided', () => {
      const composable = useEarnTopInfo({
        poolData: mockPoolData,
        loading: false,
      });
      
      expect(composable.displayInfoData.value).toEqual([]);
    });
  });
});

