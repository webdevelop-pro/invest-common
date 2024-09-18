export interface AuthenticationMethod {
  method: string;
  aal: string;
  completed_at: string;
}

export interface Name {
  first: string;
  last: string;
}

export interface Traits {
  email: string;
  name: Name;
}

export interface VerifiableAddress {
  id: string;
  value: string;
  verified: boolean;
  via: string;
  status: string;
  created_at: Date;
  updated_at: Date;
}

export interface RecoveryAddress {
  id: string;
  value: string;
  via: string;
  created_at: Date;
  updated_at: Date;
}

export interface Identity {
  id: string;
  schema_id: string;
  schema_url: string;
  state: string;
  state_changed_at: string;
  traits: Traits;
  verifiable_addresses: VerifiableAddress[];
  recovery_addresses: RecoveryAddress[];
  metadata_public?: unknown;
  created_at: Date;
  updated_at: Date;
}

export interface IError {
  code: string;
  message: string;
}
