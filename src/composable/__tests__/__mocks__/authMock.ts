/* eslint-disable */
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

export const mockedBrowser = JSON.parse(JSON.stringify(
  {'id':'c7fa417a-cfd2-45b1-b858-830c2b074d56','type':'browser','expires_at':'2024-02-06T14:49:56.973794836Z','issued_at':'2024-02-06T14:39:56.973794836Z','request_url':'http://local.webdevelop.us:8081/self-service/login/browser','ui':{'action':'http://local.webdevelop.us:8081/self-service/login?flow=c7fa417a-cfd2-45b1-b858-830c2b074d56','method':'POST','nodes':[{'type':'input','group':'oidc','attributes':{'name':'provider','type':'submit','value':'github','disabled':false,'node_type':'input'},'messages':[],'meta':{'label':{'id':1010002,'text':'Sign in with github','type':'info','context':{'provider':'github'}}}},{'type':'input','group':'oidc','attributes':{'name':'provider','type':'submit','value':'google','disabled':false,'node_type':'input'},'messages':[],'meta':{'label':{'id':1010002,'text':'Sign in with google','type':'info','context':{'provider':'google'}}}},{'type':'input','group':'oidc','attributes':{'name':'provider','type':'submit','value':'linkedin','disabled':false,'node_type':'input'},'messages':[],'meta':{'label':{'id':1010002,'text':'Sign in with linkedin','type':'info','context':{'provider':'linkedin'}}}},{'type':'input','group':'default','attributes':{'name':'csrf_token','type':'hidden','value':'S1oMx6VOW5/ImUSWZxqf5GoSm8x4d07YZdi9/4XCMkWVFTPZ1wWu8mDclwPmxwTylWkUjdRAwYbA/oi9djrGXQ==','required':true,'disabled':false,'node_type':'input'},'messages':[],'meta':{}},{'type':'input','group':'default','attributes':{'name':'identifier','type':'text','value':'','required':true,'disabled':false,'node_type':'input'},'messages':[],'meta':{'label':{'id':1070004,'text':'ID','type':'info'}}},{'type':'input','group':'password','attributes':{'name':'password','type':'password','required':true,'autocomplete':'current-password','disabled':false,'node_type':'input'},'messages':[],'meta':{'label':{'id':1070001,'text':'Password','type':'info'}}},{'type':'input','group':'password','attributes':{'name':'method','type':'submit','value':'password','disabled':false,'node_type':'input'},'messages':[],'meta':{'label':{'id':1010001,'text':'Sign in','type':'info','context':{}}}}]},'created_at':'2024-02-06T14:39:56.978349Z','updated_at':'2024-02-06T14:39:56.978349Z','refresh':false,'requested_aal':'aal1'}
));

export const mockSetLogin = JSON.parse(JSON.stringify(
  {'session':{'id':'d1ac2045-8234-4673-bfce-363ea23eee29','active':true,'expires_at':'2024-02-07T14:39:57.219397204Z','authenticated_at':'2024-02-06T14:39:57.219397204Z','authenticator_assurance_level':'aal1','authentication_methods':[{'method':'password','aal':'aal1','completed_at':'2024-02-06T14:39:57.219392445Z'}],'issued_at':'2024-02-06T14:39:57.219397204Z','identity':{'id':'0f312d81-89b1-4b4e-ab67-caccae95c315','schema_id':'default','schema_url':'http://local.webdevelop.us:8081/schemas/ZGVmYXVsdA','state':'active','state_changed_at':'2024-02-02T12:43:32.746803Z','traits':{'email':'nelya_k+02.02.24@webdevelop.pro','last_name':'Knope','first_name':'Leslie'},'verifiable_addresses':[{'id':'3b6f522f-da60-4ea0-a908-a1351964f84b','value':'nelya_k+02.02.24@webdevelop.pro','verified':false,'via':'email','status':'sent','created_at':'2024-02-02T12:43:32.751286Z','updated_at':'2024-02-02T12:43:32.751286Z'}],'recovery_addresses':[{'id':'e93ccdf3-0641-4368-8717-c08f49703ab4','value':'nelya_k+02.02.24@webdevelop.pro','via':'email','created_at':'2024-02-02T12:43:32.752949Z','updated_at':'2024-02-02T12:43:32.752949Z'}],'metadata_public':null,'created_at':'2024-02-02T12:43:32.748927Z','updated_at':'2024-02-02T12:43:32.748927Z'},'devices':[{'id':'35f54218-1621-437c-ab37-05ef6fcda370','ip_address':'127.0.0.1:39158','user_agent':'Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:122.0) Gecko/20100101 Firefox/122.0','location':''}]}}
));

