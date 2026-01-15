import type { DefiLlamaRiskData } from '../defillama.repository';

export interface RiskUnderlyingItem {
  name: string;
  color?: string;
  link?: string;
}

export interface RiskItem {
  label: string;
  value: string;
  rating?: string;
  ratingColor?: string;
  ratingLink?: string;
  badgeColor?: 'primary' | 'secondary' | 'secondary-light' | 'red' | 'yellow' | 'red-light' | 'yellow-light' | 'purple-light' | 'default';
  underlying?: RiskUnderlyingItem[];
}

export interface RiskSection {
  title: string;
  items: RiskItem[];
}

export class RiskFormatter {
  // Helper to format key to readable label
  private formatLabel(key: string): string {
    return key
      .replace(/([A-Z])/g, ' $1')
      .replace(/_/g, ' ')
      .replace(/^./, (str) => str.toUpperCase())
      .trim();
  }

  // Helper to map rating_color to badge color
  private mapRatingColorToBadgeColor(ratingColor: string | undefined): RiskItem['badgeColor'] {
    if (!ratingColor) return 'default';
    const lowerColor = ratingColor.toLowerCase();
    if (lowerColor.includes('green') || lowerColor.includes('best')) return 'secondary-light';
    if (lowerColor.includes('yellow') || lowerColor.includes('average')) return 'yellow-light';
    if (lowerColor.includes('red') || lowerColor.includes('worst')) return 'red-light';
    if (lowerColor.includes('blue')) return 'secondary';
    return 'default';
  }

  // Helper to format value
  private formatValue(value: unknown): string {
    if (value === null || value === undefined) return 'N/A';
    if (typeof value === 'string' || typeof value === 'number') return String(value);
    if (typeof value === 'boolean') return value ? 'Yes' : 'No';
    if (Array.isArray(value)) return value.map((item) => this.formatValue(item)).join(', ');
    if (typeof value === 'object') return JSON.stringify(value);
    return String(value);
  }

  // Helper to extract rating, rating_color, and url from an object
  private extractRating(obj: Record<string, unknown>): { rating?: string; ratingColor?: string; ratingLink?: string } {
    const rating = 'rating' in obj && obj.rating ? this.formatValue(obj.rating) : undefined;
    const ratingColor = 'rating_color' in obj && obj.rating_color ? this.formatValue(obj.rating_color) : undefined;
    const url = 'url' in obj && obj.url ? this.formatValue(obj.url) : undefined;
    const ratingLink = url && url !== 'null' && url !== 'undefined' ? url : undefined;
    return { rating, ratingColor, ratingLink };
  }

  // Helper to extract underlying array from an object
  private extractUnderlyingArray(obj: Record<string, unknown>): RiskUnderlyingItem[] {
    const underlyingItems: RiskUnderlyingItem[] = [];
    
    // Check if there's an underlying array
    if ('underlying' in obj && Array.isArray(obj.underlying)) {
      obj.underlying.forEach((item) => {
        if (typeof item === 'object' && item !== null) {
          const underlyingObj = item as Record<string, unknown>;
          const name = 'name' in underlyingObj && underlyingObj.name ? this.formatValue(underlyingObj.name) : undefined;
          const ratingColor = 'rating_color' in underlyingObj && underlyingObj.rating_color ? this.formatValue(underlyingObj.rating_color) : undefined;
          const url = 'url' in underlyingObj && underlyingObj.url ? this.formatValue(underlyingObj.url) : undefined;
          
          if (name) {
            underlyingItems.push({
              name,
              color: ratingColor,
              link: url && url !== 'null' ? url : undefined,
            });
          }
        }
      });
    }
    
    return underlyingItems;
  }

  // Helper to create a risk item
  private createRiskItem(
    label: string,
    value: string,
    rating?: string,
    ratingColor?: string,
    ratingLink?: string,
    underlying?: RiskUnderlyingItem[]
  ): RiskItem {
    return {
      label,
      value,
      rating,
      ratingColor,
      ratingLink,
      badgeColor: rating ? this.mapRatingColorToBadgeColor(ratingColor) : this.mapRatingColorToBadgeColor(undefined),
      underlying,
    };
  }

