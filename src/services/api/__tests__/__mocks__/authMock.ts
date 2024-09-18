export const mockedLoggedInSession = {
  id: '4c40da5b-b426-403f-8dc5-d822191054b1',
  active: true,
  expires_at: '2023-08-08T11:06:33.084289Z',
  authenticated_at: '2023-08-07T11:06:33.084289Z',
  authenticator_assurance_level: 'aal1',
  authentication_methods: [
    {
      method: 'password',
      aal: 'aal1',
      completed_at: '2023-08-07T11:06:33.084287649Z',
    },
  ],
  issued_at: '2023-08-07T11:06:33.084289Z',
  identity: {
    id: 'b1093828-72ee-4088-8056-6f322d25d0b3',
    schema_id: 'default',
    schema_url: 'http://local.webdevelop.us:8081/kratos/schemas/ZGVmYXVsdA',
    state: 'active',
    state_changed_at: '2023-06-02T15:11:32.756882Z',
    traits: {
      email: 'nikolay_k+0206202302@webdevelop.pro',
      last_name: 'Last',
      first_name: 'First',
    },
    verifiable_addresses: [
      {
        id: '196ea2fe-4983-4166-874b-1c52a6f74431',
        value: 'nikolay_k+0206202302@webdevelop.pro',
        verified: false,
        via: 'email',
        status: 'sent',
        created_at: '2023-06-02T15:11:32.759198Z',
        updated_at: '2023-06-02T15:11:32.759198Z',
      },
    ],
    recovery_addresses: [
      {
        id: 'b6373a96-61d9-4cbf-9f9a-5a44ea6b76b6',
        value: 'nikolay_k+0206202302@webdevelop.pro',
        via: 'email',
        created_at: '2023-06-02T15:11:32.759872Z',
        updated_at: '2023-06-02T15:11:32.759872Z',
      },
    ],
    metadata_public: null,
    created_at: '2023-06-02T15:11:32.758318Z',
    updated_at: '2023-06-02T15:11:32.758318Z',
  },
  devices: [
    {
      id: 'a766a003-4c24-4b38-95fb-4adc16cdac18',
      ip_address: '10.244.0.1:45850',
      user_agent: 'Mozilla/5.0 (X11; Linux x86_64; rv:91.0) Gecko/20100101 Firefox/91.0',
      location: '',
    },
  ],
};

export const mockedLoggedOutSession = {
  error: {
    code: 401,
    status: 'Unauthorized',
    reason: 'No valid session credentials found in the request.',
    message: 'The request could not be authorized',
  },
};

export const mockSchema = [{
  id: 'default',
  schema: {
    $id: 'https://schemas.ory.sh/presets/kratos/quickstart/email-password/identity.schema.json',
    $schema: 'http://json-schema.org/draft-07/schema#',
    title: 'Person',
    type: 'object',
    properties: {
      traits: {
        type: 'object',
        properties: {
          email: {
            type: 'string', format: 'email', title: 'E-Mail', minLength: 4, 'ory.sh/kratos': { credentials: { password: { identifier: true } }, verification: { via: 'email' }, recovery: { via: 'email' } },
          },
          first_name: { type: 'string', title: 'First Name', minLength: 2 },
          last_name: { type: 'string', title: 'Last Name', minLength: 2 },
          phone: { type: 'string', title: 'Phone', minLength: 2 },
          country: { type: 'string', title: 'Country', minLength: 2 },
          state: { type: 'string', title: 'State', minLength: 2 },
          city: { type: 'string', title: 'City', minLength: 2 },
          address: { type: 'string', title: 'Address', minLength: 2 },
          address2: { type: 'string', title: 'Apt' },
          zip: { type: 'string', title: 'Zip Code', minLength: 2 },
        },
        required: ['email'],
        additionalProperties: false,
      },
    },
  },
}];