export const mockAuthError422 = {
  code: 422,
  debug: 'string',
  details: {},
  id: 'string',
  message: 'string',
  reason: 'string',
  redirect_browser_to: 'string',
  request: 'string',
  status: 'string',
}

export const mockLogoutUrl = JSON.parse(JSON.stringify(
  {'logout_url':'http://local.webdevelop.us:8081/self-service/logout?token=ory_lo_E7xTq8RNQArLu6SudCTyrSLGRjPHkVOX','logout_token':'ory_lo_E7xTq8RNQArLu6SudCTyrSLGRjPHkVOX'}
));

export const mockGetSignup = JSON.parse(JSON.stringify(
  {'session':{'id':'d8fa6d91-4c59-4f9b-937d-0d3a347e7507','active':true,'expires_at':'2024-02-07T17:20:10.796207158Z','authenticated_at':'2024-02-06T17:20:11.029110009Z','authenticator_assurance_level':'aal1','authentication_methods':[{'method':'password','aal':'aal1','completed_at':'2024-02-06T17:20:10.796206698Z'}],'issued_at':'2024-02-06T17:20:10.796207158Z','identity':{'id':'5bd2d1f2-e182-4a72-bcfe-2917e55f8565','schema_id':'default','schema_url':'http://local.webdevelop.us:8081/schemas/ZGVmYXVsdA','state':'active','state_changed_at':'2024-02-06T17:20:10.789191321Z','traits':{'email':'nelya_k+06.02.24@webdevelop.pro','first_name':'Nelya','last_name':'Klyusa'},'verifiable_addresses':[{'id':'126fb534-805a-4bdb-8abf-12931e770bb7','value':'nelya_k+06.02.24@webdevelop.pro','verified':false,'via':'email','status':'sent','created_at':'2024-02-06T17:20:10.792283Z','updated_at':'2024-02-06T17:20:10.792283Z'}],'recovery_addresses':[{'id':'7f592d5e-335c-4683-b769-fbc866096a15','value':'nelya_k+06.02.24@webdevelop.pro','via':'email','created_at':'2024-02-06T17:20:10.793062Z','updated_at':'2024-02-06T17:20:10.793062Z'}],'metadata_public':null,'created_at':'2024-02-06T17:20:10.791447Z','updated_at':'2024-02-06T17:20:10.791447Z'},'devices':[{'id':'38120afe-5b45-4559-b40c-f8c60e44765e','ip_address':'127.0.0.1:53222','user_agent':'Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:122.0) Gecko/20100101 Firefox/122.0','location':''}]},'identity':{'id':'5bd2d1f2-e182-4a72-bcfe-2917e55f8565','schema_id':'default','schema_url':'http://local.webdevelop.us:8081/schemas/ZGVmYXVsdA','state':'active','state_changed_at':'2024-02-06T17:20:10.789191321Z','traits':{'email':'nelya_k+06.02.24@webdevelop.pro','first_name':'Nelya','last_name':'Klyusa'},'verifiable_addresses':[{'id':'126fb534-805a-4bdb-8abf-12931e770bb7','value':'nelya_k+06.02.24@webdevelop.pro','verified':false,'via':'email','status':'sent','created_at':'2024-02-06T17:20:10.792283Z','updated_at':'2024-02-06T17:20:10.792283Z'}],'recovery_addresses':[{'id':'7f592d5e-335c-4683-b769-fbc866096a15','value':'nelya_k+06.02.24@webdevelop.pro','via':'email','created_at':'2024-02-06T17:20:10.793062Z','updated_at':'2024-02-06T17:20:10.793062Z'}],'metadata_public':null,'created_at':'2024-02-06T17:20:10.791447Z','updated_at':'2024-02-06T17:20:10.791447Z'},'continue_with':[{'action':'show_verification_ui','flow':{'id':'f057cfd2-4b67-493a-b943-581095b4e142','verifiable_address':'nelya_k+06.02.24@webdevelop.pro','url':'http://local.webdevelop.us:8080/verification?flow=f057cfd2-4b67-493a-b943-581095b4e142'}}]}
));

