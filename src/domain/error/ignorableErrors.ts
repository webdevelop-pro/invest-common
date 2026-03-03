export const IGNORABLE_ERROR_PATTERNS = [
  /resizeobserver.*(loop|limit exceeded)/i,
  /aborterror|aborted|canceled/i,
  // Ignore common dynamic-import/chunk-load failures (noise, usually auto-recovered)
  /loading chunk|failed to fetch dynamically imported module|importing dynamically imported module|error loading dynamically imported module/i,
];

export function isIgnorableError(error: Error): boolean {
  const s = `${error?.name ?? ''} ${error?.message ?? ''}`.toLowerCase();
  return IGNORABLE_ERROR_PATTERNS.some((p) => p.test(s));
}

export function isIgnorableErrorMessage(message: string): boolean {
  const s = (message ?? '').toLowerCase();
  return IGNORABLE_ERROR_PATTERNS.some((p) => p.test(s));
}

