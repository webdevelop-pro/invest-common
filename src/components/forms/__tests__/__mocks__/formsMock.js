import merge from 'lodash/merge';


export const login = JSON.parse(JSON.stringify(
  {
    session: {
      id: 'd8fa6d91-4c59-4f9b-937d-0d3a347e7507',
      active: true,
      expires_at: '2024-02-07T17:20:10.796207158Z',
      authenticated_at: '2024-02-06T17:20:11.029110009Z',
      authenticator_assurance_level: 'aal1',
      authentication_methods: [{ method: 'password', aal: 'aal1', completed_at: '2024-02-06T17:20:10.796206698Z' }],
      issued_at: '2024-02-06T17:20:10.796207158Z',
      identity: {
        id: '5bd2d1f2-e182-4a72-bcfe-2917e55f8565',
        schema_id: 'default',
        schema_url: 'http://local.webdevelop.us:8081/schemas/ZGVmYXVsdA',
        state: 'active',
        state_changed_at: '2024-02-06T17:20:10.789191321Z',
        traits: { email: 'nelya_k+06.02.24@webdevelop.pro', first_name: 'Nelya', last_name: 'Klyusa' },
        verifiable_addresses: [{
          id: '126fb534-805a-4bdb-8abf-12931e770bb7', value: 'nelya_k+06.02.24@webdevelop.pro', verified: false, via: 'email', status: 'sent', created_at: '2024-02-06T17:20:10.792283Z', updated_at: '2024-02-06T17:20:10.792283Z',
        }],
        recovery_addresses: [{
          id: '7f592d5e-335c-4683-b769-fbc866096a15', value: 'nelya_k+06.02.24@webdevelop.pro', via: 'email', created_at: '2024-02-06T17:20:10.793062Z', updated_at: '2024-02-06T17:20:10.793062Z',
        }],
        metadata_public: null,
        created_at: '2024-02-06T17:20:10.791447Z',
        updated_at: '2024-02-06T17:20:10.791447Z',
      },
      devices: [{
        id: '38120afe-5b45-4559-b40c-f8c60e44765e', ip_address: '127.0.0.1:53222', user_agent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:122.0) Gecko/20100101 Firefox/122.0', location: '',
      }],
    },
    identity: {
      id: '5bd2d1f2-e182-4a72-bcfe-2917e55f8565',
      schema_id: 'default',
      schema_url: 'http://local.webdevelop.us:8081/schemas/ZGVmYXVsdA',
      state: 'active',
      state_changed_at: '2024-02-06T17:20:10.789191321Z',
      traits: { email: 'nelya_k+06.02.24@webdevelop.pro', first_name: 'Nelya', last_name: 'Klyusa' },
      verifiable_addresses: [{
        id: '126fb534-805a-4bdb-8abf-12931e770bb7', value: 'nelya_k+06.02.24@webdevelop.pro', verified: false, via: 'email', status: 'sent', created_at: '2024-02-06T17:20:10.792283Z', updated_at: '2024-02-06T17:20:10.792283Z',
      }],
      recovery_addresses: [{
        id: '7f592d5e-335c-4683-b769-fbc866096a15', value: 'nelya_k+06.02.24@webdevelop.pro', via: 'email', created_at: '2024-02-06T17:20:10.793062Z', updated_at: '2024-02-06T17:20:10.793062Z',
      }],
      metadata_public: null,
      created_at: '2024-02-06T17:20:10.791447Z',
      updated_at: '2024-02-06T17:20:10.791447Z',
    },
    continue_with: [{ action: 'show_verification_ui', flow: { id: 'f057cfd2-4b67-493a-b943-581095b4e142', verifiable_address: 'nelya_k+06.02.24@webdevelop.pro', url: 'http://local.webdevelop.us:8080/verification?flow=f057cfd2-4b67-493a-b943-581095b4e142' } }],
  },
));
export const UserIdentity = JSON.parse(JSON.stringify(
  {
    id: 3,
    last_login: '0001-01-01T00:00:00',
    created_at: '2024-02-12T15:12:06.796013+00:00',
    data: {
      reg_cf: {
        net_worth: 300000.0,
        annual_income: 345345.0,
        limitation_rule: true,
        invested_external: 0.0,
        limitation_rule_confirmation: true,
      },
      risk_involved: true,
      accredited_investor: { explanation: '', is_accredited: false },
      resell_difficulties: true,
      educational_materials: true,
      cancelation_restrictions: true,
      no_legal_advices_from_company: true,
    },
    profiles: [{
      id: 3,
      user_id: 3,
      type: 'individual',
      data: {
        dob: '1975-01-18', ssn: '123456789', city: 'Pawnee', phone: '12345678909', state: 'IN', country: 'US', address1: '123 Main St.', address2: 'Suite 15', zip_code: '46001', last_name: 'Knope', first_name: 'Leslie', ip_address: '193.34.172.203', nc_link_id: '1752673', citizenship: 'U.S. Citizen', nc_party_id: 'P2397328',
      },
      kyc_id: 'idv_5LccoqxkiQmpe5',
      kyc_status: 'approved',
      kyc_data: [{ status: 'declined', created_at: '2024-02-14T09:49:52Z', completed_at: '2024-02-14T09:48:02Z' }, { status: 'declined', created_at: '2024-02-14T09:49:52Z', completed_at: '2024-02-14T09:48:02Z' }, { status: 'approved', created_at: '2024-02-14T17:19:59Z', completed_at: '2024-02-14T09:48:02Z' }],
      accreditation_id: null,
      accreditation_status: 'approved',
      accreditation_data: [{
        notes: 'note approved', status: 'approved', created_at: '2024-02-13 11:05:38+00:00', completed_at: '2024-02-13 11:05:38+00:00',
      }, {
        notes: 'dfgdfgdgdfgdg', status: 'new', created_at: '2024-02-14 09:51:34+00:00', completed_at: '-infinity',
      }, {
        status: 'pending', created_at: '2024-02-14 09:52:13+00:00', completed_at: '-infinity', nc_accreditated_status: 'pending',
      }, {
        notes: 'hjmjhmhjmhm', status: 'approved', created_at: '2024-02-14 09:52:33+00:00', completed_at: '2024-02-14 09:52:33+00:00',
      }],
      escrow_id: 'A2832916',
      kyc_at: '2024-02-14T09:48:02+00:00',
      accreditation_at: '2024-02-14T09:52:33+00:00',
      created_at: '2024-02-12T15:12:06.811602+00:00',
      updated_at: '2024-02-22T10:31:45.555247+00:00',
      wallet_id: 151,
      total_investments: 8793.8,
      total_investments_12_months: 8793.8,
      total_distributions: 0.0,
      avarange_annual: 0.0,
    }],
  },
));
export const mockLogin = merge(login, UserIdentity);

