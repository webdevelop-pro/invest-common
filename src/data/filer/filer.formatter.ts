import { IFilerItem, IFilerItemFormatted } from 'InvestCommon/data/filer/filer.type';
import merge from 'lodash/merge';

/** Folder shape from filer API: name + map of item id → item */
export interface IFilerFolder {
  name?: string;
  entities?: Record<string, IFilerItem>;
}

/** Filer API response: top-level key is folder name (e.g. investment_agreements, media) */
export type FilerEntitiesMap = Record<string, IFilerFolder>;

/** Response shape from getFiles / getPublicFiles */
export interface FilerSourceResponse {
  entities?: FilerEntitiesMap;
}

const FOLDER_MEDIA = 'media';
const FOLDER_INVESTMENT_AGREEMENTS = 'investment-agreements';

const DATE_FORMATTER = new Intl.DateTimeFormat('en-US', {
  year: 'numeric',
  month: 'numeric',
  day: 'numeric',
});

const TWO_DAYS_MS = 2 * 24 * 3600 * 1000;

/**
 * Normalize folder/type name: underscores → hyphens so investment_agreements === investment-agreements.
 */
function normalizeFolderName(name: string): string {
  return typeof name === 'string' ? name.replace(/_/g, '-') : name;
}

/**
 * Utility class for formatting and merging filer items.
 */
export class FilerFormatter {
  static capitalizeFirstLetter = (input: unknown): string => {
    if (typeof input !== 'string' || !input) return '';
    return input.charAt(0).toUpperCase() + input.slice(1);
  };

  /**
   * Deeply merges two objects (e.g. Record<string, IFilerItem> or folder maps),
   * using lodash's merge for recursive merging.
   */
  static deepMergeById<T extends Record<string, unknown>>(
    obj1: T = {} as T,
    obj2: T = {} as T,
  ): T {
    return merge({}, obj1, obj2) as T;
  }

  /**
   * Merges one or more objects and returns the merged result as an array of values.
   * Used for folder maps: merges by folder key, returns array of folder objects.
   */
  static deepMergeToArray(
    ...objects: Array<Record<string, IFilerItem> | undefined | null>
  ): IFilerItem[] {
    if (!objects.length) return [];
    const merged = objects.reduce<Record<string, IFilerItem>>(
      (acc, current) => (current ? this.deepMergeById(acc, current) : acc),
      {},
    );
    return Object.values(merged);
  }

  /**
   * Normalizes to array of responses and returns merged entities map (folder name → folder),
   * with the "media" folder excluded.
   */
  static mergeAndFilterEntities(
    ...sourceArrays: Array<FilerSourceResponse | FilerSourceResponse[] | undefined | null>
  ): FilerEntitiesMap {
    const flat = sourceArrays.flatMap((s) => (Array.isArray(s) ? s : s ? [s] : []));
    const entities = flat.reduce<FilerEntitiesMap>(
      (acc, src) => this.deepMergeById(acc, src?.entities ?? {}),
      {},
    );
    const { [FOLDER_MEDIA]: _, ...withoutMedia } = entities;
    return withoutMedia;
  }

  /**
   * Filters items by a predicate.
   */
  static filterByPredicate(items: IFilerItem[], predicate: (item: IFilerItem) => boolean): IFilerItem[] {
    return items.filter(predicate);
  }

  /**
   * Returns an array of normalized item.name values from the provided filer items.
   * Underscores and hyphens are treated the same (investment_agreements → investment-agreements).
   */
  static extractNames(items: IFilerItem[]): string[] {
    return items.map((item) => this.capitalizeFirstLetter(normalizeFolderName(String(item.name ?? ''))));
  }

  static formatToFullDate = (ISOString: string) => {
    if (!ISOString) return '';
    return DATE_FORMATTER.format(new Date(ISOString));
  };

  /**
   * Flattens a merged entities map (folder name → folder) into a single array of formatted items.
   */
  static flattenGroupedEntities(entitiesMap: FilerEntitiesMap): IFilerItemFormatted[] {
    if (!entitiesMap || Object.keys(entitiesMap).length === 0) return [];
    return Object.entries(entitiesMap).flatMap(([folderKey, folder]) => {
      const entities = folder?.entities ?? {};
      const objectType = normalizeFolderName(folder?.name ?? folderKey);

      return Object.values(entities).map((entity: IFilerItem) => {
        const raw = entity as unknown as Record<string, unknown>;
        const displayName = raw.original_filename ?? entity.filename;
        return {
          ...entity,
          'object-type': objectType,
          name: typeof displayName === 'string' ? displayName : entity.filename,
          typeFormatted: this.capitalizeFirstLetter(objectType),
          date: this.formatToFullDate(entity.updated_at),
          isNew: this.isRecent(entity.updated_at),
          tagColor: this.getTagColorByType(objectType),
        } as IFilerItemFormatted;
      });
    });
  }