export const mockSetSignup = JSON.parse(JSON.stringify(
  {'session':{'id':'d8fa6d91-4c59-4f9b-937d-0d3a347e7507','active':true,'expires_at':'2024-02-07T17:20:10.796207158Z','authenticated_at':'2024-02-06T17:20:11.029110009Z','authenticator_assurance_level':'aal1','authentication_methods':[{'method':'password','aal':'aal1','completed_at':'2024-02-06T17:20:10.796206698Z'}],'issued_at':'2024-02-06T17:20:10.796207158Z','identity':{'id':'5bd2d1f2-e182-4a72-bcfe-2917e55f8565','schema_id':'default','schema_url':'http://local.webdevelop.us:8081/schemas/ZGVmYXVsdA','state':'active','state_changed_at':'2024-02-06T17:20:10.789191321Z','traits':{'email':'nelya_k+06.02.24@webdevelop.pro','first_name':'Nelya','last_name':'Klyusa'},'verifiable_addresses':[{'id':'126fb534-805a-4bdb-8abf-12931e770bb7','value':'nelya_k+06.02.24@webdevelop.pro','verified':false,'via':'email','status':'sent','created_at':'2024-02-06T17:20:10.792283Z','updated_at':'2024-02-06T17:20:10.792283Z'}],'recovery_addresses':[{'id':'7f592d5e-335c-4683-b769-fbc866096a15','value':'nelya_k+06.02.24@webdevelop.pro','via':'email','created_at':'2024-02-06T17:20:10.793062Z','updated_at':'2024-02-06T17:20:10.793062Z'}],'metadata_public':null,'created_at':'2024-02-06T17:20:10.791447Z','updated_at':'2024-02-06T17:20:10.791447Z'},'devices':[{'id':'38120afe-5b45-4559-b40c-f8c60e44765e','ip_address':'127.0.0.1:53222','user_agent':'Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:122.0) Gecko/20100101 Firefox/122.0','location':''}]},'identity':{'id':'5bd2d1f2-e182-4a72-bcfe-2917e55f8565','schema_id':'default','schema_url':'http://local.webdevelop.us:8081/schemas/ZGVmYXVsdA','state':'active','state_changed_at':'2024-02-06T17:20:10.789191321Z','traits':{'email':'nelya_k+06.02.24@webdevelop.pro','first_name':'Nelya','last_name':'Klyusa'},'verifiable_addresses':[{'id':'126fb534-805a-4bdb-8abf-12931e770bb7','value':'nelya_k+06.02.24@webdevelop.pro','verified':false,'via':'email','status':'sent','created_at':'2024-02-06T17:20:10.792283Z','updated_at':'2024-02-06T17:20:10.792283Z'}],'recovery_addresses':[{'id':'7f592d5e-335c-4683-b769-fbc866096a15','value':'nelya_k+06.02.24@webdevelop.pro','via':'email','created_at':'2024-02-06T17:20:10.793062Z','updated_at':'2024-02-06T17:20:10.793062Z'}],'metadata_public':null,'created_at':'2024-02-06T17:20:10.791447Z','updated_at':'2024-02-06T17:20:10.791447Z'},'continue_with':[{'action':'show_verification_ui','flow':{'id':'f057cfd2-4b67-493a-b943-581095b4e142','verifiable_address':'nelya_k+06.02.24@webdevelop.pro','url':'http://local.webdevelop.us:8080/verification?flow=f057cfd2-4b67-493a-b943-581095b4e142'}}]}
));

