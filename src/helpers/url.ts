import {
  urlCheckEmail, urlForgot, urlProfilePortfolio, urlSignin, urlSignup,
} from 'InvestCommon/global/links';
import { useUsersStore } from 'InvestCommon/store/useUsers';
import { storeToRefs } from 'pinia';
import { navigateWithQueryParams } from 'UiKit/helpers/general';


// Utility functions for file path manipulation
export function getFileNameByPath(path: string): string {
  return path.split('\\').pop()!.split('/').pop()!;
}

export function getFileNameWOExtensionByPath(path: string): string {
  return getFileNameByPath(path).split('.').shift()!;
}

export function getFileExtensionByPath(path: string): string {
  return path.split('.').pop()!.toLowerCase();
}

// Utility functions for URL manipulation
export function getUrlParamsByObject(obj: Record<string, any>): string {
  const params: string[] = [];
  Object.entries(obj).forEach(([key, value]) => {
    if (value !== undefined) params.push(`${key}=${encodeURIComponent(value)}`);
  });
  return params.length ? `?${params.join('&')}` : '';
}

export function getParsedUrlParamsBySearch(searchString: string): Record<string, string> {
  if (!searchString) return {};
  let query = searchString;
  if (query.startsWith('?')) query = query.substring(1);
  const pairs = query.split('&');
  if (!pairs || !pairs.length) return {};
  const result: Record<string, string> = {};
  pairs.forEach((param) => {
    const [key, value] = param.split('=');
    result[decodeURIComponent(key)] = decodeURIComponent(value || '');
  });
  return result;
}

export function getSearchParamBySearch(paramName: string, searchString: string): string | undefined {
  const params = getParsedUrlParamsBySearch(searchString);
  return params[paramName];
}

export function getSearchParamsBySearch(searchString: string): Record<string, string> {
  const params = getParsedUrlParamsBySearch(searchString);
  return params;
}

export function getSearchParamsByUrl(url: string): Record<string, string> {
  const urlList = url.split('?');
  const params = getParsedUrlParamsBySearch(urlList[1]);
  return params;
}

export function getLocationFullPath(location: Location = window.location): string {
  return location.href.replace(location.origin, '');
}

export const isRedirectToProfile = () => {
  const queryRedirect = new URLSearchParams(window.location.search).get('redirect');
  const usersStore = useUsersStore();
  const { selectedUserProfileId, userLoggedIn } = storeToRefs(usersStore);
  if (!userLoggedIn.value) return;
  const urlToCheck = [urlSignin, urlSignup, urlForgot, urlCheckEmail];
  const url = window?.location.pathname;
  if (url !== '/' && urlToCheck.some((item) => item.includes(url))) {
    navigateWithQueryParams(queryRedirect || urlProfilePortfolio(selectedUserProfileId.value));
  }
};
