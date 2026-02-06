export const ROUTE_HOME = 'ROUTE_HOME';

export const ROUTE_ERROR_404 = 'ROUTE_ERROR_404';
export const ROUTE_ERROR_500 = 'ROUTE_ERROR_500';
export const ROUTE_RESET_PASSWORD = 'ROUTE_RESET_PASSWORD';

export const ROUTE_DASHBOARD_PORTFOLIO = 'ROUTE_DASHBOARD_PORTFOLIO';
export const ROUTE_DASHBOARD_ACCOUNT = 'ROUTE_DASHBOARD_ACCOUNT';
export const ROUTE_DASHBOARD_WALLET = 'ROUTE_DASHBOARD_WALLET';
export const ROUTE_DASHBOARD_EVMWALLET = 'ROUTE_DASHBOARD_EVMWALLET';
export const ROUTE_DASHBOARD_PERSONAL_DETAILS = 'ROUTE_DASHBOARD_PERSONAL_DETAILS';
export const ROUTE_DASHBOARD_BACKGROUND_INFORMATION = 'ROUTE_DASHBOARD_BACKGROUND_INFORMATION';
export const ROUTE_DASHBOARD_TRUSTED_CONTACT = 'ROUTE_DASHBOARD_TRUSTED_CONTACT';
export const ROUTE_DASHBOARD_ENTITY_INFORMATION = 'ROUTE_DASHBOARD_ENTITY_INFORMATION';
export const ROUTE_DASHBOARD_BUSINESS_CONTROLLER = 'ROUTE_DASHBOARD_BUSINESS_CONTROLLER';
export const ROUTE_DASHBOARD_CUSTODIAN_INFO = 'ROUTE_DASHBOARD_CUSTODIAN_INFO';
export const ROUTE_DASHBOARD_PLAN_INFO = 'ROUTE_DASHBOARD_PLAN_INFO';
export const ROUTE_DASHBOARD_TRUST_INFORMATION = 'ROUTE_DASHBOARD_TRUST_INFORMATION';

export const ROUTE_DASHBOARD_FINANCIAL_AND_INVESTMENT_INFO = 'ROUTE_DASHBOARD_FINANCIAL_AND_INVESTMENT_INFO';
export const ROUTE_DASHBOARD_DISTRIBUTIONS = 'ROUTE_DASHBOARD_DISTRIBUTIONS';
export const ROUTE_DASHBOARD_SUMMARY = 'ROUTE_DASHBOARD_SUMMARY';
export const ROUTE_DASHBOARD_EARN = 'ROUTE_DASHBOARD_EARN';
export const ROUTE_EARN_OVERVIEW = 'ROUTE_EARN_OVERVIEW';
export const ROUTE_EARN_YOUR_POSITION = 'ROUTE_EARN_YOUR_POSITION';
export const ROUTE_EARN_RISK = 'ROUTE_EARN_RISK';

export const ROUTE_NOTIFICATIONS = 'ROUTE_NOTIFICATIONS';

export const ROUTE_OFFERS = 'ROUTE_OFFERS';
export const ROUTE_OFFERS_DETAILS = 'ROUTE_OFFERS_DETAILS';

export const ROUTE_INVEST_AMOUNT = 'ROUTE_INVEST_AMOUNT';
export const ROUTE_INVEST_OWNERSHIP = 'ROUTE_INVEST_OWNERSHIP';
export const ROUTE_INVEST_SIGNATURE = 'ROUTE_INVEST_SIGNATURE';
export const ROUTE_INVEST_FUNDING = 'ROUTE_INVEST_FUNDING';
export const ROUTE_INVEST_REVIEW = 'ROUTE_INVEST_REVIEW';
export const ROUTE_INVEST_THANK = 'ROUTE_INVEST_THANK';

export const ROUTE_INVESTMENT_DOCUMENTS = 'ROUTE_INVESTMENT_DOCUMENTS';
export const ROUTE_INVESTMENT_TIMELINE = 'ROUTE_INVESTMENT_TIMELINE';