export const mockRecovery = {
  id: '81671ea0-d968-48d5-9b0c-86dc6e7bbcbe',
  type: 'browser',
  expires_at: '2024-03-13T08:59:12.229369Z',
  issued_at: '2024-03-13T08:44:12.229369Z',
  request_url: 'http://local.webdevelop.us:8081/self-service/recovery/browser',
  active: 'code',
  ui: {
    action: 'http://local.webdevelop.us:8081/self-service/recovery?flow=81671ea0-d968-48d5-9b0c-86dc6e7bbcbe',
    method: 'POST',
    nodes: [{
      type: 'input',
      group: 'default',
      attributes: {
        name: 'csrf_token', type: 'hidden', value: 'e798qMosxreGkpztBwra90yrZj1TukBTqEAFeYzHiXJ8kBT7nB8bKVINGZR9F5Xpd+4WSip3f/XM1o7A/mav/w==', required: true, disabled: false, node_type: 'input',
      },
      messages: [],
      meta: {},
    }, {
      type: 'input',
      group: 'code',
      attributes: {
        name: 'code', type: 'text', required: true, disabled: false, node_type: 'input',
      },
      messages: [],
      meta: { label: { id: 1070010, text: 'Recovery code', type: 'info' } },
    }, {
      type: 'input',
      group: 'code',
      attributes: {
        name: 'method', type: 'hidden', value: 'code', disabled: false, node_type: 'input',
      },
      messages: [],
      meta: {},
    }, {
      type: 'input',
      group: 'code',
      attributes: {
        name: 'method', type: 'submit', value: 'code', disabled: false, node_type: 'input',
      },
      messages: [],
      meta: { label: { id: 1070005, text: 'Submit', type: 'info' } },
    }, {
      type: 'input',
      group: 'code',
      attributes: {
        name: 'email', type: 'submit', value: 'nelya_k+26.01.24@webdevelop.pro', disabled: false, node_type: 'input',
      },
      messages: [],
      meta: { label: { id: 1070008, text: 'Resend code', type: 'info' } },
    }],
    messages: [{
      id: 1060003, text: 'An email containing a recovery code has been sent to the email address you provided. If you have not received an email, check the spelling of the address and make sure to use the address you registered with.', type: 'info', context: {},
    }],
  },
  state: 'sent_email',
};
