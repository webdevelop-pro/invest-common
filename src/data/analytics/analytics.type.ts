/**
 * Log levels for analytics messages
 */
export const AnalyticsLogLevel = {
  INFO: 'info',
  WARN: 'warn',
  ERROR: 'error',
  DEBUG: 'debug'
} as const;

export type AnalyticsLogLevel = typeof AnalyticsLogLevel[keyof typeof AnalyticsLogLevel];

export type AnalyticsEventType = 'open' | 'click' | 'send' | 'close';

export type AnalyticsHttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'HEAD' | 'OPTIONS' | 'PATCH';

/**
 * HTTP request information for analytics context
 */
export interface IHttpRequest {
  method: string;
  url: string;
  path: string;
  userAgent: string;
  referer: string;
  remoteIp: string;
  protocol: string;
}

/**
 * Service context information for analytics
 */
export interface IServiceContext {
  httpRequest: IHttpRequest;
  version?: string;
  user?: string;
  request_id?: string;
  service_name?: string;
}

export interface IServiceContextEvent {
  httpRequest: {
    method: AnalyticsHttpMethod;
    url: string;
    userAgent: string;
    referer: string;
    remoteIp: string;
    protocol: string;
  };
  user: string;
  request_id: string;
  service_name: string;
  version: string;
}

/**
 * Analytics data payload
 */
export interface IAnalyticsData {
  component: string;
  caller: string[];
  stack: string[];
  serviceContext: IServiceContext;
  client?: IClientContext;
}

export interface IViewportInfo {
  width?: number;
  height?: number;
}

export interface IScreenInfo {
  width?: number;
  height?: number;
  availWidth?: number;
  availHeight?: number;
  colorDepth?: number;
  pixelRatio?: number;
}

export interface IOrientationInfo {
  type?: string;
  angle?: number;
}

export interface IClientContext {
  userAgent?: string;
  language?: string;
  languages?: readonly string[];
  onLine?: boolean;
  timeZone?: string;
  viewport?: IViewportInfo;
  screen?: IScreenInfo;
  orientation?: IOrientationInfo;
}

/**
 * Analytics message structure
 */
export interface IAnalyticsMessage {
  time: string;
  level: AnalyticsLogLevel;
  message: string;
  error: string;
  data: IAnalyticsData;
}

export interface IAnalyticsEventRequest {
  event_type: AnalyticsEventType;
  method: AnalyticsHttpMethod;
  status_code: number;
  identity_id: string;
  request_path: string;
  service_context: IServiceContextEvent;
}

/**
 * Response from analytics service
 */
export interface IAnalyticsResponse {
  success: boolean;
  message: string;
  id?: string;
}

/**
 * Analytics error structure
 */
export interface IAnalyticsError {
  code: string;
  message: string;
  details: Record<string, unknown>;
} 