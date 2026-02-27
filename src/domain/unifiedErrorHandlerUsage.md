# Unified Error Handler Usage Guide

This unified error handler works for both Vue apps and VitePress, providing a single solution for global error handling and analytics integration.

## 🚀 Quick Start

### For Vue Apps

```typescript
// main.ts
import { createApp } from 'vue';
import { setupVueErrorHandler } from './domain/unifiedErrorHandler';
import App from './App.vue';

const app = createApp(App);

// Set up error handling - that's it!
setupVueErrorHandler(app);

app.mount('#app');
```

### For VitePress

```typescript
// .vitepress/theme/index.ts
import { setupVitePressErrorHandler } from 'InvestCommon/domain/unifiedErrorHandler';
import DefaultTheme from 'vitepress/theme';

export default {
  ...DefaultTheme,
  enhanceApp({ app }) {
    setupVitePressErrorHandler();
  }
};
```

## ⚙️ Advanced Configuration

### Custom Configuration

```typescript
import { setupUnifiedErrorHandler } from './domain/unifiedErrorHandler';

const errorHandler = setupUnifiedErrorHandler({
  appType: 'vue', // or 'vitepress'
  serviceName: 'my-custom-app',
  version: '2.0.0',
  enableConsoleCapture: true,
  enableGlobalHandlers: true,
  enableVueHandler: true,
  enableVitePressHandler: false
});

// Initialize with Vue app
const handler = errorHandler.initialize(vueApp);
```

### Manual Setup

```typescript
const errorHandler = setupUnifiedErrorHandler({
  appType: 'vue'
});

// Set up only specific handlers
errorHandler.setupGlobalHandlers();
errorHandler.setupVueHandler(vueApp);
// Don't set up VitePress handlers for Vue apps
```

## 🔧 Configuration Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `appType` | `'vue' \| 'vitepress'` | Required | Type of application |
| `serviceName` | `string` | `{appType}-app` | Service name for analytics |
| `version` | `string` | Auto-detected | App version |
| `enableConsoleCapture` | `boolean` | `true` | Capture console.error calls |
| `enableGlobalHandlers` | `boolean` | `true` | Set up global error handlers |
| `enableVueHandler` | `boolean` | Auto-detected | Enable Vue error handling |
| `enableVitePressHandler` | `boolean` | Auto-detected | Enable VitePress error handling |

## 📊 What Gets Captured

### Automatic Capture
- ✅ **Global Errors**: Unhandled JavaScript errors
- ✅ **Promise Rejections**: Unhandled async failures
- ✅ **Console Errors**: console.error calls
- ✅ **Vue Errors**: Component errors and crashes
- ✅ **VitePress Errors**: Page, router, and transition errors

## 🎨 Error Types

| Error Type | Description | App Type |
|------------|-------------|----------|
| `Vue Error Handler` | Vue component errors | Vue |
| `VitePress Page` | Page rendering errors | VitePress |
| `VitePress Router` | Navigation errors | VitePress |
| `Promise Rejection` | Unhandled async errors | Both |
| `Global Error` | JavaScript runtime errors | Both |
| `Console Error` | Console.error calls | Both |

## 🚨 Error Handling Priority

1. **Global Handlers** (unhandled errors, promise rejections)
2. **Framework Handlers** (Vue/VitePress specific)
3. **Console Capture** (console.error override)

## 💡 Best Practices

1. **Use convenience functions** for simple setups
2. **Customize configuration** for complex requirements
3. **Test error scenarios** in development

## 🔍 Debugging

Enable debug logging by checking the browser console. All errors are logged before being sent to analytics, so you can see what's being captured.

## 🧪 Testing global alert (5xx banner)

### Unit tests

- **`generalErrorHandling` (UiKit):**  
  Run from repo root:
  ```bash
  npm run test:unit:cov -- ui-kit/src/helpers/__tests__/generalErrorHandling.test.ts
  ```
  Or with watch:
  ```bash
  npm run test:watch -- ui-kit/src/helpers/__tests__/generalErrorHandling.test.ts
  ```
  These tests assert that for 5xx `Response` errors the global alert is shown (and toast is not), and for non-5xx the toast is shown (and global alert is not).

### Manual testing in the browser

1. **Trigger a 5xx from an API call (e.g. dashboard):**
   - Open DevTools → Network.
   - Find a request that uses `ApiClient` (e.g. wallet, profile, portfolio).
   - Right-click the request → "Block request URL" or use a local proxy/mock server that returns 500 for that URL.
   - Reload or perform the action that triggers the request.
   - You should see the **red banner under the header** with message like `Request GET /path failed with status 500` (and optional server details). No toast.
