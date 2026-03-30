export const getProfileAvatarInitial = (profileName?: string | null) => {
  const trimmedProfileName = profileName?.trim();

  if (!trimmedProfileName) {
    return '';
  }

  return trimmedProfileName.charAt(0).toUpperCase();
};