export const ROUTE_STATIC_FAQ = 'ROUTE_STATIC_FAQ';
export const ROUTE_STATIC_HOWITWORKS = 'ROUTE_STATIC_HOWITWORKS';
export const ROUTE_STATIC_PRIVACY_POLICY = 'ROUTE_STATIC_PRIVACY_POLICY';
export const ROUTE_STATIC_TERMS_OF_USE = 'ROUTE_STATIC_TERMS_OF_USE';
export const ROUTE_STATIC_BCP_DISCLOSURE_STATEMENT = 'ROUTE_STATIC_BCP_DISCLOSURE_STATEMENT';
export const ROUTE_STATIC_LISTING_DISCLOSURE = 'ROUTE_STATIC_LISTING_DISCLOSURE';

export const ROUTE_LOGIN = 'ROUTE_LOGIN';
export const ROUTE_SIGNUP = 'ROUTE_SIGNUP';
export const ROUTE_SUBMIT_KYC = 'ROUTE_SUBMIT_KYC';
export const ROUTE_CREATE_PROFILE = 'ROUTE_CREATE_PROFILE';
export const ROUTE_FORGOT = 'ROUTE_FORGOT';
export const ROUTE_CHECK_EMAIL = 'ROUTE_CHECK_EMAIL';

export const ROUTE_SETTINGS_MFA = 'ROUTE_SETTINGS_MFA';
export const ROUTE_SETTINGS_SECURITY = 'ROUTE_SETTINGS_SECURITY';
export const ROUTE_SETTINGS_ACCOUNT_DETAILS = 'ROUTE_SETTINGS_ACCOUNT_DETAILS';
export const ROUTE_SETTINGS_BANK_ACCOUNTS = 'ROUTE_SETTINGS_BANK_ACCOUNTS';

export const ROUTE_ACCREDITATION_UPLOAD = 'ROUTE_ACCREDITATION_UPLOAD';

export const ROUTE_RESOURCE_CENTER = 'ROUTE_RESOURCE_CENTER';
export const ROUTE_RESOURCE_CENTER_POST = 'ROUTE_RESOURCE_CENTER_POST';

export const ROUTE_CONTACT_US = 'ROUTE_CONTACT_US';

export const DEFAULT_PAGE_TITLE = 'Invest PRO';
export const DEFAULT_DESCRIPTION = 'Invest PRO';

