import { JSONSchemaType } from 'ajv';
import GoogleIcon from 'InvestCommon/assets/images/social-login/google1.svg?component';
import FacebookIcon from 'InvestCommon/assets/images/social-login/facebook1.svg?component';
import GithubIcon from 'InvestCommon/assets/images/social-login/github1.svg?component';
import LinkedinIcon from 'InvestCommon/assets/images/social-login/linkedin1.svg?component';
import GoogleHoverIcon from 'InvestCommon/assets/images/social-login/google1-hover.svg?component';
import FacebookHoverIcon from 'InvestCommon/assets/images/social-login/facebook-hover.svg?component';
import GithubHoverIcon from 'InvestCommon/assets/images/social-login/github1-hover.svg?component';
import LinkedinHoverIcon from 'InvestCommon/assets/images/social-login/linkedin-hover.svg?component';
import {
  codeRule, emailRule, errorMessageRule, firstNameRule, lastNameRule, passwordRule,
} from 'UiKit/helpers/validation/rules';


export type FormModelSignUp = {
  first_name: string;
  last_name: string;
  email: string;
  create_password: string;
  repeat_password: string;
}

export const schemaSignUp = {
  $schema: 'http://json-schema.org/draft-07/schema#',
  definitions: {
    Auth: {
      properties: {
        first_name: firstNameRule,
        last_name: lastNameRule,
        email: emailRule,
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
      required: ['first_name', 'last_name', 'email', 'create_password', 'repeat_password'],
      errorMessage: errorMessageRule,
    },
  },
  $ref: '#/definitions/Auth',
} as unknown as JSONSchemaType<FormModelSignUp>;

export const socialSignin = [
  {
    icon: GoogleIcon,
    iconHover: GoogleHoverIcon,
    provider: 'google',
    classes: 'login-social-google',
  },
  {
    icon: FacebookIcon,
    iconHover: FacebookHoverIcon,
    provider: 'facebook',
    classes: 'login-social-facebook',
  },
  {
    icon: GithubIcon,
    iconHover: GithubHoverIcon,
    provider: 'github',
    classes: 'login-social-github',
  },
  {
    icon: LinkedinIcon,
    iconHover: LinkedinHoverIcon,
    provider: 'linkedin',
    classes: 'login-social-linkedin',
  },
];


export type FormModelSignIn = {
  email: string;
  password: string;
}

export const schemaSignIn = {
  $schema: 'http://json-schema.org/draft-07/schema#',
  definitions: {
    Auth: {
      properties: {
        email: emailRule,
        password: passwordRule,
      },
      type: 'object',
      errorMessage: errorMessageRule,
      required: ['email', 'password'],
    },
  },
  $ref: '#/definitions/Auth',
} as unknown as JSONSchemaType<FormModelSignIn>;

export type FormModelForgot = {
  email: string;
}

export const schemaForgot = {
  $schema: 'http://json-schema.org/draft-07/schema#',
  definitions: {
    Auth: {
      properties: {
        email: emailRule,
      },
      type: 'object',
      required: ['email'],
      errorMessage: errorMessageRule,
    },
  },
  $ref: '#/definitions/Auth',
} as unknown as JSONSchemaType<FormModelForgot>;

export type FormModelCode = {
  code: string;
}

export const schemaCode = {
  $schema: 'http://json-schema.org/draft-07/schema#',
  definitions: {
    Auth: {
      properties: {
        code: codeRule,
      },
      type: 'object',
      required: ['code'],
      errorMessage: errorMessageRule,
    },
  },
  $ref: '#/definitions/Auth',
} as unknown as JSONSchemaType<FormModelCode>;


export type FormModelResetPassword = {
  first_name: string;
  last_name: string;
  email: string;
  create_password: string;
  repeat_password: string;
}

export const schemaResetPassword = {
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
} as unknown as JSONSchemaType<FormModelResetPassword>;
