declare module 'InvestCommon/domain/config/env' {
  type MaybeString = string | undefined;

  const env: {
    IS_STATIC_SITE: MaybeString;
    KRATOS_URL: MaybeString;
    PLAID_URL: MaybeString;
    FRONTEND_URL: MaybeString;
    FRONTEND_URL_DASHBOARD: MaybeString;
    FRONTEND_URL_STATIC: MaybeString;
    INVESTMENT_URL: MaybeString;
    OFFER_URL: MaybeString;
    ESIGN_URL: MaybeString;
    USER_URL: MaybeString;
    HELLOSIGN_CLIENT_ID: MaybeString;
    NOTIFICATION_URL: MaybeString;
    HUBSPOTFORM: MaybeString;
    HUBSPOTPORTAL_ID: MaybeString;
    ACCREDITATION_URL: MaybeString;
    PAYMENTS_URL: MaybeString;
    WALLET_URL: MaybeString;
    EVM_URL: MaybeString;
    FILER_URL: MaybeString;
    DISTRIBUTIONS_URL: MaybeString;
    ANALYTIC_URL: MaybeString;
    ENABLE_ANALYTICS: MaybeString;
    HUBSPOT_FORM_ID_RECEIVE_LATEST_NEWS: MaybeString;
    HUBSPOT_FORM_ID_CONTACT_US: MaybeString;
    HUBSPOT_FORM_ID_INVESTMENT_OBJECTIVES: MaybeString;
    HUBSPOT_FORM_ID_PERSONAL_INFORMATION: MaybeString;
    HUBSPOT_FORM_ID_TRUSTED_CONTACT: MaybeString;
    HUBSPOT_FORM_ID_BACKGROUND_INFORMATION: MaybeString;
    HUBSPOT_FORM_ID_RISKS: MaybeString;
    HUBSPOT_FORM_ID_FINANCIAL_SITUATION: MaybeString;
    HUBSPOT_FORM_ID_IDENTIFICATION: MaybeString;
    HUBSPOT_FORM_ID_ENTITY_INFORMATION: MaybeString;
    HUBSPOT_FORM_ID_BUSINESS_CONTROLLER: MaybeString;
    HUBSPOT_FORM_ID_BENEFICIAL_OWNERS: MaybeString;
    HUBSPOT_FORM_ID_TRUST_INFORMATION: MaybeString;
    HUBSPOT_FORM_ID_CUSTODIAN: MaybeString;
    HUBSPOT_FORM_ID_PLAN_INFO: MaybeString;
    HUBSPOT_FORM_ID_ACCOUNT: MaybeString;
    CRYPTO_WALLET_SCAN_URL: MaybeString;
  };

  export default env;
}
