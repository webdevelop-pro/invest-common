import env from 'InvestCommon/config/env';

export const PUBLIC_FILER_IMAGE_SIZE_ORDER = ['small', 'medium', 'big'] as const;
export type PublicFilerImageSize = (typeof PUBLIC_FILER_IMAGE_SIZE_ORDER)[number];

export const DEFAULT_PUBLIC_FILER_IMAGE_DIMENSIONS: Record<PublicFilerImageSize, string> = {
  small: '311x183',
  medium: '484x290',
  big: '1024x614',
};

export const PUBLIC_FILER_IMAGE_WIDTH_DIVISOR = 1.5;

export interface BuildPublicFilerImageSrcsetOptions {
  dimensions?: Partial<Record<PublicFilerImageSize, string>>;
  preferredSize?: PublicFilerImageSize;
  requestedSizes?: PublicFilerImageSize[];
  widthDivisor?: number;
  fallbackSrc?: string;
}

const isDirectImageUrl = (value: string) => value.startsWith('http') || value.startsWith('/');

const normalizeFilerFileId = (value?: number | string | null) => {
  if (typeof value === 'number') {
    return Number.isFinite(value) && value > 0 ? value : undefined;
  }

  if (typeof value === 'string') {
    if (isDirectImageUrl(value)) {
      return value;
    }

    const parsedValue = Number(value);
    return Number.isFinite(parsedValue) && parsedValue > 0 ? parsedValue : undefined;
  }

  return undefined;
};

export const getPublicFilerWidthDescriptor = (
  dimension?: string,
  widthDivisor: number = PUBLIC_FILER_IMAGE_WIDTH_DIVISOR,
) => {
  if (!dimension || !Number.isFinite(widthDivisor) || widthDivisor <= 0) {
    return undefined;
  }

  const [rawWidth] = dimension.split('x');
  const parsedWidth = Number(rawWidth);
  if (!Number.isFinite(parsedWidth) || parsedWidth <= 0) {
    return undefined;
  }

  return Math.max(1, Math.round(parsedWidth / widthDivisor));
};

export const buildPublicFilerImageUrl = (
  fileId?: number | string | null,
  size: PublicFilerImageSize = 'medium',
) => {
  const normalizedFileId = normalizeFilerFileId(fileId);

  if (!normalizedFileId) {
    return undefined;
  }

  if (typeof normalizedFileId === 'string') {
    return normalizedFileId;
  }

  return `${env.FILER_URL}/public/files/${normalizedFileId}?size=${size}`;
};

export const buildPublicFilerImageSrcset = (
  fileId?: number | string | null,
  {
    dimensions = DEFAULT_PUBLIC_FILER_IMAGE_DIMENSIONS,
    requestedSizes = [...PUBLIC_FILER_IMAGE_SIZE_ORDER],
    widthDivisor = PUBLIC_FILER_IMAGE_WIDTH_DIVISOR,
  }: BuildPublicFilerImageSrcsetOptions = {},
) => {
  const normalizedFileId = normalizeFilerFileId(fileId);
  if (!normalizedFileId || typeof normalizedFileId === 'string') {
    return '';
  }

  return requestedSizes
    .map((size) => {
      const url = buildPublicFilerImageUrl(normalizedFileId, size);
      const widthDescriptor = getPublicFilerWidthDescriptor(dimensions[size], widthDivisor);

      if (!url || !widthDescriptor) {
        return null;
      }

      return `${url} ${widthDescriptor}w`;
    })
    .filter((entry): entry is string => Boolean(entry))
    .join(', ');
};

export const buildPublicFilerImageSource = (
  fileId?: number | string | null,
  {
    preferredSize = 'medium',
    fallbackSrc,
  }: BuildPublicFilerImageSrcsetOptions = {},
) => buildPublicFilerImageUrl(fileId, preferredSize) ?? fallbackSrc;
