const BASE_OPTIONS = {
  year: 'numeric',
  month: 'numeric',
  day: 'numeric',
} as const;

const HOURS_OPTIONS = {
  ...BASE_OPTIONS,
  hour: 'numeric',
  minute: 'numeric',
} as const;

export const formatToDate = (ISOString: string, withHours = false) => (
  new Intl.DateTimeFormat('en-US', withHours ? HOURS_OPTIONS : BASE_OPTIONS)
    .format(new Date(ISOString))
);

export const formatToFullDate = (ISOString: string) => (
  new Intl.DateTimeFormat('en-US', BASE_OPTIONS)
    .format(new Date(ISOString))
);

export const formatToShortMonth = (ISOString: string) => (
  new Intl.DateTimeFormat('en-US', { month: 'short' }).format(new Date(ISOString))
);
