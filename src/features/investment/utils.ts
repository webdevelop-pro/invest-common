import { urlContactUs } from 'InvestCommon/global/links';
import {
  ROUTE_ACCREDITATION_UPLOAD,
} from 'InvestCommon/helpers/enums/routes';
import { AccreditationTypes, InvestKycTypes } from 'InvestCommon/types/api/invest';

export enum DashboardInvestmentTabTypes {
  documents = 'documents',
  timeline = 'timeline',
}

export interface ITimelineItemsHistory {
  value: string;
  title: string;
  duration: string;
  text: string;
  variant?: string;
  type?: string;
  buttonText? : string;
  buttonRoute? : string;
  buttonHref?: string;
  showButton?: string;
}

export const ACCREDITATION_HISTORY: Record<AccreditationTypes, ITimelineItemsHistory> = {
  [AccreditationTypes.new]: {
    value: AccreditationTypes.new,
    title: 'Please complete your accreditation',
    duration: '~3 days.',
    text: `
      In order to invest you need to complete your accreditation verification process
    `,
    buttonText: 'Verify Accreditation',
    buttonRoute: ROUTE_ACCREDITATION_UPLOAD,
  },
  [AccreditationTypes.in_progress]: {
    value: AccreditationTypes.in_progress,
    title: 'Your accreditation information has been submitted',
    duration: '2-4 days.',
    text: `
      Please wait while our legal team will review your documents. 
      We will notify you automatically once we will have more information.
    `,
  },
  [AccreditationTypes.pending]: {
    value: AccreditationTypes.pending,
    title: 'Your accreditation information has been submitted',
    duration: '2-4 days.',
    text: `
      Please wait while our legal team will review your documents. 
      We will notify you automatically once we will have more information.
    `,
  },
  [AccreditationTypes.info_required]: {
    value: AccreditationTypes.info_required,
    title: 'Additional information required for accreditation',
    duration: '2-4 days.',
    text: `
      Accreditation verification provider requires additional information to process your accreditation application fully.
    `,
    buttonText: 'Verify Accreditation',
    buttonRoute: ROUTE_ACCREDITATION_UPLOAD,
  },
  [AccreditationTypes.expired]: {
    value: AccreditationTypes.expired,
    title: 'Your accreditation is expired',
    duration: '2-4 days.',
    text: `
      Please upload your accreditation documents in order to finish investment.
    `,
    buttonText: 'Verify Accreditation',
    buttonRoute: ROUTE_ACCREDITATION_UPLOAD,
  },
  [AccreditationTypes.approved]: {
    value: AccreditationTypes.approved,
    title: 'Your accreditation is approved',
    duration: '90 days.',
    text: `
      The accreditation status of your investment profile has been successfully approved.
    `,
  },
  [AccreditationTypes.declined]: {
    value: AccreditationTypes.declined,
    title: 'Your accreditation is declined',
    duration: '2-4 days.',
    text: `
      Please upload your accreditation documents in order to resolve the issue.
    `,
    buttonText: 'Verify Accreditation',
    buttonRoute: ROUTE_ACCREDITATION_UPLOAD,
  },
};

export const INVEST_KYC_HISTORY: Record<InvestKycTypes, ITimelineItemsHistory> = {
  [InvestKycTypes.none]: {
    value: InvestKycTypes.none,
    title: 'In order to invest you need to pass KYC',
    duration: '~1-5 days.',
    text: `
      Know Your Customer guidelines in financial services 
      require that professionals make an effort to verify the identity, 
      suitability, and risks involved with maintaining a business relationship.
    `,
    buttonText: 'Verify Identity',
  },
  [InvestKycTypes.new]: {
    value: InvestKycTypes.new,
    title: 'In order to invest you need to pass KYC',
    duration: '~1-5 days.',
    text: `
      Know Your Customer guidelines in financial services 
      require that professionals make an effort to verify the identity, 
      suitability, and risks involved with maintaining a business relationship.
    `,
    buttonText: 'Verify Identity',
  },
  [InvestKycTypes.pending]: {
    value: InvestKycTypes.pending,
    title: 'In order to invest you need to finish KYC',
    duration: '~1-5 days.',
    text: `
      Know Your Customer guidelines in financial services 
      require that professionals make an effort to verify the identity, 
      suitability, and risks involved with maintaining a business relationship.
    `,
    buttonText: 'Verify Identity',
  },
  [InvestKycTypes.declined]: {
    value: InvestKycTypes.declined,
    title: 'Your KYC procedure is declined',
    duration: '~1-5 days.',
    text: `
      Full KYC failure may occur due to multiple reasons, like certain details mismatch 
      or incorrect document submission. <a href="${urlContactUs}" class="is--link-1">Please contact our support team</a> 
      and we will help you to resolve your issues.
    `,
    buttonText: 'Contact Us',
    buttonHref: urlContactUs,
  },
  [InvestKycTypes.approved]: {
    value: InvestKycTypes.approved,
    title: 'Your KYC procedure is complete',
    duration: '',
    text: `
      Congratulations, you successfully pass KYC procedure. 
      If you need to update your information please
      <a href="#" class="is--link-1">contact our support team</a>.
    `,
  },
};
