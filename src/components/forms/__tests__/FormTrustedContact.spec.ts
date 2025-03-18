import {
  render, fireEvent,
} from '@testing-library/vue';
import { createPinia, setActivePinia, storeToRefs } from 'pinia';
import {
  beforeEach, expect, describe, it, vi,
} from 'vitest';
import { useInvestmentsStore, useUsersStore } from 'InvestCommon/store';
import createFetchMock from 'vitest-fetch-mock';
import { mockOwnershipStepOptions } from 'InvestCommon/tests/__mocks__';
import FormTrustedContact from '../FormTrustedContact.vue';

const fetchMocker = createFetchMock(vi);
fetchMocker.enableMocks();

vi.mock('vue-router', () => ({
  useRouter: vi.fn().mockReturnValue({
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
  const wrapper = render(FormTrustedContact);

  const inputFirstName: HTMLInputElement = wrapper.getByTestId('first-name');
  const inputLastName: HTMLInputElement = wrapper.getByTestId('last-name');
  const inputDateOfBirth: HTMLInputElement = wrapper.getByTestId('dob');
  const inputPhoneNumber: HTMLInputElement = wrapper.getByTestId('phone');
  const inputEmail: HTMLInputElement = wrapper.getByTestId('email');
  const inputRelationship: HTMLInputElement = wrapper.getByTestId('relationship-type');
  const continueButton: HTMLButtonElement = wrapper.getByTestId('button');

  return {
    inputFirstName,
    inputLastName,
    inputDateOfBirth,
    inputPhoneNumber,
    inputEmail,
    inputRelationship,
    continueButton,
    wrapper,
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

describe('FormTrustedContact', () => {
  beforeEach(async () => {
    setActivePinia(createPinia());
    const investmentsStore = useInvestmentsStore();
    fetchMocker.mockResponse(JSON.stringify(mockOwnershipStepOptions));
    await investmentsStore.setOwnershipOptions('abc', '1', '1');
    const usersStore = useUsersStore();
    const { selectedUserProfileId } = storeToRefs(usersStore);
    selectedUserProfileId.value = 1;
    Element.prototype.scrollIntoView = vi.fn();
  });
  it('should mount inputs', () => {
    const {
      inputFirstName,
      inputLastName,
      inputDateOfBirth,
      inputPhoneNumber,
      inputEmail,
      inputRelationship,
      continueButton,
    } = renderComponent();

    expect(inputFirstName).toBeDefined();
    expect(inputLastName).toBeDefined();
    expect(inputDateOfBirth).toBeDefined();
    expect(inputPhoneNumber).toBeDefined();
    expect(inputEmail).toBeDefined();
    expect(inputRelationship).toBeDefined();
    expect(continueButton).toBeDefined();
  });

  it('relationship type should pass validation', async () => {
    const {
      inputRelationship, continueButton, wrapper,
    } = renderComponent();
    const inputRelationshipGroup: HTMLInputElement = wrapper.getByTestId('relationship-type-group');
    // on load it does not have error
    expect(inputRelationship?.parentElement?.classList.contains('is--error')).toBe(false); // if empty
    expect(inputRelationshipGroup?.lastChild?.textContent).toBe('v-if'); // means error block did not show
    // we check validation on continueButton click
    await fireEvent.click(continueButton);
    // now check validation
    expect(inputRelationship?.parentElement?.classList.contains('is--error')).toBe(true); // if empty
    expect(inputRelationshipGroup?.lastChild?.textContent).toBe('Please complete'); // error message if empty
    await inputTriggerError(inputRelationship, 'a', true);
    expect(inputRelationshipGroup?.lastChild?.textContent).toBe('Should have at least 2 characters');
    await inputTriggerError(inputRelationship, 'abc', false);
    expect(inputRelationshipGroup?.lastChild?.textContent).toBe('v-if'); // means error block did not show
  });

  it('first name should pass validation', async () => {
    const {
      inputFirstName, continueButton, wrapper,
    } = renderComponent();
    const inputFirstNameGroup: HTMLInputElement = wrapper.getByTestId('first-name-group');
    // on load it does not have error
    expect(inputFirstName?.parentElement?.classList.contains('is--error')).toBe(false); // if empty
    expect(inputFirstNameGroup?.lastChild?.textContent).toBe('v-if'); // means error block did not show
    // we check validation on continueButton click
    await fireEvent.click(continueButton);
    // now check validation
    expect(inputFirstName?.parentElement?.classList.contains('is--error')).toBe(true); // if empty
    expect(inputFirstNameGroup?.lastChild?.textContent).toBe('Please complete'); // error message if empty
    await inputTriggerError(inputFirstName, 'a', true);
    expect(inputFirstNameGroup?.lastChild?.textContent).toBe('Should have at least 2 characters');
    await inputTriggerError(inputFirstName, 'abc', false);
    expect(inputFirstNameGroup?.lastChild?.textContent).toBe('v-if'); // means error block did not show
  });

  it('last name should pass validation', async () => {
    const {
      inputLastName, continueButton, wrapper,
    } = renderComponent();
    const inputlLastNameGroup: HTMLInputElement = wrapper.getByTestId('last-name-group');
    // on load it does not have error
    expect(inputLastName?.parentElement?.classList.contains('is--error')).toBe(false); // if empty
    expect(inputlLastNameGroup?.lastChild?.textContent).toBe('v-if'); // means error block did not show
    // we check validation on continueButton click
    await fireEvent.click(continueButton);
    // now check validation
    expect(inputLastName?.parentElement?.classList.contains('is--error')).toBe(true); // if empty
    expect(inputlLastNameGroup?.lastChild?.textContent).toBe('Please complete'); // error message if empty
    await inputTriggerError(inputLastName, 'a', true);
    expect(inputlLastNameGroup?.lastChild?.textContent).toBe('Should have at least 2 characters');
    await inputTriggerError(inputLastName, 'abc', false);
    expect(inputlLastNameGroup?.lastChild?.textContent).toBe('v-if'); // means error block did not show
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
    expect(inputPhoneGroup?.lastChild?.textContent).toBe('Should have at least 11 characters');
    await inputTriggerError(inputPhoneNumber, '+123123', true);
    expect(inputPhoneGroup?.lastChild?.textContent).toBe('Should have at least 11 characters');
    await inputTriggerError(inputPhoneNumber, '123456', true);
    expect(inputPhoneGroup?.lastChild?.textContent).toBe('Should have at least 11 characters');
    await inputTriggerError(inputPhoneNumber, '12345678910', false);
    expect(inputPhoneGroup?.lastChild?.textContent).toBe('v-if'); // means error block did not show
  });

  it('email should pass validation', async () => {
    const {
      inputEmail, continueButton, wrapper,
    } = renderComponent();
    const inputEmailGroup: HTMLInputElement = wrapper.getByTestId('email-group');
    // on load it does not have error
    expect(inputEmail?.parentElement?.classList.contains('is--error')).toBe(false); // if empty
    expect(inputEmailGroup?.lastChild?.textContent).toBe('v-if'); // means error block did not show
    // we check validation on continueButton click
    await fireEvent.click(continueButton);
    // now check validation
    expect(inputEmail?.parentElement?.classList.contains('is--error')).toBe(true); // if empty
    expect(inputEmailGroup?.lastChild?.textContent).toBe('Please complete'); // error message if empty
    await inputTriggerError(inputEmail, 'abcd', true);
    expect(inputEmailGroup?.lastChild?.textContent).toBe('Please provide a valid email');
    await inputTriggerError(inputEmail, '123s@sdf.com', false);
    expect(inputEmailGroup?.lastChild?.textContent).toBe('v-if'); // means error block did not show
  });
});
