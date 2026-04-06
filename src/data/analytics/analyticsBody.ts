import type { AnalyticsBody } from './analytics.type';

const MUTATION_METHODS = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);
const REDACTED_VALUE = '[redacted]';
const SENSITIVE_EXACT_KEYS = new Set([
  'address',
  'address1',
  'address2',
  'account_holder_name',
  'code',
  'dob',
  'first_name',
  'full_name',
  'ip_address',
  'last_name',
  'middle_name',
  'wallet',
  'user_browser',
]);
const SENSITIVE_KEY_SUBSTRINGS = [
  'account_number',
  'birth',
  'csrf',
  'email',
  'identifier',
  'passcode',
  'password',
  'phone',
  'routing_number',
  'secret',
  'social_security',
  'ssn',
  'tax_id',
  'totp',
] as const;

const isSensitiveKey = (key: string): boolean => {
  const normalized = key.trim().toLowerCase();

  if (!normalized) {
    return false;
  }

  if (SENSITIVE_EXACT_KEYS.has(normalized)) {
    return true;
  }

  if (SENSITIVE_KEY_SUBSTRINGS.some((fragment) => normalized.includes(fragment))) {
    return true;
  }

  if (
    normalized === 'token'
    || normalized.endsWith('token')
    || normalized.startsWith('token')
    || normalized.endsWith('_token')
    || normalized.startsWith('token_')
  ) {
    return true;
  }

  return (
    normalized === 'otp'
    || normalized === 'pin'
    || normalized.endsWith('_otp')
    || normalized.endsWith('_pin')
    || normalized.endsWith('otp')
    || normalized.endsWith('pin')
    || (
      (normalized.endsWith('_code') || normalized.endsWith('code'))
      && (
        normalized.includes('otp')
        || normalized.includes('totp')
        || normalized.includes('pin')
        || normalized.includes('verification')
        || normalized.includes('recovery')
      )
    )
  );
};

const isBlobSupported = () => typeof Blob !== 'undefined';
const isFormDataSupported = () => typeof FormData !== 'undefined';
const isFileSupported = () => typeof File !== 'undefined';

const normalizeBinaryValue = (value: Blob): string => {
  if (isFileSupported() && value instanceof File && value.name.trim()) {
    return value.name;
  }

  return '[binary]';
};

const normalizeObjectValue = (
  value: Record<string, unknown>,
  seen: WeakSet<object>,
): AnalyticsBody => {
  seen.add(value);

  const normalized = Object.entries(value).reduce<AnalyticsBody>((result, [key, item]) => {
    result[key] = isSensitiveKey(key)
      ? REDACTED_VALUE
      : normalizeBodyValue(item, seen);
    return result;
  }, {});

  seen.delete(value);
  return normalized;
};

const appendFormDataEntry = (
  target: AnalyticsBody,
  key: string,
  value: unknown,
) => {
  const currentValue = target[key];

  if (typeof currentValue === 'undefined') {
    target[key] = value;
    return;
  }

  target[key] = Array.isArray(currentValue)
    ? [...currentValue, value]
    : [currentValue, value];
};

const normalizeFormData = (
  formData: FormData,
  seen: WeakSet<object>,
): AnalyticsBody => {
  const normalized: AnalyticsBody = {};

  for (const [key, value] of formData.entries()) {
    appendFormDataEntry(
      normalized,
      key,
      isSensitiveKey(key) ? REDACTED_VALUE : normalizeBodyValue(value, seen),
    );
  }

  return normalized;
};

const normalizeBodyValue = (
  value: unknown,
  seen: WeakSet<object>,
): unknown => {
  if (value == null) {
    return null;
  }

  if (typeof value === 'string' || typeof value === 'boolean') {
    return value;
  }

  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : null;
  }

  if (typeof value === 'bigint') {
    return value.toString();
  }

  if (value instanceof Date) {
    return value.toISOString();
  }

  if (isBlobSupported() && value instanceof Blob) {
    return normalizeBinaryValue(value);
  }

  if (Array.isArray(value)) {
    return value.map((item) => normalizeBodyValue(item, seen));
  }

  if (isFormDataSupported() && value instanceof FormData) {
    return normalizeFormData(value, seen);
  }

  if (typeof value === 'object') {
    if (seen.has(value as object)) {
      return '[circular]';
    }

    return normalizeObjectValue(value as Record<string, unknown>, seen);
  }

  return String(value);
};

export const normalizeAnalyticsBody = (value: unknown): AnalyticsBody => {
  if (value == null) {
    return {};
  }

  if (typeof value === 'string') {
    const trimmedValue = value.trim();
    if (!trimmedValue) {
      return {};
    }

    try {
      return normalizeAnalyticsBody(JSON.parse(trimmedValue));
    } catch {
      return {};
    }
  }

  if (isFormDataSupported() && value instanceof FormData) {
    return normalizeFormData(value, new WeakSet<object>());
  }

  if (typeof value !== 'object' || Array.isArray(value)) {
    return {};
  }

  return normalizeObjectValue(value as Record<string, unknown>, new WeakSet<object>());
};

export const normalizeAnalyticsBodyForMethod = (
  method: string | undefined,
  value: unknown,
): AnalyticsBody => {
  if (!method || !MUTATION_METHODS.has(method.toUpperCase())) {
    return {};
  }

  return normalizeAnalyticsBody(value);
};
