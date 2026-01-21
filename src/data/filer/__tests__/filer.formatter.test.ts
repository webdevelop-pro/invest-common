import { describe, expect, it } from 'vitest';
import type { IFilerItem } from 'InvestCommon/types/api/filer.type';
import { FilerFormatter } from '../filer.formatter';

describe('FilerFormatter', () => {
  it('merges objects by id', () => {
    const obj1 = { a: { name: 'doc-a' } } as Record<string, IFilerItem>;
    const obj2 = { b: { name: 'doc-b' } } as Record<string, IFilerItem>;
    const merged = FilerFormatter.deepMergeById(obj1, obj2);
    expect(Object.keys(merged)).toEqual(['a', 'b']);
  });

  it('flattens grouped entities', () => {
    const merged = {
      folder: {
        name: 'folder',
        entities: {
          '1': { filename: 'a.pdf', updated_at: new Date().toISOString() },
        },
      },
    };
    const flattened = FilerFormatter.flattenGroupedEntities(merged);
    expect(flattened[0]).toMatchObject({
      name: 'a.pdf',
      'object-type': 'folder',
      typeFormatted: 'Folder',
    });
  });

  it('detects recent dates', () => {
    const recent = new Date(Date.now() - 1000 * 60 * 60).toISOString();
    const old = new Date(Date.now() - 1000 * 60 * 60 * 24 * 3).toISOString();
    expect(FilerFormatter.isRecent(recent)).toBe(true);
    expect(FilerFormatter.isRecent(old)).toBe(false);
  });

  it('returns tag colors by type', () => {
    expect(FilerFormatter.getTagColorByType('agreement')).toBe('is--background-primary-light');
    expect(FilerFormatter.getTagColorByType('missing')).toBeUndefined();
  });

  it('sorts documents by type and date', () => {
    const items = [
      { typeFormatted: 'B', date: '2024-01-01' },
      { typeFormatted: 'A', date: '2024-01-02' },
    ];
    const sorted = FilerFormatter.sortDocuments(items, 'A');
    expect(sorted[0].typeFormatted).toBe('A');
  });

  it('formats investment documents list', () => {
    const files: IFilerItem[] = [
      { name: 'agreement', entities: {}, original_filename: 'a.pdf', filename: 'a.pdf' } as any,
      { name: 'media', entities: {}, original_filename: 'b.pdf', filename: 'b.pdf' } as any,
    ];
    const result = FilerFormatter.getFormattedInvestmentDocuments(files, []);
    expect(result.every((item) => item.name !== 'media')).toBe(true);
  });

  it('returns foldered investment document names', () => {
    const files = {
      entities: {
        agreement: { name: 'agreement' } as IFilerItem,
      },
    } as any;
    const result = FilerFormatter.getFolderedInvestmentDocuments(files, []);
    expect(result).toEqual(['Agreement']);
  });
});
