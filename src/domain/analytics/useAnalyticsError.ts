const isDebug =
  typeof import.meta !== 'undefined' &&
  typeof (import.meta as any).env !== 'undefined' &&
  Boolean((import.meta as any).env.DEV);

const debugLog = (...args: unknown[]) => {
  if (!isDebug) return;
  console.log(...args);
};

export interface HttpRequestLike {
  method: string;
  url: string;
  path: string;
  userAgent: string;
  referer: string;
  remoteIp: string;
  protocol: string;
}

export interface ClientContextLike {
  userAgent?: string;
  language?: string;
  onLine?: boolean;
  timeZone?: string;
  viewport?: { width?: number; height?: number };
  screen?: { width?: number; height?: number; availWidth?: number; availHeight?: number };
  orientation?: { type?: string; angle?: number };
}

export const resolveComponentName = (vm: any, fallback: string = 'Unknown Component'): string => {
  // Vue 3 instance shape
  const v3Name = vm?.type?.name;
  if (v3Name && typeof v3Name === 'string') return v3Name;
  const v3File = vm?.type?.__file;
  if (v3File && typeof v3File === 'string') {
    const fileNameWithExt = v3File.split('/').pop() || v3File;
    const dotIndex = fileNameWithExt.lastIndexOf('.');
    return dotIndex > 0 ? fileNameWithExt.slice(0, dotIndex) : fileNameWithExt;
  }

  // Vue 2 instance shape
  const explicitName = vm?.$options?.name;
  if (explicitName && typeof explicitName === 'string') return explicitName;
  const filePath = vm?.$options?.__file;
  if (filePath && typeof filePath === 'string') {
    const fileNameWithExt = filePath.split('/').pop() || filePath;
    const dotIndex = fileNameWithExt.lastIndexOf('.');
    return dotIndex > 0 ? fileNameWithExt.slice(0, dotIndex) : fileNameWithExt;
  }
  return fallback;
};

