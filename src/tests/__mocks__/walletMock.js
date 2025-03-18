export const fundingSourceResponseMock = {
  id: 4,
  name: 'Chase Bank',
  status: 'verified',
  type: 'bank',
  bank_name: 'SANDBOX TEST BANK',
};

export const walletResponseMock = {
  id: 5,
  status: 'verified',
  balance: 5000.00,
  funding_source: fundingSourceResponseMock,
};

export const transactionsResponseMock = [
  {
    id: 6,
    status: 'processed',
    type: 'deposit',
    amount: 5000.00,
    source: {
      id: 4,
      name: 'Chase Bank',
      status: 'verified',
      type: 'bank',
      bank_name: 'SANDBOX TEST BANK',
    },
    dest: {
      id: 4,
      name: 'Chase Bank',
      status: 'verified',
      type: 'bank',
      bank_name: 'SANDBOX TEST BANK',
    },
    updated_at: '2023-11-29T20:50:43.618192+00:00',
    submited_at: '2023-10-29T20:50:43.618192+00:00',
  },
];

export const walletErrorMock = {
  status: 'error',
  balance: 0,
  pending_incoming_balance: 0,
  pending_outcoming_balance: 0,
  id: 288,
  funding_source: null,
};
