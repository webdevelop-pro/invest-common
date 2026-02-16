import { DefiLlamaYieldsFormatter, type DefiLlamaYieldPoolFormatted } from 'InvestCommon/data/3dParty/formatter/yields.formatter';
import type { DefiLlamaYieldPool } from 'InvestCommon/data/3dParty/defillama.repository';
import type { IOfferFormatted } from 'InvestCommon/data/offer/offer.types';

export interface RwaEarnPoolFormatted extends DefiLlamaYieldPoolFormatted {
  isRwa: true;
  offerSlug: string;
  /**
   * Human-readable offer name for UI (falls back to symbol when missing).
   */
  name?: string;
}

function parseApyFromOffer(offer: IOfferFormatted): number | null {
  const securityApy = offer.security_info?.interest_rate_apy;
  const dataApy = offer.data?.apy;

  const raw = securityApy ?? dataApy ?? '';
  const numeric = parseFloat(String(raw).replace('%', '').trim());

  if (Number.isNaN(numeric)) {
    return null;
  }

  return numeric;
}

export function mapOfferToRwaPool(
  offer: IOfferFormatted,
  basePool?: DefiLlamaYieldPoolFormatted | null,
): RwaEarnPoolFormatted {
  const tvlBase = basePool?.tvlUsd ?? 0;
  const apyFallback = parseApyFromOffer(offer);

  // When a base USDC pool is provided, we reuse its market data
  // (APY, risk fields, etc.) and only override identity fields
  // plus TVL = USDC TVL + offer amount.
  const poolForFormatter: DefiLlamaYieldPool = basePool
    ? {
        ...(basePool as DefiLlamaYieldPool),
        pool: `rwa-${offer.slug}`,
        chain: basePool.chain,
        project: offer.name,
        // Use offer name as a proxy for ticker symbol until
        // a dedicated ticker field is available.
        symbol: offer.ticker || offer.name,
        tvlUsd: tvlBase + (offer.amount_raised || 0),
        stablecoin: false,
      }
    : {
        pool: `rwa-${offer.slug}`,
        chain: 'RWA',
        project: offer.title || offer.name,
        // Use offer name as a proxy for ticker symbol until
        // a dedicated ticker field is available.
        symbol: offer.ticker || offer.name,
        // Treat amount raised as an approximate TVL for display.
        tvlUsd: (offer.amount_raised || 0) + tvlBase,
        apy: apyFallback,
        apyBase: apyFallback,
        apyReward: null,
        apyMean30d: null,
        ilRisk: 'N/A',
        apyPct1D: null,
        apyPct7D: null,
        apyPct30D: null,
        stablecoin: false,
        poolMeta: null,
        mu: 0,
        sigma: 0,
        count: 0,
        outlier: false,
        underlyingTokens: null,
        il7d: null,
        il30d: null,
        apyBase7d: null,
        apyMean7d: null,
        apyBaseInception: null,
        apyInception: null,
      };

  const formatted = new DefiLlamaYieldsFormatter(poolForFormatter).format();

  const displayName = offer.name || offer.title || formatted.symbol;

  return {
    ...formatted,
    isRwa: true,
    offerSlug: offer.slug,
    name: displayName,
  };
}

export function mapOffersToRwaPools(
  offers: IOfferFormatted[],
  basePool?: DefiLlamaYieldPoolFormatted | null,
): RwaEarnPoolFormatted[] {
  return offers.map((offer) => mapOfferToRwaPool(offer, basePool));
}

