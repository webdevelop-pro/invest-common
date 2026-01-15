import type { DefiLlamaChartDataPoint, DefiLlamaPoolEnriched, DefiLlamaConfigData } from '../defillama.repository';
import type { DefiLlamaYieldPoolFormatted } from './yields.formatter';

export interface ApyChartDataPoint {
  date: string;
  apy: number;
}

export interface TvlChartDataPoint {
  date: string;
  tvl: number;
}

export interface InfoDataItem {
  text: string;
  value: string;
  link?: string;
  links?: string[];
}

export interface ChartOptions {
  categories: string[];
  index: string;
  colors: string[];
  showLegend: boolean;
  yFormatter?: (tick: number | Date) => string;
}

export type ChartDataPoint = ApyChartDataPoint | TvlChartDataPoint;

export interface ChartItem {
  title: string;
  data: ChartDataPoint[];
  options: ChartOptions;
}

export interface OverviewSection {
  title: string;
  data: any[];
  options?: ChartOptions;
  loading?: boolean;
}

export class EarnDetailFormatter {
  private formatPercentage(value: number | null | undefined): string {
    if (value === null || value === undefined) return 'N/A';
    return `${value >= 0 ? '+' : ''}${value.toFixed(2)}%`;
  }

  private formatNumber(value: number | null | undefined): string {
    if (value === null || value === undefined) return 'N/A';
    return value.toFixed(2);
  }

  formatChartData(rawChartData: DefiLlamaChartDataPoint[]): ChartItem[] {
    if (!rawChartData || rawChartData.length === 0) {
      return [];
    }
    
    const apyChartData: ApyChartDataPoint[] = rawChartData
      .filter((point): point is DefiLlamaChartDataPoint & { apy: number } => point.apy !== null)
      .map((point) => {
        const date = new Date(point.timestamp);
        return {
          date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
          apy: point.apy, // Already in percent
        };
      });
    
    const tvlChartData: TvlChartDataPoint[] = rawChartData.map((point) => {
      const date = new Date(point.timestamp);
      return {
        date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
        tvl: point.tvlUsd / 1000000, // Convert to millions
      };
    });
    
    const charts: ChartItem[] = [];
    
    if (apyChartData.length > 0) {
      charts.push({
        title: 'APY History',
        data: apyChartData,
        options: {
          categories: ['apy'],
          index: 'date',
          colors: ['#004FFF'],
          showLegend: false,
          yFormatter: (tick: number | Date) => typeof tick === 'number' ? `${tick.toFixed(2)}%` : '',
        },
      });
    }
    
    if (tvlChartData.length > 0) {
      charts.push({
        title: 'TVL History',
        data: tvlChartData,
        options: {
          categories: ['tvl'],
          index: 'date',
          colors: ['#3DDC97'],
          showLegend: false,
          yFormatter: (tick: number | Date) => typeof tick === 'number' ? `$${tick.toFixed(2)}M` : '',
        },
      });
    }
    
    return charts;
  }

  formatInfoData(
    poolData: DefiLlamaYieldPoolFormatted | undefined,
    poolEnrichedData: DefiLlamaPoolEnriched | undefined,
  ): InfoDataItem[] {
    if (!poolData) return [];

    const data: InfoDataItem[] = [];

    // APY Changes
    data.push(
      { text: '1D Change:', value: this.formatPercentage(poolData.apyPct1D) },
      { text: '7D Change:', value: this.formatPercentage(poolData.apyPct7D) },
      { text: '30D Change:', value: this.formatPercentage(poolData.apyPct30D) },
    );

    // Risk Metrics
    data.push(
      { text: 'IL Risk:', value: poolData.ilRisk || 'N/A' },
      { text: '7D IL:', value: poolData.il7d !== null ? this.formatPercentage(poolData.il7d) : 'N/A' },
      { text: '30D IL:', value: poolData.il30d !== null ? this.formatPercentage(poolData.il30d) : 'N/A' },
      { text: 'Outlier:', value: poolData.outlier ? 'Yes' : 'No' },
    );

    // Statistics
    data.push(
      { text: 'Data Points:', value: poolData.count?.toString() || 'N/A' },
      { text: 'Mean (μ):', value: this.formatNumber(poolData.mu) },
      { text: 'Std Dev (σ):', value: this.formatNumber(poolData.sigma) },
      { text: 'Underlying Tokens:', value: poolData.underlyingTokens?.join(', ') || 'N/A' },
    );

    // Pool Metadata
    if (poolData.poolMeta) {
      data.push({ text: 'Pool Metadata:', value: poolData.poolMeta });
    }

    // Enriched Data
    if (poolEnrichedData) {
      if (poolEnrichedData.rewardTokens && Array.isArray(poolEnrichedData.rewardTokens)) {
        data.push({ text: 'Reward Tokens:', value: poolEnrichedData.rewardTokens.join(', ') });
      }
      
      if (poolEnrichedData.exposure) {
        data.push({ text: 'Exposure:', value: String(poolEnrichedData.exposure) });
      }
    }

    return data;
  }

