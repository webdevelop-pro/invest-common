
import env from `InvestCommon/global`;

export const urlSignin = `${env.FRONTEND_URL_STATIC}/signin`;
export const urlSignup = `${env.FRONTEND_URL_STATIC}/signup`;
export const urlForgot = `${env.FRONTEND_URL_STATIC}/forgot`;
export const urlCheckEmail = `${env.FRONTEND_URL_STATIC}/check-email`;
export const urlContactUs = `${env.FRONTEND_URL_STATIC}/contact-us`;
export const urlOffers = `${env.FRONTEND_URL_STATIC}/offers`;
export const urlHowItWorks = `${env.FRONTEND_URL_STATIC}/how-it-works`;
export const urlFaq = `${env.FRONTEND_URL_STATIC}/faq`;
export const urlBlog = `${env.FRONTEND_URL_STATIC}/resource-center`;
export const urlTerms = `${env.FRONTEND_URL_STATIC}/terms-of-use`;
export const urlPrivacy = `${env.FRONTEND_URL_STATIC}/privacy-policy`;
export const urlNotifications = `${env.FRONTEND_URL_DASHBOARD}/notifications`;
export const urlSettings = `${env.FRONTEND_URL_DASHBOARD}/settings`;
export const urlProfileAccreditation = (profileId: number) => `${env.FRONTEND_URL_DASHBOARD}/profile/${profileId}/accreditation`;
export const urlInvestmentTimeline = (profileId: number, investId: string) => (
  `${env.FRONTEND_URL_DASHBOARD}/profile/${profileId}/investment/${investId}/timeline`
);
export const urlProfileWallet = (profileId: number) => `${env.FRONTEND_URL_DASHBOARD}/profile/${profileId}/wallet`;
export const urlProfileAccount = (profileId: number) => `${env.FRONTEND_URL_DASHBOARD}/profile/${profileId}/account`;
export const urlProfileKYC = (profileId: number) => `${env.FRONTEND_URL_DASHBOARD}/profile/${profileId}/kyc`;
export const urlProfilePortfolio = (profileId: number) => `${env.FRONTEND_URL_DASHBOARD}/profile/${profileId}/portfolio`;
export const urlOfferSingle = (slug: string) => `${env.FRONTEND_URL_DASHBOARD}/offers/${slug}`;
