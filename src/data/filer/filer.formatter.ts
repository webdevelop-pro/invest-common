import { IFilerItem, IFilerItemFormatted } from 'InvestCommon/types/api/filer.type';
import merge from 'lodash/merge';

/**
 * Utility class for formatting and merging filer items.
 */
export class FilerFormatter {
  private items: IFilerItem[];

  constructor(items: IFilerItem[] = []) {
    this.items = items;
  }

  static capitalizeFirstLetter = (input: unknown): string => {
    if (typeof input !== 'string' || !input) return '';
    return input.charAt(0).toUpperCase() + input.slice(1);
  };

  /**
   * Deeply merges two objects with properties (Record<string, IFilerItem>),
   * using lodash's merge for recursive merging.
   */
  static deepMergeById(
    obj1: Record<string, IFilerItem> = {},
    obj2: Record<string, IFilerItem> = {},
  ): Record<string, IFilerItem> {
    return merge({}, obj1, obj2);
  }

  /**
   * Merges two objects and returns the merged result as an array of IFilerItem.
   */
  static deepMergeToArray(
    obj1: Record<string, IFilerItem> = {},
    obj2: Record<string, IFilerItem> = {},
  ): IFilerItem[] {
    return Object.values(this.deepMergeById(obj1, obj2));
  }

  /**
   * Filters items by a predicate.
   */
  static filterByPredicate(items: IFilerItem[], predicate: (item: IFilerItem) => boolean): IFilerItem[] {
    return items.filter(predicate);
  }

  /**
   * Returns an array of item.name values from the provided filer items.
   */
  static extractNames(items: IFilerItem[]): string[] {
    return items.map((item) => this.capitalizeFirstLetter(item.name));
  }

  static formatToFullDate = (ISOString: string) => {
    if (!ISOString) return;
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'numeric',
      day: 'numeric',
    })
      .format(new Date(ISOString));
  };

  /**
   * Formats filer items into a one-dimensional array, grouped by folder (object-type) but flattened.
   */
  static flattenGroupedEntities(mergedObj: Record<string, any>): IFilerItemFormatted[] {
    if (!mergedObj || Object.keys(mergedObj).length === 0) return [];
    return Object.entries(mergedObj).flatMap(([folderName, folderValue]) => {
      const entities = folderValue?.entities || {};
      const objectType = folderValue?.name || folderName;
      return Object.values(entities).map((entity: any) => ({
        ...entity,
        'object-type': objectType,
        name: entity.original_filename || entity.filename,
        typeFormatted: this.capitalizeFirstLetter(objectType),
        date: this.formatToFullDate(entity.updated_at),
        isNew: this.isRecent(entity.updated_at),
        tagColor: this.getTagColorByType(objectType),
      }));
    });
  }

  /**
   * Returns true if the given date string is within the last 2 days.
   */
  static isRecent(dateString?: string): boolean {
    if (!dateString) return false;
    const tagDate = new Date(dateString);
    const currentDate = new Date();
    const differenceInMs = currentDate.getTime() - tagDate.getTime();
    const differenceInDays = differenceInMs / (1000 * 3600 * 24);
    return differenceInDays < 2;
  }

  /**
   * Returns the color class string for a given object-type.
   */
  static getTagColorByType(objectType?: string): string | undefined {
    switch (objectType) {
      case 'other':
        return 'is--background-purple-light';
      case 'investment-agreements':
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
   * Sorts an array of IFilerItemFormatted or IFilerItem by typeFormatted, with a specified type first, then A-Z, then by date (newest first).
   * @param items - Array of items to sort
   * @param typeFirst - Optional typeFormatted value to appear first
   * @returns Sorted array
   */
  static sortDocuments<T extends { typeFormatted?: string; date?: string }>(items: T[], typeFirst?: string): T[] {
    return items.slice().sort((a, b) => {
      // Place typeFirst at the top
      if (typeFirst) {
        if ((a.typeFormatted || '').toLowerCase() === typeFirst.toLowerCase() && (b.typeFormatted || '').toLowerCase() !== typeFirst.toLowerCase()) return -1;
        if ((b.typeFormatted || '').toLowerCase() === typeFirst.toLowerCase() && (a.typeFormatted || '').toLowerCase() !== typeFirst.toLowerCase()) return 1;
      }
      // Sort by typeFormatted (A-Z)
      const typeA = (a.typeFormatted || '').toLowerCase();
      const typeB = (b.typeFormatted || '').toLowerCase();
      if (typeA < typeB) return -1;
      if (typeA > typeB) return 1;
      // If typeFormatted is the same, sort by date (newest first)
      if (!a.date) return 1;
      if (!b.date) return -1;
      return new Date(b.date).getTime() - new Date(a.date).getTime();
    });
  }

  /**
   * Returns the fully formatted files array for investment documents, including the subscription agreement.
   * @param getFilesData - The user files data (array of IFilerItem)
   * @param getFilesPublicData - The public files data (array of IFilerItem)
   * @returns Array of formatted document items for table display
   */
  static getFormattedInvestmentDocuments(
    getFilesData: IFilerItem[] = [],
    getFilesPublicData: IFilerItem[] = [],
  ) {
    // 1. Merge files
    const filesMerged = FilerFormatter.deepMergeToArray(
      (getFilesData as any)?.entities,
      (getFilesPublicData as any)?.entities,
    );
    // 2. Filter out media
    const filesFiltered = FilerFormatter.filterByPredicate(filesMerged, (item) => item.name !== 'media');
    // 3. Flatten grouped entities (if needed)
    const filesFormatted = FilerFormatter.flattenGroupedEntities(filesFiltered);
    // 4. Sort by typeFormatted, with 'investment-agreements' first, then by date (newest first)
    return FilerFormatter.sortDocuments(filesFormatted, 'investment-agreements');
  }

  /**
   * Returns the investment documents grouped by folder (object-type), formatted for table display.
   * @param getFilesData - The user files data (array of IFilerItem)
   * @param getFilesPublicData - The public files data (array of IFilerItem)
   * @returns Object where keys are folder/object-type names and values are arrays of formatted document items
   */
  static getFolderedInvestmentDocuments(
    getFilesData: IFilerItem[] = [],
    getFilesPublicData: IFilerItem[] = [],
  ) {
    // 1. Merge files
    const filesMerged = FilerFormatter.deepMergeToArray(
      (getFilesData as any)?.entities,
      (getFilesPublicData as any)?.entities,
    );
    // 2. Filter out media
    const filesFiltered = FilerFormatter.filterByPredicate(filesMerged, (item) => item.name !== 'media');

    const result = FilerFormatter.extractNames(filesFiltered);
    return result;
  }
}