  formatTopInfoData(
    poolData: DefiLlamaYieldPoolFormatted | undefined,
  ): InfoDataItem[] {
    if (!poolData) return [];

    const data: InfoDataItem[] = [];

    // TVL (same as table)
    data.push({ text: 'TVL:', value: poolData.tvlFormatted });

    // APY (same as table)
    data.push({ text: 'APY:', value: poolData.apyFormatted });

    // Base APY (same as table)
    data.push({ text: 'Base APY:', value: poolData.apyBaseFormatted });

    // Reward APY (same as table)
    data.push({ text: 'Reward APY:', value: poolData.apyRewardFormatted });

    // 30d Avg APY (same as table)
    data.push({ text: '30d Avg APY:', value: poolData.apyMean30dFormatted });

    // Type (same as table - Stablecoin/Volatile)
    data.push({ text: 'Type:', value: poolData.stablecoin ? 'Stablecoin' : 'Volatile' });

    return data;
  }

  formatProtocolConfigData(protocolConfigData: DefiLlamaConfigData | undefined): InfoDataItem[] {
    if (!protocolConfigData) return [];

    const data: InfoDataItem[] = [];
    
    // Check for various field name variations
    const fieldMapping: Record<string, { label: string; isLink: boolean; isLinkArray?: boolean }> = {
      url: { label: 'Url', isLink: true },
      methodology: { label: 'Methodology', isLink: false },
      description: { label: 'Description', isLink: false },
      category: { label: 'Category', isLink: false },
      auditLink: { label: 'Audit Link', isLink: true },
      audit: { label: 'Audit Link', isLink: true },
      audit_link: { label: 'Audit Link', isLink: true },
      auditUrl: { label: 'Audit Link', isLink: true },
      audit_url: { label: 'Audit Link', isLink: true },
      auditLinks: { label: 'Audit Links', isLink: false, isLinkArray: true },
      audit_links: { label: 'Audit Links', isLink: false, isLinkArray: true },
    };

    // Process known fields
    Object.keys(fieldMapping).forEach((field) => {
      const value = protocolConfigData[field as keyof DefiLlamaConfigData];
      if (value === null || value === undefined) return;

      const config = fieldMapping[field];
      let formattedValue: string;
      let link: string | undefined;
      let links: string[] | undefined;

      if (config.isLinkArray && Array.isArray(value)) {
        // Handle array of links
        links = value
          .filter((item): item is string => typeof item === 'string' && item.length > 0)
          .map((item) => item.startsWith('http') ? item : `https://${item}`);
        formattedValue = links.length > 0 ? `${links.length} link${links.length > 1 ? 's' : ''}` : 'N/A';
      } else if (typeof value === 'string') {
        formattedValue = value;
        if (config.isLink) {
          link = value.startsWith('http') ? value : `https://${value}`;
        }
      } else if (typeof value === 'number') {
        formattedValue = String(value);
      } else if (typeof value === 'boolean') {
        formattedValue = value ? 'Yes' : 'No';
      } else if (Array.isArray(value)) {
        formattedValue = value.join(', ');
      } else {
        formattedValue = String(value);
      }

      data.push({
        text: `${config.label}:`,
        value: formattedValue,
        ...(link && { link }),
        ...(links && { links }),
      });
    });

    return data;
  }
}

