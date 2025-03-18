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

export interface ISession {
  active: boolean;
  authenticated_at: string;
  authentication_methods: [
    {
      completed_at: string;
      method: string;
    }
  ];
  authenticator_assurance_level: string;
  expires_at: string;
  id: string;
  profile_id: number;
  user_id: number;
  escrow_id: string;
  identity: IIdentity;
  issued_at: string;
  devices: {
    id: string;
    ip_address: string;
    user_agent: string;
    location: string;
  }[];
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
