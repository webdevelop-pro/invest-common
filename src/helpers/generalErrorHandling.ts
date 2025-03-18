import {
  IAuthGenericError, IAuthError422, IAuthError400, IRecovery, ISettingsError400, IRecovery422,
} from 'InvestCommon/types/api/auth';
import { toRaw } from 'vue';
import { useToast } from 'UiKit/components/Base/VToast/use-toast';
import { IOfferSharesError } from '../types/api/offers';

const { toast } = useToast();

const TOAST_OPTIONS = {
  title: 'Something went wrong',
  description: 'Please try again',
  variant: 'error',
};

export const generalErrorHandling = async (error: Response) => {
  try {
    const errorJson = await error.json();

    if (errorJson as IOfferSharesError) {
      const data:IOfferSharesError = errorJson;
      // eslint-disable-next-line prefer-destructuring
      if (data.number_of_shares.length) TOAST_OPTIONS.description = data.number_of_shares[0];
    } else if (errorJson as IAuthGenericError) {
      const data:IAuthGenericError = errorJson;
      if (data.error && data.error.message) TOAST_OPTIONS.description = data.error.message;
    } else if (errorJson) {
      TOAST_OPTIONS.description = errorJson;
    }
  } catch (errorTry) {
    // ignore
  }
  toast(TOAST_OPTIONS);
};

export const errorHandling422 = async (error: Response) => {
  try {
    const errorJson = await error.json();

    if (errorJson as IAuthGenericError) {
      const data:IAuthGenericError = errorJson;
      if (data.error && data.error.message) TOAST_OPTIONS.description = data.error.message;
    }

    if (errorJson as IAuthError422) {
      const data:IAuthError422 = errorJson;
      if (data.message) TOAST_OPTIONS.description = data.message;
    }

    if (errorJson as IAuthError400) {
      const data:IAuthError400 = errorJson;
      if (data.ui && data.ui.messages && data.ui.messages[0].text) {
        TOAST_OPTIONS.description = data.ui.messages[0].text;
      }
      if (data.ui && data.ui.nodes) {
        data.ui.nodes.map((node) => {
          if (node.messages[0] && node.messages[0].text) {
            TOAST_OPTIONS.description = node.messages[0].text;
          }
          return TOAST_OPTIONS;
        });
      }
    }
  } catch (errorTry) {
    // ignore
  }
  toast(TOAST_OPTIONS);
};

// eslint-disable-next-line consistent-return
export const errorHandlingRecovery = async (error: Response) => {
  try {
    const errorJson = await error.json();

    if (errorJson as IAuthGenericError) {
      const data:IAuthGenericError = errorJson;
      if (data.error && data.error.message) TOAST_OPTIONS.description = data.error.message;
    }

    if (errorJson as IRecovery422) return structuredClone(toRaw(errorJson));

    if (errorJson as IRecovery) {
      const data:IRecovery = errorJson;
      if (data.ui && data.ui.messages && data.ui.messages[0].text) TOAST_OPTIONS.description = data.ui.messages[0].text;
      if (data.ui && data.ui.nodes) {
        data.ui.nodes.map((node) => {
          if (node.messages[0] && node.messages[0].text) {
            TOAST_OPTIONS.description = node.messages[0].text;
          }
          return TOAST_OPTIONS;
        });
      }
    }
    return structuredClone(toRaw(errorJson));
  } catch (errorTry) {
    // ignore
  }
  toast(TOAST_OPTIONS);
};

export const errorHandlingSettings = async (error: Response) => {
  try {
    const errorJson = await error.json();

    if (errorJson as IAuthGenericError) {
      const data:IAuthGenericError = errorJson;
      if (data.error && data.error.message) TOAST_OPTIONS.description = data.error.reason || data.error.message;
    }

    if (errorJson as IAuthError422) {
      const data:IAuthError422 = errorJson;
      if (data.message) TOAST_OPTIONS.description = data.message;
    }

    if (errorJson as ISettingsError400) {
      const data:IAuthError400 = errorJson;
      if (data.ui && data.ui.messages && data.ui.messages[0].text) TOAST_OPTIONS.description = data.ui.messages[0].text;
      if (data.ui && data.ui.nodes) {
        data.ui.nodes.map((node) => {
          if (node.messages[0] && node.messages[0].text) {
            TOAST_OPTIONS.description = node.messages[0].text;
          }
          return TOAST_OPTIONS;
        });
      }
    }
  } catch (errorTry) {
    // ignore
  }
  toast(TOAST_OPTIONS);
};