export const PAGE_TITLES = {
  [ROUTE_HOME]: `Home | ${DEFAULT_PAGE_TITLE}`,

  [ROUTE_INVEST_AMOUNT]: `Investment amount | ${DEFAULT_PAGE_TITLE}`,
  [ROUTE_INVEST_OWNERSHIP]: `Investment ownership | ${DEFAULT_PAGE_TITLE}`,
  [ROUTE_INVEST_SIGNATURE]: `Investment signature | ${DEFAULT_PAGE_TITLE}`,
  [ROUTE_INVEST_FUNDING]: `Investment funding | ${DEFAULT_PAGE_TITLE}`,
  [ROUTE_INVEST_REVIEW]: `Investment review | ${DEFAULT_PAGE_TITLE}`,
  [ROUTE_INVEST_THANK]: `Thank you for your investment | ${DEFAULT_PAGE_TITLE}`,

  [ROUTE_SUBMIT_KYC]: `KYC | ${DEFAULT_PAGE_TITLE}`,
  [ROUTE_CREATE_PROFILE]: `Create profile | ${DEFAULT_PAGE_TITLE}`,

  [ROUTE_ACCREDITATION_UPLOAD]: `Accreditation upload | ${DEFAULT_PAGE_TITLE}`,

  [ROUTE_OFFERS]: `Explore Companies | ${DEFAULT_PAGE_TITLE}`,

  [ROUTE_RESOURCE_CENTER]: `Resource center | ${DEFAULT_PAGE_TITLE}`,

  [ROUTE_STATIC_FAQ]: `FAQ | ${DEFAULT_PAGE_TITLE}`,
  [ROUTE_STATIC_HOWITWORKS]: `How it works | ${DEFAULT_PAGE_TITLE}`,
  [ROUTE_STATIC_PRIVACY_POLICY]: `Privacy policy | ${DEFAULT_PAGE_TITLE}`,
  [ROUTE_STATIC_TERMS_OF_USE]: `Terms of use | ${DEFAULT_PAGE_TITLE}`,
  [ROUTE_STATIC_BCP_DISCLOSURE_STATEMENT]: `Bcp disclosure statement | ${DEFAULT_PAGE_TITLE}`,
  [ROUTE_STATIC_LISTING_DISCLOSURE]: `Listing disclosure  | ${DEFAULT_PAGE_TITLE}`,

  [ROUTE_LOGIN]: `Login | ${DEFAULT_PAGE_TITLE}`,
  [ROUTE_SIGNUP]: `Signup | ${DEFAULT_PAGE_TITLE}`,
  [ROUTE_FORGOT]: `Recovery | ${DEFAULT_PAGE_TITLE}`,
  [ROUTE_CHECK_EMAIL]: `Check Your Email | ${DEFAULT_PAGE_TITLE}`,

  [ROUTE_SETTINGS_MFA]: `Settings MFA | ${DEFAULT_PAGE_TITLE}`,
  [ROUTE_SETTINGS_SECURITY]: `Settings Security | ${DEFAULT_PAGE_TITLE}`,
  [ROUTE_SETTINGS_ACCOUNT_DETAILS]: `Settings Account Details | ${DEFAULT_PAGE_TITLE}`,
  [ROUTE_SETTINGS_BANK_ACCOUNTS]: `Settings Bank Accounts | ${DEFAULT_PAGE_TITLE}`,

  [ROUTE_DASHBOARD_PORTFOLIO]: `Portfolio | ${DEFAULT_PAGE_TITLE}`,
  [ROUTE_DASHBOARD_ACCOUNT]: `Account details | ${DEFAULT_PAGE_TITLE}`,
  [ROUTE_DASHBOARD_DISTRIBUTIONS]: `Distributions | ${DEFAULT_PAGE_TITLE}`,
  [ROUTE_DASHBOARD_WALLET]: `Funding | ${DEFAULT_PAGE_TITLE}`,
  [ROUTE_DASHBOARD_EVMWALLET]: `Crypto Funding | ${DEFAULT_PAGE_TITLE}`,
  [ROUTE_DASHBOARD_PERSONAL_DETAILS]: `Personal Details | ${DEFAULT_PAGE_TITLE}`,
  [ROUTE_DASHBOARD_BACKGROUND_INFORMATION]: `Background Information | ${DEFAULT_PAGE_TITLE}`,
  [ROUTE_DASHBOARD_TRUSTED_CONTACT]: `Trusted Contact | ${DEFAULT_PAGE_TITLE}`,
  [ROUTE_DASHBOARD_ENTITY_INFORMATION]: `Entity information | ${DEFAULT_PAGE_TITLE}`,
  [ROUTE_DASHBOARD_CUSTODIAN_INFO]: `Custodian information | ${DEFAULT_PAGE_TITLE}`,
  [ROUTE_DASHBOARD_PLAN_INFO]: `Plan information | ${DEFAULT_PAGE_TITLE}`,
  [ROUTE_DASHBOARD_TRUST_INFORMATION]: `Trust information | ${DEFAULT_PAGE_TITLE}`,
  [ROUTE_DASHBOARD_BUSINESS_CONTROLLER]: `Business Controller | ${DEFAULT_PAGE_TITLE}`,
  [ROUTE_DASHBOARD_FINANCIAL_AND_INVESTMENT_INFO]: `Financial and Investment Information | ${DEFAULT_PAGE_TITLE}`,
  [ROUTE_DASHBOARD_SUMMARY]: `Summary | ${DEFAULT_PAGE_TITLE}`,
  [ROUTE_DASHBOARD_EARN]: `Earn | ${DEFAULT_PAGE_TITLE}`,
  [ROUTE_EARN_OVERVIEW]: `Earn Overview | ${DEFAULT_PAGE_TITLE}`,
  [ROUTE_EARN_YOUR_POSITION]: `Your Position | ${DEFAULT_PAGE_TITLE}`,
  [ROUTE_EARN_RISK]: `Risk | ${DEFAULT_PAGE_TITLE}`,

  [ROUTE_INVESTMENT_DOCUMENTS]: `Investment Documents | ${DEFAULT_PAGE_TITLE}`,
  [ROUTE_INVESTMENT_TIMELINE]: `Investment Timeline | ${DEFAULT_PAGE_TITLE}`,

  [ROUTE_CONTACT_US]: `Contact Us | ${DEFAULT_PAGE_TITLE}`,
  [ROUTE_NOTIFICATIONS]: `Notifications | ${DEFAULT_PAGE_TITLE}`,

  [ROUTE_ERROR_404]: `Page not found | ${DEFAULT_PAGE_TITLE}`,
  [ROUTE_ERROR_500]: `Server error | ${DEFAULT_PAGE_TITLE}`,
  [ROUTE_RESET_PASSWORD]: `Reset Password | ${DEFAULT_PAGE_TITLE}`,
};

