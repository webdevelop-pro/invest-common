import {
  accessTypes, CitizenTypes, durationTypes, objectivesTypes, riskComfortTypes,
} from 'InvestCommon/helpers/enums/general';
import { PROFILE_TYPES } from 'InvestCommon/global/investment.json';

export const SELECT_OBJECTIVES = [
  {
    value: objectivesTypes.growth,
    text: 'Growth',
  },
  {
    value: objectivesTypes.income,
    text: 'Income',
  },
  {
    value: objectivesTypes.capital,
    text: 'Capital Appreciation',
  },
  {
    value: objectivesTypes.speculation,
    text: 'Speculation',
  },
  {
    value: objectivesTypes.mitigation,
    text: 'Tax Mitigation',
  },
];

export const SELECT_DURATION = [
  {
    value: durationTypes.one,
    text: '1 to 3 years',
  },
  {
    value: durationTypes.two,
    text: '4-7 years',
  },
  {
    value: durationTypes.three,
    text: '8-10 years',
  },
  {
    value: durationTypes.four,
    text: '11+ years',
  },
];

export const SELECT_IMPORTANCE = [
  {
    value: accessTypes.very,
    text: 'Very Important',
  },
  {
    value: accessTypes.somewhat,
    text: 'Somewhat Important',
  },
  {
    value: accessTypes.not,
    text: 'Not Important',
  },
];

export const SELECT_RISK_COMFORT = [
  {
    value: riskComfortTypes.very,
    text: 'Low risk',
  },
  {
    value: riskComfortTypes.medium,
    text: 'Medium Risk',
  },
  {
    value: riskComfortTypes.high,
    text: 'High Risk',
  },
  {
    value: riskComfortTypes.speculative,
    text: 'Speculative Risk',
  },
];

export const SELECT_CITIZENSHIP_OPTIONS = [
  {
    value: CitizenTypes.us_citizen,
    text: CitizenTypes.us_citizen,
  },
  {
    value: CitizenTypes.us_resident,
    text: CitizenTypes.us_resident,
  },
  {
    value: CitizenTypes.us_non_resident,
    text: CitizenTypes.us_non_resident,
  },
];

export const SELECT_PROFILE_TYPES = [
  {
    value: PROFILE_TYPES.ENTITY,
    text: 'Entity',
  },
  {
    value: PROFILE_TYPES.TRUST,
    text: 'Trust',
  },
  {
    value: PROFILE_TYPES.SDIRA,
    text: 'Self-Directed IRA',
  },
  {
    value: PROFILE_TYPES.SOLO401K,
    text: 'Solo 401K',
  },
];
