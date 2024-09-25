import {
  render, fireEvent,
} from '@testing-library/vue';
import FormFinancialInformationAndKYC from '../FormFinancialInformationAndKYC.vue';
import { createPinia, setActivePinia, storeToRefs } from 'pinia';
import {
  beforeEach, expect, describe, it, vi,
} from 'vitest';
import { useUserIdentitysStore, useUsersStore } from 'InvestCommon/store';
import createFetchMock from 'vitest-fetch-mock';
import { userIndividualOptionsMock } from 'InvestCommon/tests/__mocks__';

const fetchMocker = createFetchMock(vi);
fetchMocker.enableMocks();


vi.mock('vue-router', () => ({
  useRouter: vi.fn().mockReturnValue({
    push: vi.fn(),
    currentRoute: {
      value: {
        meta: {
          auth: true,
        },
      },
    },
  }),
  useRoute: () => ({
    params: { profileId: '1' },
  }),
}));

function renderComponent() {
  const wrapper = render(FormFinancialInformationAndKYC);

  const inputDateOfBirth: HTMLInputElement = wrapper.getByTestId('date-of-birth');
  const inputPhoneNumber: HTMLInputElement = wrapper.getByTestId('phone');
  const inputCitizenship: HTMLInputElement = wrapper.getByTestId('citizenship');
  const inputAddressOne: HTMLInputElement = wrapper.getByTestId('address-1');
  const inputAddressTwo: HTMLInputElement = wrapper.getByTestId('address-2');
  const inputCity: HTMLInputElement = wrapper.getByTestId('city');
  const inputState: HTMLInputElement = wrapper.getByTestId('state');
  const inputZipCode: HTMLInputElement = wrapper.getByTestId('zip');
  const inputCountry: HTMLInputElement = wrapper.getByTestId('country');
  const continueButton: HTMLButtonElement = wrapper.getByTestId('button');
  const educationalMaterials: HTMLInputElement = wrapper.getByTestId('educational-materials');
  const cancelationRestrictions: HTMLInputElement = wrapper.getByTestId('cancelation-restrictions');
  const resellDifficulties: HTMLInputElement = wrapper.getByTestId('resell-difficulties');
  const riskInvolved: HTMLInputElement = wrapper.getByTestId('risk-involved');
  const noLegalAdvices: HTMLInputElement = wrapper.getByTestId('no_legal_advices_from_company');
  const consentPlaid: HTMLInputElement = wrapper.getByTestId('consent-plaid');

  return {
    inputDateOfBirth,
    inputPhoneNumber,
    inputAddressOne,
    inputAddressTwo,
    inputCity,
    inputState,
    inputZipCode,
    inputCountry,
    inputCitizenship,
    continueButton,
    wrapper,
    educationalMaterials,
    cancelationRestrictions,
    resellDifficulties,
    riskInvolved,
    noLegalAdvices,
    consentPlaid,
  };
}


const inputTriggerError = async (el: HTMLInputElement, value: string, isTruthy: boolean) => {
  await fireEvent.update(el, value);
  if (isTruthy) {
    expect(el?.parentElement?.classList.contains('is--error')).toBe(true);
  } else {
    expect(el?.parentElement?.classList.contains('is--error')).toBe(false);
  }
};