export const mockRecovery = JSON.parse(JSON.stringify({
  'active': 'string',
  'continue_with': [
    {
      'action': 'show_verification_ui',
      'flow': {
        'id': '497f6eca-6276-4993-bfeb-53cbbbba6f08',
        'url': 'string',
        'verifiable_address': 'string',
      },
    },
  ],
  'expires_at': '2019-08-24T14:15:22Z',
  'id': '497f6eca-6276-4993-bfeb-53cbbbba6f08',
  'issued_at': '2019-08-24T14:15:22Z',
  'request_url': 'string',
  'return_to': 'string',
  'state': null,
  'type': 'string',
  'ui': {
    'action': 'string',
    'messages': [
      {
        'context': {},
        'id': 0,
        'text': 'string',
        'type': 'info',
      },
    ],
    'method': 'string',
    'nodes': [
      {
        'attributes': {
          'autocomplete': 'email',
          'disabled': true,
          'label': {
            'context': {},
            'id': 0,
            'text': 'string',
            'type': 'info',
          },
          'name': 'string',
          'node_type': 'string',
          'onclick': 'string',
          'pattern': 'string',
          'required': true,
          'type': 'text',
          'value': null,
        },
        'group': 'default',
        'messages': [
          {
            'context': {},
            'id': 0,
            'text': 'string',
            'type': 'info',
          },
        ],
        'meta': {
          'label': {
            'context': {},
            'id': 0,
            'text': 'string',
            'type': 'info',
          },
        },
        'type': 'text',
      },
    ],
  },
}));

export const mockVerification = JSON.parse(JSON.stringify({
  'active': 'string',
  'continue_with': [
    {
      'action': 'show_verification_ui',
      'flow': {
        'id': '497f6eca-6276-4993-bfeb-53cbbbba6f08',
        'url': 'string',
        'verifiable_address': 'string',
      },
    },
  ],
  'expires_at': '2019-08-24T14:15:22Z',
  'id': '497f6eca-6276-4993-bfeb-53cbbbba6f08',
  'issued_at': '2019-08-24T14:15:22Z',
  'request_url': 'string',
  'return_to': 'string',
  'state': null,
  'type': 'string',
  'ui': {
    'action': 'string',
    'messages': [
      {
        'context': {},
        'id': 0,
        'text': 'string',
        'type': 'info',
      },
    ],
    'method': 'string',
    'nodes': [
      {
        'attributes': {
          'autocomplete': 'email',
          'disabled': true,
          'label': {
            'context': {},
            'id': 0,
            'text': 'string',
            'type': 'info',
          },
          'name': 'string',
          'node_type': 'string',
          'onclick': 'string',
          'pattern': 'string',
          'required': true,
          'type': 'text',
          'value': null,
        },
        'group': 'default',
        'messages': [
          {
            'context': {},
            'id': 0,
            'text': 'string',
            'type': 'info',
          },
        ],
        'meta': {
          'label': {
            'context': {},
            'id': 0,
            'text': 'string',
            'type': 'info',
          },
        },
        'type': 'text',
      },
    ],
  },
}));

export const mockSetPassword = JSON.parse(JSON.stringify({
  'active': 'string',
  'continue_with': [
    {
      'action': 'show_verification_ui',
      'flow': {
        'id': '497f6eca-6276-4993-bfeb-53cbbbba6f08',
        'url': 'string',
        'verifiable_address': 'string',
      },
    },
  ],
  'expires_at': '2019-08-24T14:15:22Z',
  'id': '497f6eca-6276-4993-bfeb-53cbbbba6f08',
  'issued_at': '2019-08-24T14:15:22Z',
  'request_url': 'string',
  'return_to': 'string',
  'state': null,
  'type': 'string',
  'ui': {
    'action': 'string',
    'messages': [
      {
        'context': {},
        'id': 0,
        'text': 'string',
        'type': 'info',
      },
    ],
    'method': 'string',
    'nodes': [
      {
        'attributes': {
          'autocomplete': 'email',
          'disabled': true,
          'label': {
            'context': {},
            'id': 0,
            'text': 'string',
            'type': 'info'
          },
          'name': 'string',
          'node_type': 'string',
          'onclick': 'string',
          'pattern': 'string',
          'required': true,
          'type': 'text',
          'value': null,
        },
        'group': 'default',
        'messages': [
          {
            'context': {},
            'id': 0,
            'text': 'string',
            'type': 'info',
          },
        ],
        'meta': {
          'label': {
            'context': {},
            'id': 0,
            'text': 'string',
            'type': 'info',
          },
        },
        'type': 'text',
      },
    ],
  },
}));
/* eslint-enable */
