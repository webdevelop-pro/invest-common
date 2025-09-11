import {
  IFormPartialBeneficialOwnershipItem,
  IFormPartialBeneficialOwnershipItemFormatted,
} from '../profiles.types';

export class BeneficialsFormatter {
  private beneficial: IFormPartialBeneficialOwnershipItem;

  constructor(beneficial: IFormPartialBeneficialOwnershipItem) {
    this.beneficial = beneficial;
  }

  get phoneFormatted() {
    if (!this.beneficial.phone) return undefined;
    
    const cleaned = this.beneficial.phone.replace(/\D/g, '');
    let countryCode = '';
    let number = cleaned;
    
    if (cleaned.length > 10) {
      countryCode = `+${cleaned.slice(0, cleaned.length - 10)} `;
      number = cleaned.slice(-10);
    }
    
    const areaCode = number.slice(0, 3);
    const middlePart = number.slice(3, 6);
    const lastPart = number.slice(6);
    
    return `${countryCode}(${areaCode}) ${middlePart}-${lastPart}`;
  }

  format(): IFormPartialBeneficialOwnershipItemFormatted {
    return {
      ...this.beneficial,
      phoneFormatted: this.phoneFormatted,
    };
  }
}
