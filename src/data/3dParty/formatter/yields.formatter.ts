import type { DefiLlamaYieldPool } from '../defillama.repository';

export interface DefiLlamaYieldPoolFormatted extends DefiLlamaYieldPool {
  apyFormatted: string;
  tvlFormatted: string;
  apyBaseFormatted: string;
  apyRewardFormatted: string;
  apyMean30dFormatted: string;
}

export class DefiLlamaYieldsFormatter {
  private pool: DefiLlamaYieldPool;

  constructor(pool: DefiLlamaYieldPool) {
    this.pool = pool;
  }

  private formatPercentage(value: number | null): string {
    if (value === null || value === undefined) return 'N/A';
    return `${value.toFixed(2)}%`;
  }

  private formatCurrency(value: number): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  }

  format(): DefiLlamaYieldPoolFormatted {
    return {
      ...this.pool,
      apyFormatted: this.formatPercentage(this.pool.apy),
      tvlFormatted: this.formatCurrency(this.pool.tvlUsd),
      apyBaseFormatted: this.formatPercentage(this.pool.apyBase),
      apyRewardFormatted: this.formatPercentage(this.pool.apyReward),
      apyMean30dFormatted: this.formatPercentage(this.pool.apyMean30d),
    };
  }
}

