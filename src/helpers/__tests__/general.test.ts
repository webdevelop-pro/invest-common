import { describe, expect, it } from 'vitest';
import {
  booleanFormatToString,
  checkObjectAndDeleteNotRequiredFields,
  formatPhoneNumber,
  isEmpty,
  navigateWithQueryParams,
  urlize,
} from '../general';

describe('invest-common helpers/general', () => {
  it('checks empty objects', () => {
    expect(isEmpty({})).toBe(true);
    expect(isEmpty({ a: 1 })).toBe(false);
  });

  it('formats phone numbers with country code', () => {
    expect(formatPhoneNumber('+44 123 456 7890')).toBe('+44 (123) 456-7890');
  });

  it('formats boolean values', () => {
    expect(booleanFormatToString(true)).toBe('Yes');
    expect(booleanFormatToString(false)).toBe('No');
    expect(booleanFormatToString(undefined)).toBeUndefined();
  });

  it('filters object fields by defaults/required', () => {
    const result = checkObjectAndDeleteNotRequiredFields(
      ['type'],
      ['keep'],
      { type: 'a', drop: 'nope', keep: 'keep' },
    );
    expect(result).toEqual({ type: 'a', keep: 'keep' });
  });

  it('creates url-friendly strings', () => {
    expect(urlize('Hello!  World__')).toBe('hello-world');
  });

  it('navigates with query params', () => {
    const globalRef = globalThis as typeof globalThis & { window?: { location?: Location } };
    const originalWindow = globalRef.window;
    const originalLocation = globalRef.window?.location;

    if (!globalRef.window) {
      globalRef.window = {} as { location?: Location };
    }

    Object.defineProperty(globalRef.window, 'location', {
      value: { origin: 'http://example.com', href: '' },
      writable: true,
      configurable: true,
    });

    navigateWithQueryParams('/test', { a: '1', b: '2' });
    expect(globalRef.window.location.href).toBe('http://example.com/test?a=1&b=2');

    if (originalLocation) {
      Object.defineProperty(globalRef.window, 'location', {
        value: originalLocation,
        writable: true,
        configurable: true,
      });
    } else {
      delete globalRef.window.location;
    }

    if (!originalWindow) {
      delete globalRef.window;
    }
  });
});
