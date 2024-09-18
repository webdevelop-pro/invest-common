import {
  beforeEach, expect, vi, describe, it,
} from 'vitest';
import { createPinia, setActivePinia } from 'pinia';
import createFetchMock, { ErrorOrFunction } from 'vitest-fetch-mock';
import { useAuthStore } from 'InvestCommon/store';
import {
  mockAuthError422, mockGetSignup, mockLogoutUrl, mockRecovery, mockSetLogin,
  mockSetPassword, mockSetSignup, mockVerification, mockedBrowser, mockedLoggedInSession,
} from './__mocks__/authMock';
import env from 'InvestCommon/global';
import {
  IGetAuthFlow, IGetLogoutURL, IGetSettingsOk, IGetSignup, IRecovery, ISetLoginOk, ISetSignUpOK,
} from 'InvestCommon/types/api/auth';
import { SELFSERVICE } from 'InvestCommon/helpers/enums/auth';

const { KRATOS_URL, FRONTEND_URL } = env;

const fetchMocker = createFetchMock(vi);
fetchMocker.enableMocks();

describe('useAuth fetch functions', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    fetchMocker.resetMocks();
  });

  it('getSession should fetch session data successfully', async () => {
    // Arrange
    const authStore = useAuthStore();

    fetchMocker.mockResponse(JSON.stringify(mockedLoggedInSession));

    // Act
    await authStore.getSession();

    expect(fetchMocker.requests()[0].url).toEqual(`${KRATOS_URL}/sessions/whoami`);

    expect(authStore.getSessionData).toEqual(mockedLoggedInSession);
  });

  it('getSession should handle error during session data fetch', async () => {
    // Arrange
    const authStore = useAuthStore();

    // Mock error response
    fetchMocker.mockReject(new Error('Fetch error'));

    // Act
    await authStore.getSession();

    // Assert
    expect(authStore.isGetSessionLoading).toBe(false);
    expect(authStore.isGetSessionError).toBe(true);
    expect(authStore.getSessionData).toBeUndefined();
  });

  it('getAllSession should fetch all session data successfully', async () => {
    // Arrange
    const authStore = useAuthStore();

    // Mock response data for getAllSession
    // eslint-disable-next-line
    const mockedAllSessionData: any[] = [];

    fetchMocker.mockResponse(JSON.stringify(mockedAllSessionData));

    // Act
    await authStore.getAllSession();

    expect(fetchMocker.requests()[0].url).toEqual(`${KRATOS_URL}/sessions`);

    expect(authStore.getAllSessionData).toEqual(mockedAllSessionData);
  });

  it('getAllSession should handle error during all session data fetch', async () => {
    // Arrange
    const authStore = useAuthStore();

    // Mock error response
    fetchMocker.mockReject(new Error('Fetch error'));

    // Act
    await authStore.getAllSession();

    // Assert
    expect(authStore.isGetAllSessionLoading).toBe(false);
    expect(authStore.isGetAllSessionError).toBe(true);
    expect(authStore.getAllSessionData).toBeUndefined();
  });

  it('fetchAuthHandler should fetch authentication flow data successfully', async () => {
    // Arrange
    const authStore = useAuthStore();

    // Mock response data for fetchAuthHandler
    const mockedAuthFlowData: IGetAuthFlow = mockedBrowser;

    fetchMocker.mockResponse(JSON.stringify(mockedAuthFlowData));

    // Act
    await authStore.fetchAuthHandler(SELFSERVICE.login);

    expect(fetchMocker.requests()[0].url).toEqual(`${KRATOS_URL}/${SELFSERVICE.login}`);

    expect(authStore.isGetFlowLoading).toBe(false);
    expect(authStore.isGetFlowError).toBe(false);
    expect(authStore.getFlowData).toEqual(mockedAuthFlowData);
  });

  it('fetchAuthHandler should handle error during authentication flow data fetch', async () => {
    // Arrange
    const authStore = useAuthStore();

    // Mock error response
    fetchMocker.mockReject(new Error('Fetch error'));

    // Act
    await authStore.fetchAuthHandler(SELFSERVICE.login);

    // Assert
    expect(authStore.isGetFlowLoading).toBe(false);
    expect(authStore.isGetFlowError).toBe(true);
    expect(authStore.getFlowData).toBeUndefined();
  });

  it('setLogin should set login data successfully', async () => {
    // Arrange
    const authStore = useAuthStore();

    // Mock response data for setLogin
    const mockedSetLoginData: ISetLoginOk = mockSetLogin;

    fetchMocker.mockResponse(JSON.stringify(mockedSetLoginData));

    // Act
    await authStore.setLogin('flowId123', 'password123', 'email@example.com', 'csrf_token123');

    expect(fetchMocker.requests()[0].url).toEqual(`${KRATOS_URL}/self-service/login?flow=flowId123`);

    expect(authStore.isSetLoginLoading).toBe(false);
    expect(authStore.isSetLoginError).toBe(false);
    expect(authStore.setLoginData).toEqual(mockedSetLoginData);
  });

  it('setLogin should handle error during set login data', async () => {
    // Arrange
    const authStore = useAuthStore();

    // Mock error response
    fetchMocker.mockReject({
      status: 500,
      json: async () => {},
    } as unknown as ErrorOrFunction);

    // Act
    await authStore.setLogin('flowId123', 'password123', 'email@example.com', 'csrf_token123');

    // Assert
    expect(authStore.isSetLoginLoading).toBe(false);
    expect(authStore.isSetLoginError).toBe(true);
    expect(authStore.setLoginData).toBeUndefined();
  });

  it('setSocialLogin should set social login data successfully', async () => {
    // Arrange
    const authStore = useAuthStore();

    // Mock response data for setSocialLogin
    const mockedSetSocialLoginData: unknown = mockSetLogin;

    fetchMocker.mockResponse(JSON.stringify(mockedSetSocialLoginData));

    // Act
    await authStore.setSocialLogin('flowId123', 'github', 'csrf_token123');

    expect(fetchMocker.requests()[0].url).toEqual(`${KRATOS_URL}/self-service/login?flow=flowId123&return_to=${FRONTEND_URL}`);

    expect(authStore.isSetSocialLoginLoading).toBe(false);
    expect(authStore.isSetSocialLoginError).toBe(false);
    expect(authStore.setSocialLoginData).toEqual(mockedSetSocialLoginData);
    expect(authStore.setSocialLoginDataError).toBeUndefined();
  });

  it('setSocialLogin should handle error during set social login data with 422 status', async () => {
    // Arrange
    const authStore = useAuthStore();

    // Mock 422 error response
    fetchMocker.mockReject({
      status: 422,
      json: () => mockAuthError422,
    } as unknown as ErrorOrFunction);

    // Act
    await authStore.setSocialLogin('flowId123', 'github', 'csrf_token123');

    // Assert
    expect(authStore.isSetSocialLoginLoading).toBe(false);
    expect(authStore.isSetSocialLoginError).toBe(false);
    expect(authStore.setSocialLoginData).toBeUndefined();

    // Check if 422 error data is correctly handled
    expect(authStore.setSocialLoginDataError).toEqual(mockAuthError422);
  });

  it('setSocialLogin should handle general error during set social login data', async () => {
    // Arrange
    const authStore = useAuthStore();

    // Mock general error response
    fetchMocker.mockReject({
      status: 500,
      json: async () => {},
    } as unknown as ErrorOrFunction);

    // Act
    await authStore.setSocialLogin('flowId123', 'github', 'csrf_token123');

    // Assert
    expect(authStore.isSetSocialLoginLoading).toBe(false);
    expect(authStore.isSetSocialLoginError).toBe(true);
    expect(authStore.setSocialLoginData).toBeUndefined();
    expect(authStore.setSocialLoginDataError).toBeUndefined();
  });

  it('getLogout should fetch logout data successfully', async () => {
    // Arrange
    const authStore = useAuthStore();

    // Mock response data for getLogout
    const mockedgetLogoutData = {};

    fetchMocker.mockResponse(JSON.stringify(mockedgetLogoutData));

    // Act
    await authStore.getLogout('someToken123');

    expect(fetchMocker.requests()[0].url).toEqual(`${KRATOS_URL}/self-service/logout?token=someToken123`);

    expect(authStore.isGetLogoutLoading).toBe(false);
    expect(authStore.isGetLogoutError).toBe(false);
  });

  it('getLogout should handle error during logout data fetch', async () => {
    // Arrange
    const authStore = useAuthStore();

    // Mock error response
    const errorResponse = new Response(null, { status: 500 });

    fetchMocker.mockReject(errorResponse as unknown as ErrorOrFunction);

    // Act
    await authStore.getLogout('someToken123');

    // Assert
    expect(authStore.isGetLogoutLoading).toBe(false);
    expect(authStore.isGetLogoutError).toBe(true);
    expect(authStore.getLogoutResponse).toBeUndefined();
  });

  it('getLogoutUrl should fetch logout URL data successfully', async () => {
    // Arrange
    const authStore = useAuthStore();

    // Mock response data for getLogoutUrl
    const mockedGetLogoutURLData: IGetLogoutURL = mockLogoutUrl;

    fetchMocker.mockResponse(JSON.stringify(mockedGetLogoutURLData));

    // Act
    await authStore.getLogoutUrl();

    expect(fetchMocker.requests()[0].url).toEqual(`${KRATOS_URL}/self-service/logout/browser`);

    expect(authStore.isGetLogoutURLLoading).toBe(false);
    expect(authStore.isGetLogoutURLError).toBe(false);
    expect(authStore.getLogoutURLData).toEqual(mockedGetLogoutURLData);
  });

  it('getLogoutUrl should handle error during logout URL data fetch', async () => {
    // Arrange
    const authStore = useAuthStore();

    // Mock error response
    const errorResponse = new Response(null, { status: 500 });

    fetchMocker.mockReject(errorResponse as unknown as ErrorOrFunction);

    // Act
    await authStore.getLogoutUrl();

    // Assert
    expect(authStore.isGetLogoutURLLoading).toBe(false);
    expect(authStore.isGetLogoutURLError).toBe(true);
    expect(authStore.getLogoutURLData).toBeUndefined();
  });

  it('getSignup should fetch signup data successfully', async () => {
    // Arrange
    const authStore = useAuthStore();

    // Mock response data for getSignup
    const mockedGetSignupData: IGetSignup = mockGetSignup;

    fetchMocker.mockResponse(JSON.stringify(mockedGetSignupData));

    // Act
    await authStore.getSignup('flowId123');

    expect(fetchMocker.requests()[0].url).toEqual(`${KRATOS_URL}/self-service/registration?flow=flowId123`);

    expect(authStore.isGetSignupLoading).toBe(false);
    expect(authStore.isGetSignupError).toBe(false);
    expect(authStore.getSignupData).toBeUndefined();
  });

  it('getSignup should handle error during signup data fetch', async () => {
    // Arrange
    const authStore = useAuthStore();

    fetchMocker.mockReject({ status: 500, json: () => {} } as unknown as ErrorOrFunction);

    // Act
    await authStore.getSignup('flowId123');

    // Assert
    expect(authStore.isGetSignupLoading).toBe(false);
    expect(authStore.isGetSignupError).toBe(true);
    expect(authStore.getSignupData).toBeUndefined();
  });

  it('setSignup should send signup data successfully', async () => {
    // Arrange
    const authStore = useAuthStore();

    // Mock response data for setSignup
    const mockedSetSignupData: ISetSignUpOK = mockSetSignup;

    fetchMocker.mockResponse(JSON.stringify(mockedSetSignupData));

    // Act
    await authStore.setSignup('flowId123', 'password123', 'John', 'Doe', 'john.doe@example.com', 'csrfToken123');

    expect(fetchMocker.requests()[0].url).toEqual(`${KRATOS_URL}/self-service/registration?flow=flowId123`);

    expect(authStore.isSetSignupLoading).toBe(false);
    expect(authStore.isSetSignupError).toBe(false);
    expect(authStore.setSignupData).toEqual(mockedSetSignupData);
  });

  it('setSignup should handle error during signup data set', async () => {
    // Arrange
    const authStore = useAuthStore();

    // Mock error response
    const errorResponse = new Response(null, { status: 500 });

    fetchMocker.mockReject(errorResponse as unknown as ErrorOrFunction);

    // Act
    await authStore.setSignup('flowId123', 'password123', 'John', 'Doe', 'john.doe@example.com', 'csrfToken123');

    // Assert
    expect(authStore.isSetSignupLoading).toBe(false);
    expect(authStore.isSetSignupError).toBe(true);
    expect(authStore.setSignupData).toBeUndefined();
  });

  it('setRecovery should send recovery data successfully', async () => {
    // Arrange
    const authStore = useAuthStore();

    // Mock response data for setRecovery
    const mockedSetRecoveryData: IRecovery = mockRecovery;

    fetchMocker.mockResponse(JSON.stringify(mockedSetRecoveryData));

    // Act
    await authStore.setRecovery('flowId123', 'john.doe@example.com', 'csrfToken123');

    expect(fetchMocker.requests()[0].url).toEqual(`${KRATOS_URL}/self-service/recovery?flow=flowId123`);

    expect(authStore.isSetRecoveryLoading).toBe(false);
    expect(authStore.isSetRecoveryError).toBe(false);
    expect(authStore.setRecoveryData).toEqual(mockedSetRecoveryData);
  });

  it('setRecovery should handle error during recovery data set', async () => {
    // Arrange
    const authStore = useAuthStore();

    // Mock error response
    const errorResponse = new Response(null, { status: 500 });

    fetchMocker.mockReject(errorResponse as unknown as ErrorOrFunction);

    // Act
    await authStore.setRecovery('flowId123', 'john.doe@example.com', 'csrfToken123');

    // Assert
    expect(authStore.isSetRecoveryLoading).toBe(false);
    expect(authStore.isSetRecoveryError).toBe(true);
    expect(authStore.setRecoveryData).toBeUndefined();
  });

  it('setVerification should send verification data successfully', async () => {
    // Arrange
    const authStore = useAuthStore();

    // Mock response data for setVerification
    const mockedSetVerificationData: IRecovery = mockVerification;

    fetchMocker.mockResponse(JSON.stringify(mockedSetVerificationData));

    // Act
    await authStore.setVerification('flowId123', 'test@test.com', '123456', 'csrfToken123');

    expect(fetchMocker.requests()[0].url).toEqual(`${KRATOS_URL}/self-service/recovery?flow=flowId123`);

    expect(authStore.isSetVerificationLoading).toBe(false);
    expect(authStore.isSetVerificationError).toBe(false);
    expect(authStore.setVerificationData).toEqual(mockedSetVerificationData);
  });

  it('setVerification should handle error during verification data set', async () => {
    // Arrange
    const authStore = useAuthStore();

    // Mock error response
    const errorResponse = new Response(null, { status: 500 });

    fetchMocker.mockReject(errorResponse as unknown as ErrorOrFunction);

    // Act
    await authStore.setVerification('flowId123', '123456', 'csrfToken123');

    // Assert
    expect(authStore.isSetVerificationLoading).toBe(false);
    expect(authStore.isSetVerificationError).toBe(true);
    expect(authStore.setVerificationData).toBeUndefined();
  });

  it('setPassword should send password data successfully', async () => {
    // Arrange
    const authStore = useAuthStore();

    // Mock response data for setPassword
    const mockedSetPasswordData: IGetSettingsOk = mockSetPassword;

    fetchMocker.mockResponse(JSON.stringify(mockedSetPasswordData));

    // Act
    await authStore.setPassword('flowId123', 'newPassword123', 'csrfToken123');

    expect(fetchMocker.requests()[0].url).toEqual(`${KRATOS_URL}/self-service/settings?flow=flowId123`);

    expect(authStore.isSetPasswordLoading).toBe(false);
    expect(authStore.isSetPasswordError).toBe(false);
    expect(authStore.setPasswordData).toEqual(mockedSetPasswordData);
  });

  it('setPassword should handle error during password data set', async () => {
    // Arrange
    const authStore = useAuthStore();

    // Mock error response
    const errorResponse = new Response(null, { status: 500 });

    fetchMocker.mockReject(errorResponse as unknown as ErrorOrFunction);

    // Act
    await authStore.setPassword('flowId123', 'newPassword123', 'csrfToken123');

    // Assert
    expect(authStore.isSetPasswordLoading).toBe(false);
    expect(authStore.isSetPasswordError).toBe(true);
    expect(authStore.setPasswordData).toBeUndefined();
  });
});
