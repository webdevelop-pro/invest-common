
export function isEmpty(obj: object) {
  // eslint-disable-next-line
  for (const prop of Object.keys(obj)) {
    return false;
  }

  return true;
}

export function formatPhoneNumber(phoneNumber: string | undefined): string | undefined {
  if (!phoneNumber) return undefined;
  // Remove all non-digit characters from the input string
  let cleaned: string = phoneNumber.replace(/\D/g, '');
  // Extract the country code (if present)
  let countryCode: string = '';
  if (cleaned.length > 10) {
    countryCode = `+${cleaned.slice(0, cleaned.length - 10)} `;
    // Remove country code from the cleaned string
    cleaned = cleaned.slice(-10);
  }
  // Extract the area code and the rest of the number
  const areaCode: string = cleaned.slice(0, 3);
  const middlePart: string = cleaned.slice(3, 6);
  const lastPart: string = cleaned.slice(6);

  // Format the phone number parts into the desired format
  const formattedPhoneNumber: string = `${countryCode}(${areaCode}) ${middlePart}-${lastPart}`;

  return formattedPhoneNumber;
}


export function booleanFormatToString(value: boolean | undefined) {
  if (value === undefined) return undefined;
  if (value) return 'Yes';
  return 'No';
}

export function checkObjectAndDeleteNotRequiredFields(
  defaultParameters: string[],
  requiredFields: string[],
  obj: object,
) {
  return Object.keys(obj).reduce((acc, key) => {
    if (defaultParameters.includes(key)) {
      acc[key] = obj[key]; // Set the new value for 'type'
    } else if (requiredFields.includes(obj[key])) {
      acc[key] = obj[key];
    } else {
      // If property value is not in requiredEmployment.value, delete the property
      delete acc[key];
    }
    return acc;
  }, {});
}

export function urlize(input: string): string {
  // Convert the input string to lowercase and replace spaces with hyphens
  let urlFriendlyString = input.toLowerCase().replace(/\s+/g, '-');

  // Remove any characters that are not alphanumeric or hyphens
  // eslint-disable-next-line
  urlFriendlyString = urlFriendlyString.replace(/[^a-z0-9\-]/g, '');

  // Remove any consecutive hyphens
  urlFriendlyString = urlFriendlyString.replace(/-{2,}/g, '-');

  // Trim leading and trailing hyphens
  urlFriendlyString = urlFriendlyString.replace(/^-+|-+$/g, '');

  return urlFriendlyString;
}
