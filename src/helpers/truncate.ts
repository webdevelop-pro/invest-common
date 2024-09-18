export function truncate(str: string | undefined, limit: number) {
  if (!str) return str;
  return str.length > limit ? `${str.substring(0, limit)}...` : str;
}
