import {
  render, fireEvent,
} from '@testing-library/vue';
import FormFinancialInformation from '../FormFinancialInformation.vue';
import { createPinia, setActivePinia, storeToRefs } from 'pinia';
import {
  beforeEach, expect, describe, it, vi,
} from 'vitest';
import { useUserIdentitysStore, useUsersStore } from 'InvestCommon/store';
import createFetchMock from 'vitest-fetch-mock';
import { userIndividualOptionsMock } from '@/tests/__mocks__';

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
  const wrapper = render(FormFinancialInformation);

  const continueButton: HTMLButtonElement = wrapper.getByTestId('button');
  const educationalMaterials: HTMLInputElement = wrapper.getByTestId('educational-materials');
  const cancelationRestrictions: HTMLInputElement = wrapper.getByTestId('cancelation-restrictions');
  const resellDifficulties: HTMLInputElement = wrapper.getByTestId('resell-difficulties');
  const riskInvolved: HTMLInputElement = wrapper.getByTestId('risk-involved');
  const noLegalAdvices: HTMLInputElement = wrapper.getByTestId('no_legal_advices_from_company');
  const consentPlaid: HTMLInputElement = wrapper.getByTestId('consent-plaid');

  return {
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
      continueButton, wrapper,
      educationalMaterials, cancelationRestrictions, resellDifficulties,
      riskInvolved, noLegalAdvices, consentPlaid,
    } = renderComponent();

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
