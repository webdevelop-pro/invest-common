import { describe, it, expect } from 'vitest';
import { useEarnRisk } from '../useEarnRisk';
import type { RiskSection } from 'InvestCommon/data/3dParty/formatter/risk.formatter';

describe('useEarnRisk', () => {
  const mockRiskData: RiskSection[] = [
    {
      title: 'Security Score',
      items: [
        { label: 'Score', value: '85' },
        { label: 'Rating', value: 'A' },
      ],
    },
    {
      title: 'Risk Factors',
      items: [
        { label: 'Smart Contract Risk', value: 'Low' },
        { label: 'Liquidity Risk', value: 'Medium' },
      ],
    },
  ];

  describe('isEmpty', () => {
    it('should return true when loading is false and no risk data', () => {
      const composable = useEarnRisk({
        formattedRiskData: [],
        loading: false,
      });
      expect(composable.isEmpty.value).toBe(true);
    });

    it('should return false when loading is true', () => {
      const composable = useEarnRisk({
        formattedRiskData: [],
        loading: true,
      });
      expect(composable.isEmpty.value).toBe(false);
    });

    it('should return false when risk data exists', () => {
      const composable = useEarnRisk({
        formattedRiskData: mockRiskData,
        loading: false,
      });
      expect(composable.isEmpty.value).toBe(false);
    });
  });

  describe('hasData', () => {
    it('should return true when risk data exists', () => {
      const composable = useEarnRisk({
        formattedRiskData: mockRiskData,
        loading: false,
      });
      expect(composable.hasData.value).toBe(true);
    });

    it('should return false when no risk data', () => {
      const composable = useEarnRisk({
        formattedRiskData: [],
        loading: false,
      });
      expect(composable.hasData.value).toBe(false);
    });

    it('should return false when loading', () => {
      const composable = useEarnRisk({
        formattedRiskData: [],
        loading: true,
      });
      expect(composable.hasData.value).toBe(false);
    });
  });
});

