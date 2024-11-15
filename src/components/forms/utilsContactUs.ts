
import { emailRule, errorMessageRule, firstNameRule } from 'UiKit/helpers/validation/rules';
import { JSONSchemaType } from 'ajv';


export type FormModelContactUs = {
  name: string;
  email: string;
  subject: string;
  message: string;
}

export const schemaContactUs = {
  $schema: 'http://json-schema.org/draft-07/schema#',
  definitions: {
    ContactUs: {
      properties: {
        name: firstNameRule,
        email: emailRule,
        message: {
          minLength: 10,
          type: 'string',
        },
      },
      type: 'object',
      required: ['name', 'subject', 'email', 'message'],
      errorMessage: errorMessageRule,
    },
  },
  $ref: '#/definitions/ContactUs',
} as unknown as JSONSchemaType<FormModelContactUs>;


export const SELECT_SUBJECT = [
  {
    value: 'investment',
    label: 'Investment',
  },
  {
    value: 'report an issue',
    label: 'Report an issue',
  },
  {
    value: 'i have a question',
    label: 'I have a question',
  },
  {
    value: 'other',
    label: 'Other',
  },
];
