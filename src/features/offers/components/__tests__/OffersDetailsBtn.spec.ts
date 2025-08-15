import { render, screen } from '@testing-library/vue';
import { InvestKycTypes } from 'InvestCommon/types/api/invest';
import { createPinia, setActivePinia } from 'pinia';
import {
  beforeEach, expect, describe, it, vi,
} from 'vitest';
import OffersDetailsBtn from '../OffersDetailsBtn.vue';

vi.mock('vue-router', () => ({
  useRoute: vi.fn().mockReturnValue({ pushTo: vi.fn(), params: { profileId: '1' } }),
  useRouter: () => ({
    push: vi.fn(),
    currentRoute: { value: 'myCurrentRoute' },
  }),
}));

interface IProps {
  isAuth: boolean;
  showInvestBtn: boolean;
  isSharesReached: boolean;
  kycStatus: InvestKycTypes;
  canInvest: boolean;
  totalShares: number;
  subscribedShares: number;
  minInvest: number;
}

function renderComponent(props: IProps) {
  render(OffersDetailsBtn, {
    props,
  });

  const signInBtn = screen.queryByText('Sign in before invest');
  const kycBtn = screen.queryByText('Start KYC before Invest');
  const investBtn = screen.queryByText('Invest Now');
  const kycInfo = screen.queryByText('You haven\'t passed KYC!');
  const sharesInfo = screen.queryByText('Offer already reached subscription');

  return {
    signInBtn,
    kycBtn,
    investBtn,
    kycInfo,
    sharesInfo,
  };
}

describe.skip('OffersDetailsBtn', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });
  it.only('should shows Sign in button if user is logged out', () => {
    const options = {
      isAuth: false,
      isSharesReached: false,
      showInvestBtn: false,
      kycStatus: InvestKycTypes.new,
      canInvest: false,
      totalShares: 0,
      subscribedShares: 0,
      minInvest: 1500,
    };

    const {
      signInBtn, kycBtn, investBtn, kycInfo, sharesInfo,
    } = renderComponent(options);

    expect(signInBtn).toBeDefined();
    expect(kycBtn).toBeNull();
    expect(investBtn).toBeNull();
    expect(kycInfo).toBeNull();
    expect(sharesInfo).toBeNull();
  });

  it.only('should shows KYC button if status is new', () => {
    const options = {
      isAuth: true,
      isSharesReached: false,
      showInvestBtn: false,
      kycStatus: InvestKycTypes.new,
      canInvest: false,
      totalShares: 0,
      subscribedShares: 0,
      minInvest: 1500,
    };

    const {
      signInBtn, kycBtn, investBtn, kycInfo, sharesInfo,
    } = renderComponent(options);

    expect(signInBtn).toBeNull();
    expect(kycBtn).toBeDefined();
    expect(investBtn).toBeNull();
    expect(kycInfo).toBeNull();
    expect(sharesInfo).toBeNull();
  });

  it.only('should shows Invest now button when KYC status is pending', () => {
    const options = {
      isAuth: true,
      isSharesReached: false,
      showInvestBtn: true,
      kycStatus: InvestKycTypes.pending,
      canInvest: true,
      totalShares: 5000,
      subscribedShares: 2000,
      minInvest: 1500,
    };

    const {
      signInBtn, kycBtn, investBtn, kycInfo, sharesInfo,
    } = renderComponent(options);

    expect(signInBtn).toBeNull();
    expect(kycBtn).toBeNull();
    expect(investBtn).toBeDefined();
    expect(kycInfo).toBeNull();
    expect(sharesInfo).toBeNull();
  });

  it.only('should shows Invest now button when KYC status is approved', () => {
    const options = {
      isAuth: true,
      isSharesReached: false,
      showInvestBtn: true,
      kycStatus: InvestKycTypes.approved,
      canInvest: true,
      totalShares: 5000,
      subscribedShares: 2000,
      minInvest: 1500,
    };

    const {
      signInBtn, kycBtn, investBtn, kycInfo, sharesInfo,
    } = renderComponent(options);

    expect(signInBtn).toBeNull();
    expect(kycBtn).toBeNull();
    expect(investBtn).toBeDefined();
    expect(kycInfo).toBeNull();
    expect(sharesInfo).toBeNull();
  });

  it.only('should shows KYC info text if user got declined status', () => {
    const options = {
      isAuth: true,
      isSharesReached: false,
      showInvestBtn: false,
      kycStatus: InvestKycTypes.declined,
      canInvest: false,
      totalShares: 5000,
      subscribedShares: 2000,
      minInvest: 1500,
    };

    const {
      signInBtn, kycBtn, investBtn, kycInfo, sharesInfo,
    } = renderComponent(options);

    expect(signInBtn).toBeNull();
    expect(kycBtn).toBeNull();
    expect(investBtn).toBeNull();
    expect(kycInfo).toBeDefined();
    expect(sharesInfo).toBeNull();
  });

  it.only('should shows shares info text when user reach subscriptions', () => {
    const options = {
      isAuth: true,
      isSharesReached: true,
      showInvestBtn: true,
      kycStatus: InvestKycTypes.pending,
      canInvest: true,
      totalShares: 0,
      subscribedShares: 5000,
      minInvest: 1500,
    };

    const {
      signInBtn, kycBtn, investBtn, kycInfo, sharesInfo,
    } = renderComponent(options);

    expect(signInBtn).toBeNull();
    expect(kycBtn).toBeNull();
    expect(investBtn).toBeDefined();
    expect(kycInfo).toBeNull();
    expect(sharesInfo).toBeDefined();
  });
});
