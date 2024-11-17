import { errorMessageRule } from 'UiKit/helpers/validation/rules';
import { JSONSchemaType } from 'ajv';

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
