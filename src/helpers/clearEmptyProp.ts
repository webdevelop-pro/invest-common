export const clearEmptyProp = (data: object) => {
  const obj = {};
  Object.entries(data).forEach(([key, val]) => {
    if (val || val === false) Object.assign(obj, { [key]: val as unknown });
  });
  return obj;
};
export const undefinedEmptyProp = (data: object) => {
  const obj = {};
  Object.entries(data).forEach(([key, val]) => {
    if (val === '') Object.assign(obj, { [key]: undefined as unknown });
    if (val || val === false) Object.assign(obj, { [key]: val as unknown });
  });
  return obj;
};
