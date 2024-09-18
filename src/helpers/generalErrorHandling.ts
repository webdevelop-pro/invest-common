import { useCore } from 'InvestCommon/store';
import { notify } from '@kyvg/vue3-notification';
import {
  IAuthGenericError, IAuthError422, IAuthError400, IRecovery, ISettingsError400, IRecovery422,
} from 'InvestCommon/types/api/auth';
import { IOfferSharesError } from '../types/api/offers';
import { toRaw } from 'vue';

const statusCodes = [500, 501, 502, 503, 504, 505, 506, 507, 508, 510, 511];
const NOTIFY_OPTIONS = {
  text: 'Something went wrong',
  data: {
    description: 'Please try again',
    status: 3,
  },
  type: 'error',
  group: 'transaction',
  duration: 10000,
};

// eslint-disable @typescript-eslint/no-unsafe-assignment

export const generalErrorHandling = async (error: Response) => {

  try {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const errorJson = await error.json();

    if (errorJson as IOfferSharesError) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      const data:IOfferSharesError = errorJson;
      // eslint-disable-next-line prefer-destructuring
      if (data.number_of_shares.length) NOTIFY_OPTIONS.text = data.number_of_shares[0];
    }
    else if (errorJson as IAuthGenericError) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      const data:IAuthGenericError = errorJson;
      if (data.error && data.error.message) NOTIFY_OPTIONS.text = data.error.message;
    }
    else if (errorJson) {
      // eslint-disable-next-line
      NOTIFY_OPTIONS.text = errorJson;
    }
  } catch (errorTry) {
    // ignore
  }
  notify(NOTIFY_OPTIONS);
};


export const errorHandling422 = async (error: Response) => {
  try {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const errorJson = await error.json();

    if (errorJson as IAuthGenericError) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      const data:IAuthGenericError = errorJson;
      if (data.error && data.error.message) NOTIFY_OPTIONS.text = data.error.message;
    }

    if (errorJson as IAuthError422) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      const data:IAuthError422 = errorJson;
      if (data.message) NOTIFY_OPTIONS.text = data.message;
    }

    if (errorJson as IAuthError400) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      const data:IAuthError400 = errorJson;
      if (data.ui && data.ui.messages && data.ui.messages[0].text) {
        NOTIFY_OPTIONS.text = data.ui.messages[0].text;
      }
      if (data.ui && data.ui.nodes) {
        data.ui.nodes.map((node) => {
          if (node.messages[0] && node.messages[0].text) {
            NOTIFY_OPTIONS.text = node.messages[0].text;
          }
          return NOTIFY_OPTIONS;
        });
      }
    }
  } catch (errorTry) {
    // ignore
  }
  notify(NOTIFY_OPTIONS);
};

// eslint-disable-next-line
export const errorHandlingRecovery = async (error: Response) => {
  try {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const errorJson = await error.json();

    if (errorJson as IAuthGenericError) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      const data:IAuthGenericError = errorJson;
      if (data.error && data.error.message) NOTIFY_OPTIONS.text = data.error.message;
    }

    // eslint-disable-next-line
    if (errorJson as IRecovery422) return structuredClone(toRaw(errorJson));

    if (errorJson as IRecovery) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      const data:IRecovery = errorJson;
      if (data.ui && data.ui.messages && data.ui.messages[0].text) NOTIFY_OPTIONS.text = data.ui.messages[0].text;
      if (data.ui && data.ui.nodes) {
        data.ui.nodes.map((node) => {
          if (node.messages[0] && node.messages[0].text) {
            NOTIFY_OPTIONS.text = node.messages[0].text;
          }
          return NOTIFY_OPTIONS;
        });
      }
    }
    // eslint-disable-next-line
    return structuredClone(toRaw(errorJson));
  } catch (errorTry) {
    // ignore
  }
  notify(NOTIFY_OPTIONS);
};


export const errorHandlingSettings = async (error: Response) => {
  try {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const errorJson = await error.json();

    if (errorJson as IAuthGenericError) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      const data:IAuthGenericError = errorJson;
      if (data.error && data.error.message) NOTIFY_OPTIONS.text = data.error.reason || data.error.message;
    }

    if (errorJson as IAuthError422) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      const data:IAuthError422 = errorJson;
      if (data.message) NOTIFY_OPTIONS.text = data.message;
    }

    if (errorJson as ISettingsError400) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      const data:IAuthError400 = errorJson;
      if (data.ui && data.ui.messages && data.ui.messages[0].text) NOTIFY_OPTIONS.text = data.ui.messages[0].text;
      if (data.ui && data.ui.nodes) {
        data.ui.nodes.map((node) => {
          if (node.messages[0] && node.messages[0].text) {
            NOTIFY_OPTIONS.text = node.messages[0].text;
          }
          return NOTIFY_OPTIONS;
        });
      }
    }
  } catch (errorTry) {
    // ignore
  }
  notify(NOTIFY_OPTIONS);
};
