import { FundingStatusTypes } from 'InvestCommon/types/api/funding';

export const fundingData = {
  data: [{
    payment_type: 'wire',
    updated_at: '2023-11-29T20:50:43.618192+00:00',
    status: 'approved',
    number_of_shares: 4534535,
    funding_type: 'wire',
    amount: 34535,
    escrow_data: {},
    submited_at: '2023-10-29T20:50:43.618192+00:00',
    step: 'funding',
    escrow_type: 'type',
    signature_data: {},
    funding_status: FundingStatusTypes.new,
    profile_id: 1,
    bank: {
      nc_account_nickname: 'CEFCU Bank',
      nc_account_bank_name: 'JP Morgan',
    },
    id: 1,
  }],
  count: 1,
  meta: {
    bank: {
      first_name: 'Leslie',
      last_name: 'Knope',
      middle_name: '',
      dob: '1975-01-18',
      phone: '12345678909',
      ssn: '6789',
      address1: '123 Main St.',
      address2: '#100',
      city: '123 Main St.',
      state: 'IN',
      zip_code: '46001',
      country: 'US',
      citizenship: 'U.S. Citizen',
      nc_account_nickname: 'CEFCU Bank',
      nc_account_bank_name: 'JP Morgan',
    },
  },
};
