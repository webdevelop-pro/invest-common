export const LIMIT_VALUE = 124000;
export const MIN_INVEST_VALUE = 2500;

export const calcInvestLimit = (annualIncome = 0, netWorth = 0, extra = 0) => {
  const maxValue = Math.max(annualIncome, netWorth);
  let limit = 0;

  if (annualIncome <= LIMIT_VALUE || netWorth <= LIMIT_VALUE) limit = maxValue * 0.05;

  if (annualIncome > LIMIT_VALUE && netWorth > LIMIT_VALUE) limit = maxValue * 0.1;

  if (limit <= MIN_INVEST_VALUE) limit = MIN_INVEST_VALUE;

  if (limit > LIMIT_VALUE) limit = LIMIT_VALUE;

  if (extra) limit -= extra;

  if (limit <= 0) return 0;

  return limit;
};
