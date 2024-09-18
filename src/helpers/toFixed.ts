
export const toFixed = (value: string | number, fixed = -1) => {
  const re = new RegExp(`^-?\\d+(?:.\\d{0,${fixed}})?`);
  const val = value.toString();

  let result = val;
  if (val.includes('e')) {
    // 2.34456e-11 -> 2.3e-11
    const fractionDigits = fixed > -1 ? fixed : 0;
    result = (+value).toExponential(fractionDigits);
  } else {
  // eslint-disable-next-line @typescript-eslint/prefer-regexp-exec
    result = (re.exec(result))?.[0] ?? '';

    if (fixed > 0) {
      result = result.includes('.')
        ? `${result}${''.padStart(fixed - result.split('.')[1].length, '0')}`
        : `${result}.${''.padStart(fixed, '0')}`;
    }
  }

  return +result === 0 ? '0' : result;
};