export const PAGE_DESCRIPTIONS = {
  [ROUTE_HOME]: 'Access vetted investment opportunities in startups, real estate, VR, and crypto.',

  [ROUTE_INVEST_AMOUNT]: 'Enter the number of shares to calculate returns. Assess value and optimize your portfolio today!',
  [ROUTE_INVEST_OWNERSHIP]: 'Specify ownership details to manage your investments. Align your portfolio with your financial goals!',
  [ROUTE_INVEST_SIGNATURE]: 'Complete the signature step to secure your investments. Ensure transaction authenticity and security!',
  [ROUTE_INVEST_FUNDING]: 'Activate your investment by funding. Choose payment method, transfer funds securely, and start growing!',
  [ROUTE_INVEST_REVIEW]: 'Review and verify your investment details. Confirm choices for accurate and informed portfolio setup.',
  [ROUTE_INVEST_THANK]: 'Thank you for investing with us! Your commitment brings you closer to your financial goals. We appreciate your trust and partnership."',

  [ROUTE_SUBMIT_KYC]: 'Complete your KYC form to verify your identity. Ensure compliance and unlock access to a world of investment opportunities. Begin your journey securely!',

  [ROUTE_CREATE_PROFILE]: 'Set up your investment profile',

  [ROUTE_ACCREDITATION_UPLOAD]: 'Upload your accreditation documents securely. Gain access to exclusive investment opportunities. Start elevating your portfolio today!',

  [ROUTE_OFFERS]: 'Explore our diverse investment offers. From stocks to real estate, discover opportunities tailored to your financial goals.',

  [ROUTE_RESOURCE_CENTER]: 'Browse our curated articles. Gain insights, tips, and strategies to empower your investment decisions.',

  [ROUTE_STATIC_FAQ]: 'Find answers to common questions. Streamline your investment journey with our comprehensive FAQ section.',
  [ROUTE_STATIC_HOWITWORKS]: 'Discover how our platform works. Learn about our seamless investment process and get started today.',
  [ROUTE_STATIC_PRIVACY_POLICY]: 'Review our privacy policy. Understand how we protect your data and ensure confidentiality in your investments.',
  [ROUTE_STATIC_TERMS_OF_USE]: 'Explore our terms of use. Understand the guidelines for using our platform and accessing investment opportunities.',
  [ROUTE_STATIC_BCP_DISCLOSURE_STATEMENT]: 'Read our BCP disclosure statement. Learn about our business continuity plan and how we safeguard your investments.',
  [ROUTE_STATIC_LISTING_DISCLOSURE]: 'View our listing disclosure. Gain transparency on our listed investments and their potential for your portfolio.',

  [ROUTE_LOGIN]: 'Access your account. Login securely to manage your investments and explore new opportunities.',
  [ROUTE_SIGNUP]: 'Join us today. Sign up to start your investment journey and unlock exclusive opportunities.',
  [ROUTE_FORGOT]: 'Recover your account. Regain access to your investments securely with our recovery process.',
  [ROUTE_SETTINGS_MFA]: 'Manage your preferences. Customize your investment experience with our settings options.',
  [ROUTE_SETTINGS_SECURITY]: 'Manage your preferences. Customize your investment experience with our settings options.',
  [ROUTE_SETTINGS_ACCOUNT_DETAILS]: 'Manage your preferences. Customize your investment experience with our settings options.',
  [ROUTE_SETTINGS_BANK_ACCOUNTS]: 'Manage your connected bank accounts used for funding.',
  [ROUTE_CHECK_EMAIL]: 'Check your email. Confirm your identity and stay updated on investment opportunities.',

  [ROUTE_DASHBOARD_PORTFOLIO]: 'Track your investments. Monitor your portfolio performance and make informed decisions.',
  [ROUTE_DASHBOARD_ACCOUNT]: 'View your account details. Access information about your investments and account settings.',
  [ROUTE_DASHBOARD_DISTRIBUTIONS]: 'Track your distributions. Control your funds.',
  [ROUTE_DASHBOARD_WALLET]: 'Manage your wallet. Control your funds and transactions securely.',
  [ROUTE_DASHBOARD_EVMWALLET]: 'Manage your crypto wallet. Control your funds and transactions securely.',
  [ROUTE_DASHBOARD_SUMMARY]: 'View your account summary and key metrics in one place.',
  [ROUTE_DASHBOARD_PERSONAL_DETAILS]: 'Update personal info. Keep your profile current for seamless transactions.',
  [ROUTE_DASHBOARD_BACKGROUND_INFORMATION]: 'Complete background info. Provide necessary details for investment compliance.',
  [ROUTE_DASHBOARD_TRUSTED_CONTACT]: 'Add trusted contact. Designate someone to assist with account matters.',
  [ROUTE_DASHBOARD_ENTITY_INFORMATION]: 'Manage entity information',
  [ROUTE_DASHBOARD_TRUST_INFORMATION]: 'Manage trust information',
  [ROUTE_DASHBOARD_CUSTODIAN_INFO]: 'Manage custodian information',
  [ROUTE_DASHBOARD_PLAN_INFO]: 'Manage plan information',
  [ROUTE_DASHBOARD_BUSINESS_CONTROLLER]: 'Manage business controller',
  [ROUTE_DASHBOARD_FINANCIAL_AND_INVESTMENT_INFO]: 'Submit financial data. Share investment details for tailored recommendations.',
  [ROUTE_DASHBOARD_EARN]: 'Discover earning opportunities. Explore ways to grow your wealth and maximize returns.',
  [ROUTE_EARN_OVERVIEW]: 'Overview of this earning opportunity. Explore APY, TVL, and other key metrics.',
  [ROUTE_EARN_YOUR_POSITION]: 'View your position in this earning opportunity. Track your staked amount and earnings.',

  [ROUTE_INVESTMENT_DOCUMENTS]: 'Investment document checklist. Ensure all required documents are submitted for your investment.',
  [ROUTE_INVESTMENT_TIMELINE]: 'Track investment progress. Monitor milestones and projected growth over time.',

  [ROUTE_CONTACT_US]: 'Reach out to us. Connect with our team for assistance and inquiries.',
  [ROUTE_NOTIFICATIONS]: 'Stay informed. Receive updates and alerts about your investments.',

  [ROUTE_ERROR_404]: 'Oops! Page not found. Let\'s get you back on track.',
  [ROUTE_ERROR_500]: 'We\'re experiencing issues. Please try again shortly.',
  [ROUTE_RESET_PASSWORD]: 'Reset your password',
};
