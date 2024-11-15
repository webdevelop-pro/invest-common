import { IOfferSharesError } from 'InvestCommon/types/api/offers';
import { InvestStepTypes } from 'InvestCommon/types/api/invest';
import { notify } from '@kyvg/vue3-notification';
import { errorMessageRule } from 'UiKit/helpers/validation/rules';
import { JSONSchemaType } from 'ajv';

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
  } catch (errorTry) {
    // ignore
  }
  notify(NOTIFY_OPTIONS);
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