export const normalizeGroupMessage = (rawMessage: string): string => {
  const msg = (rawMessage || '').toLowerCase().trim();
  if (/(cannot\s+read\s+propert(y|ies))|(can'?t\s+access\s+propert(y|ies))/.test(msg)) return "can't access property";
  if (/undefined\s+is\s+not\s+an?\s+object/.test(msg)) return "can't access property";
  if (/is\s+not\s+defined/.test(msg)) return 'identifier not defined';
  if (/unexpected\s+token/.test(msg)) return 'syntax error';
  if (/network\s+error/.test(msg)) return 'network error';
  if (/failed\s+to\s+fetch/.test(msg)) return 'network error';
  const firstSentence = msg.split(/[.!?]/)[0]?.trim();
  return firstSentence || 'unknown error';
};

export const buildHttpRequest = (httpRequest?: Partial<HttpRequestLike>): HttpRequestLike => {
  const pathValue = typeof window !== 'undefined' ? window.location.pathname : '';
  const urlValue = typeof window !== 'undefined' ? window.location.href : '';
  const userAgentValue = typeof navigator !== 'undefined' ? navigator.userAgent : '';
  return {
    method: httpRequest?.method ?? 'GET',
    url: httpRequest?.url ?? urlValue,
    path: httpRequest?.path ?? pathValue,
    userAgent: httpRequest?.userAgent ?? userAgentValue,
    referer: httpRequest?.referer ?? (typeof document !== 'undefined' ? document.referrer || '-' : '-'),
    remoteIp: httpRequest?.remoteIp ?? '-',
    protocol: httpRequest?.protocol ?? (typeof window !== 'undefined' ? window.location.protocol : ''),
  };
};

export const getClientContext = (): ClientContextLike => {
  return {
    userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : '',
    language: typeof navigator !== 'undefined' ? navigator.language : '',
    onLine: typeof navigator !== 'undefined' ? navigator.onLine : undefined,
    timeZone: typeof Intl !== 'undefined' && Intl.DateTimeFormat ? Intl.DateTimeFormat().resolvedOptions().timeZone : undefined,
    viewport: {
      width: typeof window !== 'undefined' ? window.innerWidth : undefined,
      height: typeof window !== 'undefined' ? window.innerHeight : undefined,
    },
    screen: typeof window !== 'undefined' && window.screen ? {
      width: window.screen.width,
      height: window.screen.height,
      availWidth: window.screen.availWidth,
      availHeight: window.screen.availHeight,
    } : undefined,
    orientation: typeof window !== 'undefined' && (window.screen as any)?.orientation ? {
      type: (window.screen as any).orientation.type,
      angle: (window.screen as any).orientation.angle,
    } : undefined,
  };
};

export const formatErrorMessage = (message: string, componentName: string): string => {
  return `${message} at ${componentName}`;
};

/**
 * Extracts component name from error stack with enhanced analysis for API errors.
 */
export const resolveComponentNameFromStack = (stack?: string): string | undefined => {
  if (!stack) {
    debugLog('[Stack Analysis] No stack provided');
    return undefined;
  }
  
  debugLog('[Stack Analysis] Analyzing stack:', stack.substring(0, 200) + '...');
  
  // Simplified pattern matching - just look for any PascalCase names
  const simplePatterns = [
    // Vue component files
    /([A-Z][A-Za-z0-9_-]+)\.vue/,
    // TypeScript files
    /([A-Z][A-Za-z0-9_-]+)\.ts/,
    // Function names in stack
    /at\s+([A-Z][A-Za-z0-9_-]+)/,
    // Component names in error messages
    /error\s+in\s+([A-Z][A-Za-z0-9_-]+)/i,
  ];
  
  // Try each pattern
  for (let i = 0; i < simplePatterns.length; i++) {
    const pattern = simplePatterns[i];
    const match = stack.match(pattern);
    if (match?.[1]) {
      const candidate = match[1];
      debugLog(`[Stack Analysis] Pattern ${i + 1} matched: "${candidate}"`);
      if (isValidComponentName(candidate, stack)) {
        debugLog(`[Stack Analysis] ✅ Valid component found: "${candidate}"`);
        return candidate;
      } else {
        debugLog(`[Stack Analysis] ❌ Invalid component name: "${candidate}"`);
      }
    }
  }
  
  debugLog('[Stack Analysis] ❌ No component name found in stack');
  return undefined;
};

/**
 * Specialized function to extract component name from API errors with enhanced analysis.
 */
export const resolveComponentNameFromAPIError = (error: Error | undefined, apiClient?: any): string | undefined => {
  if (!error) {
    debugLog('[API Error Analysis] No error provided');
    return undefined;
  }
  
  debugLog('[API Error Analysis] Analyzing API error:', error.message);
  
  // First try to get from API client context if available
  if (apiClient && (apiClient as any).componentContext) {
    debugLog('[API Error Analysis] ✅ Found component context in API client:', (apiClient as any).componentContext);
    return (apiClient as any).componentContext;
  }
  
  // Enhanced stack analysis for API errors
  const stack = error.stack || '';
  debugLog('[API Error Analysis] Analyzing stack for API patterns...');
  
  // Simplified API pattern matching
  const simpleApiPatterns = [
    // Any method calls
    /([A-Z][A-Za-z0-9_-]+)\.(?:get|post|put|patch|delete|set|create|update|remove|fetch|load|save|handle|submit)/,
    // Repository/Store patterns
    /([A-Z][A-Za-z0-9_-]+)(?:Repository|Store)\./,
    // Use patterns
    /use(?:Repository)?([A-Z][A-Za-z0-9_-]+)/,
  ];
  
  for (let i = 0; i < simpleApiPatterns.length; i++) {
    const pattern = simpleApiPatterns[i];
    const match = stack.match(pattern);
    if (match?.[1]) {
      console.log(`[API Error Analysis] API pattern ${i + 1} matched: "${match[1]}"`);
      if (isValidComponentName(match[1], stack)) {
        console.log(`[API Error Analysis] ✅ Valid API component found: "${match[1]}"`);
        return match[1];
      } else {
        console.log(`[API Error Analysis] ❌ Invalid API component name: "${match[1]}"`);
      }
    }
  }
  
  // Fall back to general stack analysis
  debugLog('[API Error Analysis] Falling back to general stack analysis...');
  return resolveComponentNameFromStack(stack);
};

/**
 * Picks a safe component name from error stack or vm, filtering out utilities.
 */
export const chooseSafeComponentName = (error: Error | undefined, vm: any, fallback: string = 'Unknown Component'): string => {
  debugLog('[Choose Safe Component] Starting component name selection...');
  
  // Try API-specific analysis first
  debugLog('[Choose Safe Component] Trying API-specific analysis...');
  const fromAPI = resolveComponentNameFromAPIError(error);
  if (fromAPI && isValidComponentName(fromAPI, error?.stack)) {
    debugLog('[Choose Safe Component] ✅ Using API analysis result:', fromAPI);
    return fromAPI;
  }
  
  // Try general stack analysis
  debugLog('[Choose Safe Component] Trying general stack analysis...');
  const fromStack = resolveComponentNameFromStack(error?.stack);
  if (fromStack && isValidComponentName(fromStack, error?.stack)) {
    debugLog('[Choose Safe Component] ✅ Using stack analysis result:', fromStack);
    return fromStack;
  }
  
  // Fall back to vm
  debugLog('[Choose Safe Component] Trying VM analysis...');
  const fromVm = resolveComponentName(vm, fallback);
  if (fromVm && isValidComponentName(fromVm)) {
    debugLog('[Choose Safe Component] ✅ Using VM analysis result:', fromVm);
    return fromVm;
  }
  
  debugLog('[Choose Safe Component] ❌ Using fallback:', fallback);
  return fallback;
};

/**
 * Checks if a name is a valid Vue component (not a utility).
 * Now allows all names except those from excluded paths.
 */
const isValidComponentName = (name?: string, stack?: string): boolean => {
  if (!name) return false;
  
  const trimmed = name.trim();
  if (!trimmed) return false;
  
  debugLog(`[Validation] Checking component name: "${name}"`);
  
  // Basic validation - exclude obvious utility names
  const bannedNames = [
    'event', 'listener', 'handler', 'callback', 'function', 'method',
    'anonymous', 'eval', 'proxy', 'object', 'promise', 'async',
    'await', 'then', 'catch', 'finally', 'resolve', 'reject'
  ];
  
  if (bannedNames.includes(trimmed.toLowerCase())) {
    debugLog(`[Validation] ❌ Name "${name}" is a banned utility name`);
    return false;
  }
  
  // Exclude utility class patterns
  const utilityPatterns = [
    /^EventListener$/i,
    /^EventTarget$/i,
    /^EventSource$/i,
    /^EventEmitter$/i,
    /^EventBus$/i,
    /^EventDispatcher$/i,
    /^EventManager$/i,
    /^EventRegistry$/i,
    /^EventStore$/i,
    /^EventRepository$/i,
    /^EventService$/i,
    /^EventClient$/i,
    /^EventHandler$/i,
    /^EventInterceptor$/i,
    /^EventAdapter$/i,
    /^EventProvider$/i,
    /^EventFactory$/i,
    /^EventBuilder$/i,
    /^EventHelper$/i,
    /^EventUtil$/i,
    /^EventTool$/i,
  ];
  
  if (utilityPatterns.some(pattern => pattern.test(trimmed))) {
    debugLog(`[Validation] ❌ Name "${name}" matches utility class pattern`);
    return false;
  }
  
  // Must be PascalCase (starts with uppercase)
  if (!/^[A-Z]/.test(trimmed)) {
    debugLog(`[Validation] ❌ Name "${name}" doesn't start with uppercase`);
    return false;
  }
  
  // Must be at least 3 characters
  if (trimmed.length < 3) {
    debugLog(`[Validation] ❌ Name "${name}" is too short`);
    return false;
  }
  
  // Only exclude names that come from specific non-component paths
  if (stack) {
    const lowerStack = stack.toLowerCase();
    const lowerName = name.toLowerCase();
    const excludePaths = [
      '/domain/', '/data/repository/', '/data/service/', '/data/analytics/',
      '/helpers/', '/utils/', '/services/', '/api/', '/client/',
      '/interceptors/', '/adapters/', '/handlers/'
    ];
    
    debugLog(`[Validation] Stack contains: ${lowerStack.substring(0, 100)}...`);
    debugLog(`[Validation] Looking for name "${lowerName}" in excluded paths...`);
    
    // Only exclude if the name is clearly from a utility file (not just mentioned in the stack)
    for (const path of excludePaths) {
      // Look for file paths that contain both the excluded path and the component name
      const filePathRegex = new RegExp(`[^\\s]*${path.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}[^\\s]*${lowerName}[^\\s]*\\.(ts|js|vue)`, 'i');
      if (filePathRegex.test(lowerStack)) {
        debugLog(`[Validation] ❌ Name "${name}" found in utility file path: ${path}`);
        return false;
      }
    }
    
    debugLog(`[Validation] ✅ Name "${name}" not found in any excluded paths`);
  }
  
  // Allow all other names that pass basic validation
  debugLog(`[Validation] ✅ Component name "${name}" is valid`);
  return true;
};

/**
 * Advanced stack trace analysis specifically for API errors with context awareness.
 */
export const analyzeAPIErrorStack = (error: Error | undefined): {
  componentName?: string;
  apiMethod?: string;
  repositoryName?: string;
  context?: string;
} => {
  if (!error?.stack) {
    debugLog('[API Stack Analysis] No stack provided');
    return {};
  }
  
  debugLog('[API Stack Analysis] Analyzing API error stack...');
  const stack = error.stack;
  const result: any = {};
  
  // Extract component name using general stack analysis
  debugLog('[API Stack Analysis] Using general stack analysis for component detection...');
  const componentName = resolveComponentNameFromStack(stack);
  if (componentName) {
    result.componentName = componentName;
    debugLog('[API Stack Analysis] ✅ Component found:', componentName);
  }
  
  // Extract API method information
  const apiMethodPatterns = [
    /\.(get|post|put|patch|delete|options)\s*\(/,
    /(?:handle|submit|save|load|fetch|get|post|put|patch|delete)\w*\s*\(/,
  ];
  
  for (let i = 0; i < apiMethodPatterns.length; i++) {
    const pattern = apiMethodPatterns[i];
    const match = stack.match(pattern);
    if (match?.[1]) {
      result.apiMethod = match[1];
      debugLog(`[API Stack Analysis] ✅ API method found with pattern ${i + 1}:`, match[1]);
      break;
    }
  }
  
  // Extract repository name - simplified patterns
  const simpleRepoPatterns = [
    /([A-Z][A-Za-z0-9_-]+)(?:Repository|Store)\./,
    /use(?:Repository)?([A-Z][A-Za-z0-9_-]+)/,
    /data\/(?:repository|service)\/([A-Z][A-Za-z0-9_-]+)/,
  ];
  
  for (let i = 0; i < simpleRepoPatterns.length; i++) {
    const pattern = simpleRepoPatterns[i];
    const match = stack.match(pattern);
    if (match?.[1]) {
      result.repositoryName = match[1];
      debugLog(`[API Stack Analysis] ✅ Repository found with pattern ${i + 1}:`, match[1]);
      break;
    }
  }
  
  // Extract context information
  const contextPatterns = [
    /async\s+([A-Z][A-Za-z0-9_-]+)/,
    /await\s+([A-Z][A-Za-z0-9_-]+)/,
    /Promise\.(?:resolve|reject|all|race)/,
  ];
  
  for (let i = 0; i < contextPatterns.length; i++) {
    const pattern = contextPatterns[i];
    const match = stack.match(pattern);
    if (match?.[1]) {
      result.context = match[1];
      debugLog(`[API Stack Analysis] ✅ Context found with pattern ${i + 1}:`, match[1]);
      break;
    }
  }
  
  debugLog('[API Stack Analysis] Final result:', result);
  return result;
};

/**
 * Comprehensive component name resolution for API errors.
 * Combines all analysis methods for the best possible result.
 */
export const resolveComponentNameForAPIError = (
  error: Error | undefined, 
  vm: any, 
  apiClient?: any,
  fallback: string = 'Unknown Component'
): {
  componentName: string;
  confidence: 'high' | 'medium' | 'low';
  source: 'api-context' | 'stack-analysis' | 'vm-analysis' | 'fallback';
  additionalInfo?: {
    apiMethod?: string;
    repositoryName?: string;
    context?: string;
  };
} => {
  console.log('[Comprehensive Analysis] Starting comprehensive component name resolution...');
  
  // Try API client context first (highest confidence)
  if (apiClient && (apiClient as any).componentContext) {
    debugLog('[Comprehensive Analysis] ✅ Using API client context:', (apiClient as any).componentContext);
    return {
      componentName: (apiClient as any).componentContext,
      confidence: 'high',
      source: 'api-context'
    };
  }
  
  // Try API-specific stack analysis
  debugLog('[Comprehensive Analysis] Trying API-specific stack analysis...');
  const apiAnalysis = analyzeAPIErrorStack(error);
  if (apiAnalysis.componentName && isValidComponentName(apiAnalysis.componentName, error?.stack)) {
    debugLog('[Comprehensive Analysis] ✅ API analysis found component:', apiAnalysis.componentName);
    return {
      componentName: apiAnalysis.componentName,
      confidence: 'high',
      source: 'stack-analysis',
      additionalInfo: {
        apiMethod: apiAnalysis.apiMethod,
        repositoryName: apiAnalysis.repositoryName,
        context: apiAnalysis.context
      }
    };
  }
  
  // Try general API error analysis
  debugLog('[Comprehensive Analysis] Trying general API error analysis...');
  const fromAPI = resolveComponentNameFromAPIError(error, apiClient);
  if (fromAPI && isValidComponentName(fromAPI, error?.stack)) {
    debugLog('[Comprehensive Analysis] ✅ General API analysis found component:', fromAPI);
    return {
      componentName: fromAPI,
      confidence: 'medium',
      source: 'stack-analysis'
    };
  }
  
  // Try general stack analysis
  debugLog('[Comprehensive Analysis] Trying general stack analysis...');
  const fromStack = resolveComponentNameFromStack(error?.stack);
  if (fromStack && isValidComponentName(fromStack, error?.stack)) {
    debugLog('[Comprehensive Analysis] ✅ General stack analysis found component:', fromStack);
    return {
      componentName: fromStack,
      confidence: 'medium',
      source: 'stack-analysis'
    };
  }
  
  // Fall back to VM analysis
  debugLog('[Comprehensive Analysis] Trying VM analysis...');
  const fromVm = resolveComponentName(vm, fallback);
  if (fromVm && isValidComponentName(fromVm)) {
    debugLog('[Comprehensive Analysis] ✅ VM analysis found component:', fromVm);
    return {
      componentName: fromVm,
      confidence: 'low',
      source: 'vm-analysis'
    };
  }
  
  // Final fallback
  debugLog('[Comprehensive Analysis] ❌ Using fallback component name:', fallback);
  return {
    componentName: fallback,
    confidence: 'low',
    source: 'fallback'
  };
};

export const getIsoTimestampFrom = (ts: unknown): string => {
  if (!ts) return new Date().toISOString();
  try {
    if (ts instanceof Date) return ts.toISOString();
    const asString = String(ts);
    const d = new Date(asString);
    return isNaN(d.getTime()) ? new Date().toISOString() : d.toISOString();
  } catch {
    return new Date().toISOString();
  }
};


