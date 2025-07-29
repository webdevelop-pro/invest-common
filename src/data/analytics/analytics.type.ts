export interface IAnalyticsData {
  component?: string;
  caller?: string[];
  stack?: string[];
  serviceContext?: {
    httpRequest?: {
      method?: string;
      url?: string;
      path?: string;
      userAgent?: string;
      referer?: string;
      remoteIp?: string;
      protocol?: string;
    };
    version?: string;
    user?: string;
    request_id?: string;
    service_name?: string;
  };
}

export interface IAnalyticsMessage {
  time?: string;
  level: 'info' | 'warn' | 'error' | 'debug';
  message: string;
  error?: string;
  data?: IAnalyticsData;
}

export interface IAnalyticsResponse {
  success: boolean;
  message?: string;
  id?: string;
}

export interface IAnalyticsError {
  code: string;
  message: string;
  details?: Record<string, any>;
} 