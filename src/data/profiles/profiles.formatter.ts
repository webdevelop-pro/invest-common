import {
  IProfileIndividual,
  IProfileFormatted,
} from './profiles.types';
import { InvestKycTypes, AccreditationTypes } from 'InvestCommon/types/api/invest';

export class ProfileFormatter {
  private profile: IProfileIndividual;

  constructor(profile: IProfileIndividual) {
    this.profile = profile;
  }

  // KYC Status boolean properties
  get isKycApproved() {
    return this.profile.kyc_status === InvestKycTypes.approved;
  }

  get isKycInProgress() {
    return this.profile.kyc_status === InvestKycTypes.in_progress;
  }

  get isKycPending() {
    return this.profile.kyc_status === InvestKycTypes.pending;
  }

  get isKycDeclined() {
    return this.profile.kyc_status === InvestKycTypes.declined;
  }

  get isKycNew() {
    return this.profile.kyc_status === InvestKycTypes.new;
  }

  get isKycNone() {
    return this.profile.kyc_status === InvestKycTypes.none;
  }

  get isCanCallKycPlaid() {
    return this.isKycNew || this.isKycPending || this.isKycNone;
  }

  // Accreditation Status boolean properties
  get isAccreditationApproved() {
    return this.profile.accreditation_status === AccreditationTypes.approved;
  }

  get isAccreditationInProgress() {
    return this.profile.accreditation_status === AccreditationTypes.in_progress;
  }

  get isAccreditationPending() {
    return this.profile.accreditation_status === AccreditationTypes.pending;
  }

  get isAccreditationDeclined() {
    return this.profile.accreditation_status === AccreditationTypes.declined;
  }

  get isAccreditationNew() {
    return this.profile.accreditation_status === AccreditationTypes.new;
  }

  get isAccreditationInfoRequired() {
    return this.profile.accreditation_status === AccreditationTypes.info_required;
  }

  get isAccreditationExpired() {
    return this.profile.accreditation_status === AccreditationTypes.expired;
  }

  format(): IProfileFormatted {
    return {
      ...this.profile,
      isKycApproved: this.isKycApproved,
      isKycInProgress: this.isKycInProgress,
      isKycPending: this.isKycPending,
      isKycDeclined: this.isKycDeclined,
      isKycNew: this.isKycNew,
      isKycNone: this.isKycNone,
      isAccreditationApproved: this.isAccreditationApproved,
      isAccreditationInProgress: this.isAccreditationInProgress,
      isAccreditationPending: this.isAccreditationPending,
      isAccreditationDeclined: this.isAccreditationDeclined,
      isAccreditationNew: this.isAccreditationNew,
      isAccreditationInfoRequired: this.isAccreditationInfoRequired,
      isAccreditationExpired: this.isAccreditationExpired,
      isCanCallKycPlaid: this.isCanCallKycPlaid,
    };
  }
} 