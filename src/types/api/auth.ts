interface IUI {
  action: string;
  messages: [
    {
      context: object;
      id: number;
      text: string;
      type: string;
    }
  ];
  method: string;
  nodes: {
    attributes: {
      disabled: boolean;
      label: {
        context: object;
        id: number;
        text: string;
        type: string;
      };
      name: string;
      node_type: string;
      onclick: string;
      pattern: string;
      required: boolean;
      type: string;
      value: null;
    };
    group: string;
    messages: [
      {
        context: object;
        id: number;
        text: string;
        type: string;
      }
    ];
    meta: {
      label: {
        context: object;
        id: number;
        text: string;
        type: string;
      };
    };
    type: string;
  }[];
}

export interface IGetAuthFlow {
  active: boolean;
  created_at: string;
  expires_at: string;
  id: string;
  issued_at: string;
  refresh: boolean;
  request_url: string;
  requested_aal: string;
  return_to: string;
  type: string;
  ui: IUI;
  updated_at: string;
}

export interface IGetLogoutURL {
  logout_token: string;
  logout_url: string;
}

export interface IGetSignup {
  id: string;
  type: string;
  expires_at: string;
  issued_at: string;
  request_url: string;
  ui: {
    action: string;
    method: string;
    nodes: {
      type: string;
      group: string;
      attributes: {
        name: string;
        type: string;
        disabled: boolean;
        node_type: string;
        value?: string;
        required?: boolean;
        autocomplete?: string;
      };
      messages: [];
      meta: {
        label?: {
          id: number;
          text: string;
          type: string;
        };
      };
    }[];
    messages: {
      id: number;
      text: string;
      type: string;
    }[];
  };
}

export interface IAuthError422 {
  code: number;
  debug: string;
  details: object;
  id: string;
  message: string;
  reason: string;
  redirect_browser_to: string;
  request: string;
  status: string;
}

export interface IAuthError400 {
  active: string;
  expires_at: string;
  id: string;
  issued_at: string;
  request_url: string;
  return_to: string;
  type: string;
  ui: IUI;
}

export interface IRecovery {
  active: string;
  expires_at: string;
  id: string;
  issued_at: string;
  request_url: string;
  return_to: string;
  state: string;
  type: string;
  ui: IUI;
}

export interface IRecovery422 {
  error: IAuthError422;
  redirect_browser_to: string;
}

export interface ISessionIdentityTraits {
  email: string;
  first_name: string;
  last_name: string;
  phone: string;
  country: string;
  city: string;
  address: string;
  address2: string;
  state: string;
  zip: string;
}

interface IIdentity {
  created_at: string;
  credentials: {
    property1: {
      config: object;
      created_at: string;
      identifiers: [
        string
      ];
      type: string;
      updated_at: string;
    };
    property2: {
      config: object;
      created_at: string;
      identifiers: [
        string
      ];
      type: string;
      updated_at: string;
    };
  };
  id: string;
  recovery_addresses: [
    {
      created_at: string;
      id: string;
      updated_at: string;
      value: string;
      via: string;
    }
  ];
  schema_id: string;
  schema_url: string;
  state: string;
  state_changed_at: string;
  traits: ISessionIdentityTraits;
  updated_at: string;
  verifiable_addresses: [
    {
      created_at: string;
      id: string;
      status: string;
      updated_at: string;
      value: string;
      verified: boolean;
      verified_at: string;
      via: string;
    },
  ];
}

interface IAuthMethod {
  aal: string;
  completed_at: string;
  method: string;
  organization: string;
  provider: string;
}
interface IDevices {
  id: string;
  ip_address: string;
  user_agent: string;
  location: string;
}

export interface ISession {
  active: boolean;
  authenticated_at: string;
  authentication_methods: IAuthMethod[];
  authenticator_assurance_level: string;
  expires_at: string;
  id: string;
  identity: IIdentity;
  issued_at: string;
  devices: IDevices[];
  tikenized: string;
}

