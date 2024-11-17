
import { JSONSchemaType } from 'ajv';
import { errorMessageRule, passwordRule } from 'UiKit/helpers/validation/rules';


export type FormModelResetPassword = {
  first_name: string;
  last_name: string;
  email: string;
  create_password: string;
  repeat_password: string;
}

export const schemaResetPassword = {
  $schema: 'http://json-schema.org/draft-07/schema#',
  definitions: {
    Auth: {
      properties: {
        create_password: passwordRule,
        repeat_password: {
          const: {
            $data: '1/create_password',
          },
          ...passwordRule,
          errorMessage: {
            const: 'Passwords do not match',
          },
        },
      },
      type: 'object',
      required: ['create_password', 'repeat_password'],
      errorMessage: errorMessageRule,
    },
  },
  $ref: '#/definitions/Auth',
} as unknown as JSONSchemaType<FormModelResetPassword>;
