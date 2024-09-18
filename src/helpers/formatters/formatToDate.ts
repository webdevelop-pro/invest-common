
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

export const formatToDate = (ISO_string: string, withHours = false) => (
  new Intl.DateTimeFormat('en-US', withHours ? HOURS_OPTIONS : BASE_OPTIONS)
    .format(new Date(ISO_string))
);

export const formatToFullDate = (ISO_string: string) => (
  new Intl.DateTimeFormat('en-US', BASE_OPTIONS)
    .format(new Date(ISO_string))
);

export const formatToShortMonth = (ISO_string: string) => (
  new Intl.DateTimeFormat('en-US', { month: 'short' }).format(new Date(ISO_string))
);
