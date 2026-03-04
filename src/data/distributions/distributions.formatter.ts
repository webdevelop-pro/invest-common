export const getDistributionTagBackground = (status: string | undefined): string => {
  if (status === 'success') return '#D9FFEE';
  if (status === 'failed') return '#FF7070';
  return '#FFF7E8';
};

