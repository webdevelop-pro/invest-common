import {
  describe,
  expect,
  it,
} from 'vitest';
import {
  formatBuildDisplay,
  formatBuildTimestamp,
} from '../buildInfo';

describe('buildInfo', () => {
  it('formats build timestamps in a stable UTC label', () => {
    expect(formatBuildTimestamp('2026-04-03T12:34:56.000Z')).toBe('Apr 3, 2026, 12:34 PM UTC');
  });

  it('falls back to the raw timestamp when parsing fails', () => {
    expect(formatBuildTimestamp('custom-build-time')).toBe('custom-build-time');
  });

  it('formats the commit label with build timestamp details', () => {
    expect(formatBuildDisplay('Commit: ', 'abc123', '2026-04-03T12:34:56.000Z'))
      .toBe('Commit: abc123 (built at Apr 3, 2026, 12:34 PM UTC)');
  });

  it('keeps the commit label compact when no timestamp is available', () => {
    expect(formatBuildDisplay('Commit: ', 'abc123')).toBe('Commit: abc123');
  });

  it('returns an empty label when the commit hash is missing', () => {
    expect(formatBuildDisplay('Commit: ', '', '2026-04-03T12:34:56.000Z')).toBe('');
  });
});
