import { IOfferSharesError } from 'InvestCommon/types/api/offers';
import { InvestStepTypes } from 'InvestCommon/types/api/invest';
import { errorMessageRule } from 'UiKit/helpers/validation/rules';
import { JSONSchemaType } from 'ajv';
import { useToast } from 'UiKit/components/Base/VToast/use-toast';

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
    }
  } catch (errorTry) {
    // ignore
  }
  toast(TOAST_OPTIONS);
};

export const defaultInvestSteps = {
  [InvestStepTypes.amount]: {
    title: 'Investment',
    value: InvestStepTypes.amount,
    done: false,
    to: 'amount',
  },
  [InvestStepTypes.ownership]: {
    title: 'Ownership',
    value: InvestStepTypes.ownership,
    done: false,
    to: 'ownership',
  },
  [InvestStepTypes.signature]: {
    title: 'Signature',
    value: InvestStepTypes.signature,
    done: false,
    to: 'signature',
  },
  [InvestStepTypes.funding]: {
    title: 'Funding',
    value: InvestStepTypes.funding,
    done: false,
    to: 'funding',
  },
  [InvestStepTypes.review]: {
    title: 'Confirmation',
    value: InvestStepTypes.review,
    done: false,
    to: 'review',
  },
};

export enum OfferTabTypes {
  description = 'description',
  highlights = 'highlights',
  documents = 'documents',
  comments = 'comments',
}

export type IOfferTabOption = {
  value: OfferTabTypes;
  label: string;
}

export const OFFER_TAB_OPTIONS: Record<OfferTabTypes, IOfferTabOption> = {
  [OfferTabTypes.description]: {
    value: OfferTabTypes.description,
    label: 'Description',
  },
  [OfferTabTypes.highlights]: {
    value: OfferTabTypes.highlights,
    label: 'Highlights',
  },
  [OfferTabTypes.documents]: {
    value: OfferTabTypes.documents,
    label: 'Financial Documents',
  },
  [OfferTabTypes.comments]: {
    value: OfferTabTypes.comments,
    label: 'Ask a Question',
  },
} as const;

export type FormModelOfferComment = {
  comment: string;
  offer_id: number;
  related: string;
}

export const schemaOfferComment = {
  $schema: 'http://json-schema.org/draft-07/schema#',
  definitions: {
    CommentCreate: {
      properties: {
        comment: {},
        offer_id: {},
        related: {},
      },
      type: 'object',
      errorMessage: errorMessageRule,
    },
  },
  $ref: '#/definitions/CommentCreate',
} as unknown as JSONSchemaType<FormModelOfferComment>;
