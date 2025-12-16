import { describe, it, expect } from 'vitest';
import { reactive } from 'vue';

import { useInvestReviewForm } from '../useInvestReviewForm';
import { FundingTypes } from 'InvestCommon/helpers/enums/general';

describe('useInvestReviewForm', () => {
  it('builds investorName from selectedUserProfileData', () => {
    const props = reactive({
      data: {},
      selectedUserProfileData: {
        data: {
          first_name: 'John',
          middle_name: 'M',
          last_name: 'Doe',
        },
      },
    });

    const composable = useInvestReviewForm(props);
    expect(composable.investorName.value).toBe('John M Doe');
  });

  it('detects when full SSN is provided', () => {
    const props = reactive({
      data: {},
      selectedUserProfileData: {
        data: {
          is_full_ssn_provided: true,
        },
      },
    });

    const composable = useInvestReviewForm(props);
    expect(composable.isSsnHidden.value).toBe(true);
  });

  it('formats fundingSourceDataToShow according to funding_type', () => {
    const props = reactive({
      data: {
        funding_type: FundingTypes.cryptoWallet,
      },
      selectedUserProfileData: {},
    });

    const composableCrypto = useInvestReviewForm(props);
    expect(composableCrypto.fundingSourceDataToShow.value).toBe('Crypto Wallet');

    props.data.funding_type = 'wallet';
    const composableWallet = useInvestReviewForm(props);
    expect(composableWallet.fundingSourceDataToShow.value).toBe('Wallet');

    props.data.funding_type = 'ach';
    const composableAch = useInvestReviewForm(props);
    expect(composableAch.fundingSourceDataToShow.value).toBe('ACH');
  });

  it('flags ACH funding correctly', () => {
    const props = reactive({
      data: {
        funding_type: 'ach',
      },
      selectedUserProfileData: {},
    });

    const composable = useInvestReviewForm(props);
    expect(composable.isAchFunding.value).toBe(true);
  });
});