  // Helper to process an object and create items
  private processObject(
    obj: Record<string, unknown>,
    options?: {
      defaultRating?: string;
      defaultRatingColor?: string;
      defaultRatingLink?: string;
    },
  ): RiskItem[] {
    const items: RiskItem[] = [];
    const { rating: objRating, ratingColor: objRatingColor, ratingLink: objRatingLink } = this.extractRating(obj);
    const underlyingArray = this.extractUnderlyingArray(obj);
    const rating = objRating || options?.defaultRating;
    const ratingColor = objRatingColor || options?.defaultRatingColor;
    const ratingLink = objRatingLink || options?.defaultRatingLink;

    Object.entries(obj).forEach(([key, value]) => {
      // Skip rating, rating_color, url, and underlying fields (we'll use underlying separately)
      if (key === 'rating' || key === 'rating_color' || key === 'url' || key === 'underlying') return;

      // Skip items where value is an object that only contains an empty underlying array,
      // e.g. { underlying: [] } – this avoids showing empty "Assets" rows in the Risk tab
      if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
        const valueObj = value as Record<string, unknown>;
        const keys = Object.keys(valueObj);
        if (
          keys.length === 1 &&
          keys[0] === 'underlying' &&
          Array.isArray(valueObj.underlying) &&
          valueObj.underlying.length === 0
        ) {
          return;
        }
      }

      const formattedValue = this.formatValue(value);
      let itemRating = rating;
      let itemRatingColor = ratingColor;
      let itemRatingLink = ratingLink;
      let itemUnderlying: RiskUnderlyingItem[] | undefined = underlyingArray.length > 0 ? underlyingArray : undefined;

      // Check if nested object has its own rating and underlying info
      if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
        const nestedRating = this.extractRating(value as Record<string, unknown>);
        const nestedUnderlying = this.extractUnderlyingArray(value as Record<string, unknown>);
        if (nestedRating.rating) itemRating = nestedRating.rating;
        if (nestedRating.ratingColor) itemRatingColor = nestedRating.ratingColor;
        if (nestedRating.ratingLink) itemRatingLink = nestedRating.ratingLink;
        if (nestedUnderlying.length > 0) itemUnderlying = nestedUnderlying;
      }

      items.push(this.createRiskItem(
        this.formatLabel(key), 
        formattedValue, 
        itemRating, 
        itemRatingColor,
        itemRatingLink,
        itemUnderlying
      ));
    });

    // If we have rating but no other items, add rating as an item
    if (rating && items.length === 0) {
      items.push(this.createRiskItem('Rating', rating, rating, ratingColor, ratingLink, underlyingArray.length > 0 ? underlyingArray : undefined));
    }

    return items;
  }

  formatRiskData(riskData: DefiLlamaRiskData | undefined): RiskSection[] {
    if (!riskData) return [];

    // Unwrap nested data structure if needed
    let data = riskData;
    if (typeof riskData === 'object' && riskData !== null && 'data' in riskData) {
      data = (riskData as Record<string, unknown>).data as DefiLlamaRiskData;
    }

    const sections: RiskSection[] = [];

    // If data is an array, flatten all items into a single section
    if (Array.isArray(data)) {
      const items: RiskItem[] = [];

      data.forEach((item, index) => {
        if (typeof item !== 'object' || item === null) return;

        const baseItems = this.processObject(item as Record<string, unknown>);
        baseItems.forEach((entry) => {
          items.push({
            ...entry,
            label: `${this.formatLabel(`Risk ${index + 1}`)} - ${entry.label}`,
          });
        });
      });

      if (items.length > 0) {
        sections.push({
          title: 'Risk Rating by exponential.fi',
          items,
        });
      }
    } else if (typeof data === 'object' && data !== null) {
      const dataObj = data as Record<string, unknown>;
      const items: RiskItem[] = [];

      // Step 1: Extract and form the rating from pool_rating fields
      const poolRating = 'pool_rating' in dataObj && dataObj.pool_rating ? this.formatValue(dataObj.pool_rating) : undefined;
      const poolRatingColor = 'pool_rating_color' in dataObj && dataObj.pool_rating_color ? this.formatValue(dataObj.pool_rating_color) : undefined;
      const poolUrl = 'pool_url' in dataObj && dataObj.pool_url ? this.formatValue(dataObj.pool_url) : undefined;
      const poolRatingLink = poolUrl && poolUrl !== 'null' && poolUrl !== 'undefined' ? poolUrl : undefined;


      // Create main "Risk Metrics" item if pool_rating exists
      if (poolRating) {
        items.push(
          this.createRiskItem(
            'Risk Metrics',
            '', // value is not shown when rating is present, we use the badge instead
            poolRating,
            poolRatingColor,
            poolRatingLink
          )
        );
      }


      // Step 2: Flatten the rest of the risk data into items under the same title
      const dataObjForItems: Record<string, unknown> = { ...dataObj };
      delete dataObjForItems.pool_rating;
      delete dataObjForItems.pool_rating_color;
      delete dataObjForItems.pool_rating_description;
      delete dataObjForItems.pool_url;

      const additionalItems = this.processObject(dataObjForItems, {
        defaultRating: poolRating,
        defaultRatingColor: poolRatingColor,
        defaultRatingLink: poolRatingLink,
      });

      items.push(...additionalItems);

      if (items.length > 0) {
        sections.push({
          title: 'Risk Rating by exponential.fi',
          items,
        });
      }
    }

    return sections;
  }

  // Helper to convert rating_color to CSS color (for use in templates)
  ratingColorToCssColor(ratingColor: string | undefined): string {
    if (!ratingColor) return 'inherit';
    const lowerColor = ratingColor.toLowerCase();
    if (lowerColor.includes('green')) return '#10b981';
    if (lowerColor.includes('yellow')) return '#eab308';
    if (lowerColor.includes('red')) return '#ef4444';
    if (lowerColor.includes('blue')) return '#3b82f6';
    return 'inherit';
  }
}

