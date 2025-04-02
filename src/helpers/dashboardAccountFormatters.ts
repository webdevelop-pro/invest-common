import { IUserDataIndividual } from 'InvestCommon/types/api/user';

export const getNameFormattedDashboard = (profileData: IUserDataIndividual) => {
  const parts = [
    profileData?.first_name,
    profileData?.middle_name,
    profileData?.last_name,
  ].filter((part) => ((part !== undefined) && (part !== '')));

  return parts.join(' ');
};
export const getAddressFormattedDashboard = (profileData: IUserDataIndividual) => {
  const parts = [
    profileData?.address1,
    profileData?.address2,
    profileData?.city,
    profileData?.state,
    profileData?.zip_code,
    profileData?.country,
  ].filter((part) => ((part !== undefined) && (part !== '')));

  return parts.join(', ');
};
export const getIdFormattedDashboard = (profileData: IUserDataIndividual) => {
  const parts = [
    profileData?.type,
    profileData?.state,
    profileData?.id_number,
  ].filter((part) => ((part !== undefined) && (part !== '')));

  return parts.join(' ');
};
