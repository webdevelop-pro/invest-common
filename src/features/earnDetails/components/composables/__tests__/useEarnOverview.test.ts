import { describe, it, expect } from 'vitest';
import { useEarnOverview, type OverviewSection } from '../useEarnOverview';

describe('useEarnOverview', () => {
  const mockChartSection: OverviewSection = {
    title: 'APY History',
    data: [
      { date: '2024-01-01', apy: 5.5 },
      { date: '2024-01-02', apy: 5.6 },
    ],
    options: {
      yFormatter: (tick: number | Date) => `${tick}%`,
    },
    loading: false,
  };

  const mockInfoSection: OverviewSection = {
    title: 'Pool Information',
    data: [
      { text: 'TVL', value: '$1,000,000' },
      { text: 'APY', value: '5.5%' },
    ],
    loading: false,
  };

  describe('isEmpty', () => {
    it('should return true when sections array is empty', () => {
      const composable = useEarnOverview({ sections: [] });
      expect(composable.isEmpty.value).toBe(true);
    });

    it('should return false when sections array has items', () => {
      const composable = useEarnOverview({ sections: [mockChartSection] });
      expect(composable.isEmpty.value).toBe(false);
    });
  });

  describe('isChartSection', () => {
    it('should return true for sections with options', () => {
      const composable = useEarnOverview({ sections: [mockChartSection] });
      expect(composable.isChartSection(mockChartSection)).toBe(true);
    });

    it('should return false for sections without options', () => {
      const composable = useEarnOverview({ sections: [mockInfoSection] });
      expect(composable.isChartSection(mockInfoSection)).toBe(false);
    });
  });

  describe('getYFormatter', () => {
    it('should return adapted formatter for chart sections', () => {
      const composable = useEarnOverview({ sections: [mockChartSection] });
      const formatter = composable.getYFormatter(mockChartSection);

      expect(formatter).toBeDefined();
      expect(typeof formatter).toBe('function');
      
      if (formatter) {
        const result = formatter(5.5, 0, []);
        expect(result).toBe('5.5%');
      }
    });

    it('should return undefined for non-chart sections', () => {
      const composable = useEarnOverview({ sections: [mockInfoSection] });
      const formatter = composable.getYFormatter(mockInfoSection);

      expect(formatter).toBeUndefined();
    });

    it('should handle sections with undefined yFormatter', () => {
      const sectionWithoutFormatter: OverviewSection = {
        title: 'Chart',
        data: [],
        options: {},
        loading: false,
      };
      const composable = useEarnOverview({ sections: [sectionWithoutFormatter] });
      const formatter = composable.getYFormatter(sectionWithoutFormatter);

      expect(formatter).toBeUndefined();
    });

    it('should adapt formatter to accept index and ticks parameters', () => {
      const composable = useEarnOverview({ sections: [mockChartSection] });
      const formatter = composable.getYFormatter(mockChartSection);

      expect(formatter).toBeDefined();
      if (formatter) {
        // Should work with the adapted signature
        const result1 = formatter(5.5, 0, [5.5, 5.6, 5.7]);
        expect(result1).toBe('5.5%');
        
        const result2 = formatter(5.6, 1, [5.5, 5.6, 5.7]);
        expect(result2).toBe('5.6%');
      }
    });
  });
});

