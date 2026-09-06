/**
 * Application Environment Configuration
 *
 * SECURITY NOTICE:
 * Client-side environment variables prefixed with `VITE_` are publicly accessible in
 * the compiled JavaScript bundle.
 *
 * NEVER store privileged backend credentials, provider secret keys (e.g. Twilio Auth Tokens,
 * SendGrid API keys, Meta App Secrets, database connection strings) in client-side code or .env files.
 * All operations requiring authenticated third-party provider credentials MUST be executed
 * securely on a backend server.
 */

export interface AppConfig {
  readonly apiBaseUrl: string;
  readonly appName: string;
  readonly defaultCountry: string;
  readonly isMockEnabled: boolean;
  readonly isDev: boolean;
  readonly isProd: boolean;
}

export const ENV: AppConfig = {
  apiBaseUrl: (import.meta.env.VITE_API_BASE_URL as string) || '',
  appName: (import.meta.env.VITE_APP_NAME as string) || 'ComHub',
  defaultCountry: (import.meta.env.VITE_DEFAULT_COUNTRY as string) || 'US',
  isMockEnabled: (import.meta.env.VITE_ENABLE_MOCK_DATA as string) !== 'false',
  isDev: import.meta.env.DEV,
  isProd: import.meta.env.PROD,
};