describe('FormFinancialInformationAndKYC', () => {
  beforeEach(async () => {
    setActivePinia(createPinia());
    const userIdentityStore = useUserIdentitysStore();
    fetchMocker.mockResponse(JSON.stringify(userIndividualOptionsMock));
    await userIdentityStore.setUserIdentityOptions();
    const usersStore = useUsersStore();
    const { selectedUserProfileId } = storeToRefs(usersStore);
    selectedUserProfileId.value = 1;
    Element.prototype.scrollIntoView = vi.fn();
  });
  it('should mount inputs', () => {
    const {
      inputDateOfBirth, inputPhoneNumber,
      inputAddressOne, inputAddressTwo, inputCity,
      inputState, inputZipCode, inputCountry,
      inputCitizenship, continueButton, wrapper,
      educationalMaterials, cancelationRestrictions, resellDifficulties,
      riskInvolved, noLegalAdvices, consentPlaid,
    } = renderComponent();

    expect(inputDateOfBirth).toBeDefined();
    expect(inputPhoneNumber).toBeDefined();
    expect(inputAddressOne).toBeDefined();
    expect(inputAddressTwo).toBeDefined();
    expect(inputCity).toBeDefined();
    expect(inputState).toBeDefined();
    expect(inputZipCode).toBeDefined();
    expect(inputCountry).toBeDefined();
    expect(inputCitizenship).toBeDefined();
    expect(continueButton).toBeDefined();
    expect(wrapper.getByTestId('is-accredited')).toBeDefined();
    expect(wrapper.getByTestId('investment-objectives')).toBeDefined();
    expect(wrapper.getByTestId('years-experience')).toBeDefined();
    expect(wrapper.getByTestId('duration')).toBeDefined();
    expect(wrapper.getByTestId('importance-of-access')).toBeDefined();
    expect(wrapper.getByTestId('risk-comfort')).toBeDefined();
    expect(educationalMaterials).toBeDefined();
    expect(cancelationRestrictions).toBeDefined();
    expect(resellDifficulties).toBeDefined();
    expect(riskInvolved).toBeDefined();
    expect(noLegalAdvices).toBeDefined();
    expect(consentPlaid).toBeDefined();
  });

  it('date of birth should pass validation', async () => {
    const {
      inputDateOfBirth, continueButton, wrapper,
    } = renderComponent();
    const inputDobGroup: HTMLInputElement = wrapper.getByTestId('dob-group');
    // on load it does not have error
    expect(inputDateOfBirth?.parentElement?.classList.contains('is--error')).toBe(false); // if empty
    expect(inputDobGroup?.lastChild?.textContent).toBe('v-if'); // means error block did not show
    // we check validation on continueButton click
    await fireEvent.click(continueButton);
    // now check validation
    expect(inputDateOfBirth?.parentElement?.classList.contains('is--error')).toBe(true); // if empty
    expect(inputDobGroup?.lastChild?.textContent).toBe('Please complete'); // error message if empty
    await inputTriggerError(inputDateOfBirth, '2013-02-16', true);
    expect(inputDobGroup?.lastChild?.textContent).toBe('Must not be under 18');
    await inputTriggerError(inputDateOfBirth, '2033-02-16', true);
    expect(inputDobGroup?.lastChild?.textContent).toBe('Cannot set date in the future');
    await inputTriggerError(inputDateOfBirth, '2003-02-16', false);
    expect(inputDobGroup?.lastChild?.textContent).toBe('v-if'); // means error block did not show
  });

  it('phone number should pass validation', async () => {
    const {
      inputPhoneNumber, continueButton, wrapper,
    } = renderComponent();
    const inputPhoneGroup: HTMLInputElement = wrapper.getByTestId('phone-group');
    // on load it does not have error
    expect(inputPhoneNumber?.parentElement?.classList.contains('is--error')).toBe(false); // if empty
    expect(inputPhoneGroup?.lastChild?.textContent).toBe('v-if'); // means error block did not show
    // we check validation on continueButton click
    await fireEvent.click(continueButton);
    // now check validation
    expect(inputPhoneNumber?.parentElement?.classList.contains('is--error')).toBe(true); // if empty
    expect(inputPhoneGroup?.lastChild?.textContent).toBe('Please complete'); // error message if empty
    await inputTriggerError(inputPhoneNumber, 'abcd', true);
    expect(inputPhoneGroup?.lastChild?.textContent).toBe('Please complete');
    await inputTriggerError(inputPhoneNumber, '+123123', true);
    expect(inputPhoneGroup?.lastChild?.textContent).toBe('Should have at least 11 characters');
    await inputTriggerError(inputPhoneNumber, '123456', true);
    expect(inputPhoneGroup?.lastChild?.textContent).toBe('Should have at least 11 characters');
    await inputTriggerError(inputPhoneNumber, '12345678910', false);
    expect(inputPhoneGroup?.lastChild?.textContent).toBe('v-if'); // means error block did not show
  });

  it('addres 1 should pass validation', async () => {
    const {
      inputAddressOne, continueButton, wrapper,
    } = renderComponent();
    const inputAdress1Group: HTMLInputElement = wrapper.getByTestId('address-1-group');
    // on load it does not have error
    expect(inputAddressOne?.parentElement?.classList.contains('is--error')).toBe(false); // if empty
    expect(inputAdress1Group?.lastChild?.textContent).toBe('v-if'); // means error block did not show
    // we check validation on continueButton click
    await fireEvent.click(continueButton);
    // now check validation
    expect(inputAddressOne?.parentElement?.classList.contains('is--error')).toBe(true); // if empty
    expect(inputAdress1Group?.lastChild?.textContent).toBe('Please complete'); // error message if empty
    await inputTriggerError(inputAddressOne, '123', true);
    expect(inputAdress1Group?.lastChild?.textContent).toBe('Should have at least 4 characters');
    await inputTriggerError(inputAddressOne, 'test address 1', false);
    expect(inputAdress1Group?.lastChild?.textContent).toBe('v-if'); // means error block did not show
  });

  it('addres 2 should pass validation', async () => { // not sure
    const {
      inputAddressTwo, continueButton, wrapper,
    } = renderComponent();
    const inputAdress2Group: HTMLInputElement = wrapper.getByTestId('address-2-group');
    // on load it does not have error
    expect(inputAddressTwo?.parentElement?.classList.contains('is--error')).toBe(false); // if empty
    expect(inputAdress2Group?.lastChild?.textContent).toBe('v-if'); // means error block did not show
    // we check validation on continueButton click
    await fireEvent.click(continueButton);

    await inputTriggerError(inputAddressTwo, '', false);
    expect(inputAdress2Group?.lastChild?.textContent).toBe('v-if'); // means error block did not show
    await inputTriggerError(inputAddressTwo, '12', true);
    expect(inputAdress2Group?.lastChild?.textContent).toBe('Should have at least 3 characters');
    await inputTriggerError(inputAddressTwo, 'test address 1', false);
    expect(inputAdress2Group?.lastChild?.textContent).toBe('v-if'); // means error block did not show
  });

  it('city should pass validation', async () => {
    const {
      inputCity, continueButton, wrapper,
    } = renderComponent();
    const inputCityGroup: HTMLInputElement = wrapper.getByTestId('city-group');
    // on load it does not have error
    expect(inputCity?.parentElement?.classList.contains('is--error')).toBe(false); // if empty
    expect(inputCityGroup?.lastChild?.textContent).toBe('v-if'); // means error block did not show
    // we check validation on continueButton click
    await fireEvent.click(continueButton);

    expect(inputCity?.parentElement?.classList.contains('is--error')).toBe(true); // if empty
    expect(inputCityGroup?.lastChild?.textContent).toBe('Please complete'); // error message if empty
    await inputTriggerError(inputCity, 'c', true);
    expect(inputCityGroup?.lastChild?.textContent).toBe('Should have at least 2 characters');
    await inputTriggerError(inputCity, '123', true);
    expect(inputCityGroup?.lastChild?.textContent).toBe('Please complete');
    await inputTriggerError(inputCity, 'test city', false);
    expect(inputCityGroup?.lastChild?.textContent).toBe('v-if'); // means error block did not show
  });

  it('state should pass validation', async () => {
    const {
      inputState, continueButton, wrapper,
    } = renderComponent();
    const inputStateGroup: HTMLInputElement = wrapper.getByTestId('state-group');
    // on load it does not have error
    expect(inputState?.parentElement?.classList.contains('is--error')).toBe(false); // if empty
    expect(inputStateGroup?.lastChild?.textContent).toBe('v-if'); // means error block did not show
    // we check validation on continueButton click
    await fireEvent.click(continueButton);


    expect(inputState?.classList.contains('is--error')).toBe(true); // if empty
    expect(inputStateGroup?.lastChild?.textContent).toBe('Please complete'); // error message if empty
    await fireEvent.update(inputState, 'c');
    expect(inputState?.classList.contains('is--error')).toBe(true);
    await fireEvent.update(inputState, '123');
    expect(inputState?.classList.contains('is--error')).toBe(true);
  });

  it('zip code should pass validation', async () => {
    const {
      inputZipCode, continueButton, wrapper,
    } = renderComponent();
    const inputZipGroup: HTMLInputElement = wrapper.getByTestId('zip-group');
    // on load it does not have error
    expect(inputZipCode?.parentElement?.classList.contains('is--error')).toBe(false); // if empty
    expect(inputZipGroup?.lastChild?.textContent).toBe('v-if'); // means error block did not show
    // we check validation on continueButton click
    await fireEvent.click(continueButton);

    expect(inputZipCode?.parentElement?.classList.contains('is--error')).toBe(true); // if empty
    expect(inputZipGroup?.lastChild?.textContent).toBe('Please complete'); // error message if empty
    await inputTriggerError(inputZipCode, 'abc', true);
    expect(inputZipGroup?.lastChild?.textContent).toBe('Please complete');
    await inputTriggerError(inputZipCode, '12', true);
    expect(inputZipGroup?.lastChild?.textContent).toBe('Should have at least 5 characters');
    await inputTriggerError(inputZipCode, '123456', true);
    expect(inputZipGroup?.lastChild?.textContent).toBe('Please enter a valid zip code.');
    await inputTriggerError(inputZipCode, '12345', false);
    expect(inputZipGroup?.lastChild?.textContent).toBe('v-if'); // means error block did not show
  });

  it('country should pass validation', async () => {
    const {
      inputCountry, continueButton, wrapper,
    } = renderComponent();
    const inputCountryGroup: HTMLInputElement = wrapper.getByTestId('country-group');
    // on load it does not have error
    expect(inputCountry?.parentElement?.classList.contains('is--error')).toBe(false); // if empty
    expect(inputCountryGroup?.lastChild?.textContent).toBe('v-if'); // means error block did not show
    // we check validation on continueButton click
    await fireEvent.click(continueButton);

    expect(inputCountry?.classList.contains('is--error')).toBe(true); // if empty
    expect(inputCountryGroup?.lastChild?.textContent).toBe('Please complete'); // error message if empty
    expect(inputCountry?.classList.contains('is--error')).toBe(true); // if empty
    await fireEvent.update(inputCountry, 'c');
    expect(inputCountry?.classList.contains('is--error')).toBe(true);
    await fireEvent.update(inputCountry, '123');
    expect(inputCountry?.classList.contains('is--error')).toBe(true);
  });

  // risks
  it('educationalMaterials should pass validation', async () => {
    const {
      educationalMaterials, continueButton, wrapper,
    } = renderComponent();
    const educationalMaterialsGroup: HTMLInputElement = wrapper.getByTestId('educational-materials-group');
    // on load it does not have error
    expect(educationalMaterials?.parentElement?.parentElement?.classList.contains('is--error')).toBe(false); // if empty
    expect(educationalMaterialsGroup?.lastChild?.textContent).toBe('v-if'); // means error block did not show
    // we check validation on continueButton click
    await fireEvent.click(continueButton);

    expect(educationalMaterials?.parentElement?.parentElement?.classList.contains('is--error')).toBe(true); // if empty
    expect(educationalMaterialsGroup?.lastChild?.textContent).toBe('Please check this box if you want to proceed'); // error message if empty

    await fireEvent.click(educationalMaterials);
    expect(educationalMaterials?.parentElement?.parentElement?.classList.contains('is--error')).toBe(false);
    expect(educationalMaterialsGroup?.lastChild?.textContent).toBe('v-if');
  });

  it('cancelationRestrictions should pass validation', async () => {
    const {
      cancelationRestrictions, continueButton, wrapper,
    } = renderComponent();
    const cancelationRestrictionsGroup: HTMLInputElement = wrapper.getByTestId('cancelation-restrictions-group');
    // on load it does not have error
    expect(cancelationRestrictions?.parentElement?.parentElement?.classList.contains('is--error')).toBe(false); // if empty
    expect(cancelationRestrictionsGroup?.lastChild?.textContent).toBe('v-if'); // means error block did not show
    // we check validation on continueButton click
    await fireEvent.click(continueButton);

    expect(cancelationRestrictions?.parentElement?.parentElement?.classList.contains('is--error')).toBe(true); // if empty
    expect(cancelationRestrictionsGroup?.lastChild?.textContent).toBe('Please check this box if you want to proceed'); // error message if empty

    await fireEvent.click(cancelationRestrictions);
    expect(cancelationRestrictions?.parentElement?.parentElement?.classList.contains('is--error')).toBe(false);
    expect(cancelationRestrictionsGroup?.lastChild?.textContent).toBe('v-if');
  });

  it('resellDifficulties should pass validation', async () => {
    const {
      resellDifficulties, continueButton, wrapper,
    } = renderComponent();
    const resellDifficultiesGroup: HTMLInputElement = wrapper.getByTestId('resell-difficulties-group');
    // on load it does not have error
    expect(resellDifficulties?.parentElement?.parentElement?.classList.contains('is--error')).toBe(false); // if empty
    expect(resellDifficultiesGroup?.lastChild?.textContent).toBe('v-if'); // means error block did not show
    // we check validation on continueButton click
    await fireEvent.click(continueButton);

    expect(resellDifficulties?.parentElement?.parentElement?.classList.contains('is--error')).toBe(true); // if empty
    expect(resellDifficultiesGroup?.lastChild?.textContent).toBe('Please check this box if you want to proceed'); // error message if empty

    await fireEvent.click(resellDifficulties);
    expect(resellDifficulties?.parentElement?.parentElement?.classList.contains('is--error')).toBe(false);
    expect(resellDifficultiesGroup?.lastChild?.textContent).toBe('v-if');
  });

  it('riskInvolved should pass validation', async () => {
    const {
      riskInvolved, continueButton, wrapper,
    } = renderComponent();
    const riskInvolvedGroup: HTMLInputElement = wrapper.getByTestId('risk-involved-group');
    // on load it does not have error
    expect(riskInvolved?.parentElement?.parentElement?.classList.contains('is--error')).toBe(false); // if empty
    expect(riskInvolvedGroup?.lastChild?.textContent).toBe('v-if'); // means error block did not show
    // we check validation on continueButton click
    await fireEvent.click(continueButton);

    expect(riskInvolved?.parentElement?.parentElement?.classList.contains('is--error')).toBe(true); // if empty
    expect(riskInvolvedGroup?.lastChild?.textContent).toBe('Please check this box if you want to proceed'); // error message if empty

    await fireEvent.click(riskInvolved);
    expect(riskInvolved?.parentElement?.parentElement?.classList.contains('is--error')).toBe(false);
    expect(riskInvolvedGroup?.lastChild?.textContent).toBe('v-if');
  });

  it('noLegalAdvices should pass validation', async () => {
    const {
      noLegalAdvices, continueButton, wrapper,
    } = renderComponent();
    const noLegalAdvicesGroup: HTMLInputElement = wrapper.getByTestId('no_legal_advices_from_company-group');
    // on load it does not have error
    expect(noLegalAdvices?.parentElement?.parentElement?.classList.contains('is--error')).toBe(false); // if empty
    expect(noLegalAdvicesGroup?.lastChild?.textContent).toBe('v-if'); // means error block did not show
    // we check validation on continueButton click
    await fireEvent.click(continueButton);

    expect(noLegalAdvices?.parentElement?.parentElement?.classList.contains('is--error')).toBe(true); // if empty
    expect(noLegalAdvicesGroup?.lastChild?.textContent).toBe('Please check this box if you want to proceed'); // error message if empty

    await fireEvent.click(noLegalAdvices);
    expect(noLegalAdvices?.parentElement?.parentElement?.classList.contains('is--error')).toBe(false);
    expect(noLegalAdvicesGroup?.lastChild?.textContent).toBe('v-if');
  });

  it('consentPlaid should pass validation', async () => {
    const {
      consentPlaid, continueButton, wrapper,
    } = renderComponent();
    const consentPlaidGroup: HTMLInputElement = wrapper.getByTestId('consent-plaid-group');
    // on load it does not have error
    expect(consentPlaid?.parentElement?.parentElement?.classList.contains('is--error')).toBe(false); // if empty
    expect(consentPlaidGroup?.lastChild?.textContent).toBe('v-if'); // means error block did not show
    // we check validation on continueButton click
    await fireEvent.click(continueButton);

    expect(consentPlaid?.parentElement?.parentElement?.classList.contains('is--error')).toBe(true); // if empty
    expect(consentPlaidGroup?.lastChild?.textContent).toBe('Please check this box if you want to proceed'); // error message if empty

    await fireEvent.click(consentPlaid);
    expect(consentPlaid?.parentElement?.parentElement?.classList.contains('is--error')).toBe(false);
    expect(consentPlaidGroup?.lastChild?.textContent).toBe('v-if');
  });
});