  /**
   * Returns true if the given date string is within the last 2 days.
   */
  static isRecent(dateString?: string): boolean {
    if (!dateString) return false;
    return (Date.now() - new Date(dateString).getTime()) < TWO_DAYS_MS;
  }

  /**
   * Returns the color class string for a given object-type.
   */
  static getTagColorByType(objectType?: string): string | undefined {
    switch (objectType) {
      case 'other':
        return 'is--background-purple-light';
      case FOLDER_INVESTMENT_AGREEMENTS:
        return 'is--background-secondary-light';
      case 'company':
        return 'is--background-yellow-light';
      case 'agreement':
        return 'is--background-primary-light';
      default:
        return undefined;
    }
  }

  /**
   * Sorts by typeFormatted (optional type first), then A–Z, then by date (newest first).
   * Uses Schwartzian transform to pre-compute sort keys once per item.
   */
  static sortDocuments<T extends { typeFormatted?: string; date?: string }>(
    items: T[],
    typeFirst?: string,
  ): T[] {
    const typeFirstLower = typeFirst?.toLowerCase();

    type Tagged = { item: T; typeLower: string; isFirst: boolean; dateMs: number };
    const tagged: Tagged[] = items.map((item) => {
      const typeLower = (item.typeFormatted ?? '').toLowerCase();
      return {
        item,
        typeLower,
        isFirst: typeFirstLower !== undefined && typeLower === typeFirstLower,
        dateMs: item.date ? new Date(item.date).getTime() : 0,
      };
    });

    tagged.sort((a, b) => {
      if (typeFirstLower) {
        if (a.isFirst && !b.isFirst) return -1;
        if (!a.isFirst && b.isFirst) return 1;
      }
      if (a.typeLower !== b.typeLower) return a.typeLower.localeCompare(b.typeLower);
      return b.dateMs - a.dateMs;
    });

    return tagged.map((t) => t.item);
  }

  /**
   * Normalizes a single value or array of filer responses for merging.
   */
  private static toSourceArray(
    data: FilerSourceResponse | FilerSourceResponse[] | undefined | null,
  ): FilerSourceResponse[] {
    if (data == null) return [];
    return Array.isArray(data) ? data : [data];
  }

  /**
   * Merges all user and public filer responses (single or array), excludes media folder,
   * and returns the merged entities map.
   */
  private static getMergedInvestmentEntities(
    userData: FilerSourceResponse | FilerSourceResponse[] | undefined | null,
    publicData: FilerSourceResponse | FilerSourceResponse[] | undefined | null,
  ): FilerEntitiesMap {
    return this.mergeAndFilterEntities(
      ...this.toSourceArray(userData),
      ...this.toSourceArray(publicData),
    );
  }

  /**
   * Returns formatted investment documents for table display.
   * Merges all given user and public responses and sorts with investment-agreements first.
   */
  static getFormattedInvestmentDocuments(
    userData: FilerSourceResponse | FilerSourceResponse[] | undefined | null = [],
    publicData: FilerSourceResponse | FilerSourceResponse[] | undefined | null = [],
  ): IFilerItemFormatted[] {
    const merged = this.getMergedInvestmentEntities(userData, publicData);
    const formatted = this.flattenGroupedEntities(merged);
    return this.sortDocuments(formatted, FOLDER_INVESTMENT_AGREEMENTS);
  }

  /**
   * Returns unique folder names for investment documents (normalized: investment_agreements === investment-agreements).
   */
  static getFolderedInvestmentDocuments(
    userData: FilerSourceResponse | FilerSourceResponse[] | undefined | null = [],
    publicData: FilerSourceResponse | FilerSourceResponse[] | undefined | null = [],
  ): string[] {
    const merged = this.getMergedInvestmentEntities(userData, publicData);
    const names = Object.entries(merged).map(([key, folder]) =>
      this.capitalizeFirstLetter(normalizeFolderName(folder?.name ?? key)),
    );
    return [...new Set(names)];
  }
}