export interface IError {
  debug: string;
  error: string;
  error_description: string;
  id: string;
  message: string;
  status_code: number;
}
export interface IErrorGeneric {
  error: IError;
  redirect_browser_to?: string;
}
interface IOidcContext {
  acr_values: string[];
  display: string;
  id_token_hint_claims: {};
  login_hint: string;
  ui_locales: string[];
}

interface IOauthClient {
  access_token_strategy: string;
  allowed_cors_origins: string[];
  audience: string[];
  authorization_code_grant_access_token_lifespan: string | null;
  authorization_code_grant_id_token_lifespan: string | null;
  authorization_code_grant_refresh_token_lifespan: string | null;
  backchannel_logout_session_required: boolean;
  backchannel_logout_uri: string;
  client_credentials_grant_access_token_lifespan: string | null;
  client_id: string;
  client_name: string;
  client_secret: string;
  client_secret_expires_at: number;
  client_uri: string;
  contacts: string[];
  created_at: string;
  frontchannel_logout_session_required: boolean;
  frontchannel_logout_uri: string;
  grant_types: string[];
  implicit_grant_access_token_lifespan: string | null;
  implicit_grant_id_token_lifespan: string | null;
  jwks: any;
  jwks_uri: string;
  jwt_bearer_grant_access_token_lifespan: string | null;
  logo_uri: string;
  metadata: {};
  owner: string;
  policy_uri: string;
  post_logout_redirect_uris: string[];
  redirect_uris: string[];
  refresh_token_grant_access_token_lifespan: string | null;
  refresh_token_grant_id_token_lifespan: string | null;
  refresh_token_grant_refresh_token_lifespan: string | null;
  registration_access_token: string;
  registration_client_uri: string;
  request_object_signing_alg: string;
  request_uris: string[];
  response_types: string[];
  scope: string;
  sector_identifier_uri: string;
  skip_consent: boolean;
  skip_logout_consent: boolean;
  subject_type: string;
  token_endpoint_auth_method: string;
  token_endpoint_auth_signing_alg: string;
  tos_uri: string;
  updated_at: string;
  userinfo_signed_response_alg: string;
}

interface IOauthRequest {
  challenge: string;
  client: IOauthClient;
  oidc_context: IOidcContext;
  request_url: string;
  requested_access_token_audience: string[];
  requested_scope: string[];
  session_id: string;
  skip: boolean;
  subject: boolean;
}

export interface IErrora {
  active: string;
  created_at: string;
  expires_at: string;
  id: string;
  issued_at: string;
  oauth2_login_challenge: string;
  oauth2_login_request: IOauthRequest;
  organization_id: string | null;
  refresh: boolean;
  request_url: string;
  requested_aal: string;
  return_to: string;
  session_token_exchange_code: string;
  state: any;
  transient_payload: {};
  type: string;
  ui: IUI;
  updated_at: string;
}

export interface IGetSettingsOk {
  active: boolean;
  expires_at: string;
  id: string;
  identity: IIdentity;
  issued_at: string;
  refresh: boolean;
  request_url: string;
  return_to: string;
  state: string;
  type: string;
  ui: IUI;
}

export interface ISettingsError400 {
  active: string;
  expires_at: string;
  id: string;
  identity: IIdentity;
  issued_at: string;
  request_url: string;
  return_to: string;
  state: string;
  type: string;
  ui: IUI;
}

export interface ISchemaDefinitions {
  additionalProperties: boolean;
  properties: object;
  required: string[];
  type: string;
}

export interface ISchema {
  definitions: {
    Auth: ISchemaDefinitions | undefined;
  };
}

export interface ISetLoginOk {
  session: ISession;
  session_token: string;
}

export interface ISetSignUpOK {
  identity: IIdentity;
  session: ISession;
  session_token: string;
}

export interface IAuthGenericError {
  error: IAuthError422;
}
