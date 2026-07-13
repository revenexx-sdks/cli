// SDK
export const SDK_TITLE = 'Revenexx';
export const SDK_TITLE_LOWER = 'revenexx';
export const SDK_VERSION = '0.1.0';
export const SDK_NAME = 'Revenexx CLI';
export const SDK_PLATFORM = '';
export const SDK_LANGUAGE = 'cli';
export const SDK_LOGO = "\n \/$$$$$$$\n| $$__  $$\n| $$  \\ $$  \/$$$$$$  \/$$    \/$$ \/$$$$$$  \/$$$$$$$   \/$$$$$$  \/$$   \/$$ \/$$   \/$$\n| $$$$$$$\/ \/$$__  $$|  $$  \/$$\/\/$$__  $$| $$__  $$ \/$$__  $$|  $$ \/$$\/|  $$ \/$$\/\n| $$__  $$| $$$$$$$$ \\  $$\/$$\/| $$$$$$$$| $$  \\ $$| $$$$$$$$ \\  $$$$\/  \\  $$$$\/\n| $$  \\ $$| $$_____\/  \\  $$$\/ | $$_____\/| $$  | $$| $$_____\/  >$$  $$   >$$  $$\n| $$  | $$|  $$$$$$$   \\  $\/  |  $$$$$$$| $$  | $$|  $$$$$$$ \/$$\/\\  $$ \/$$\/\\  $$\n|__\/  |__\/ \\_______\/    \\_\/    \\_______\/|__\/  |__\/ \\_______\/|__\/  \\__\/|__\/  \\__\/\n                                                                             CLI\n\n";

// CLI
export const EXECUTABLE_NAME = 'revenexx';

// NPM
export const NPM_PACKAGE_NAME = '@revenexx/cli';
export const NPM_REGISTRY_URL = `https://registry.npmjs.org/${NPM_PACKAGE_NAME}/latest`;

// GitHub
export const GITHUB_REPO = 'revenexx-sdks/cli';
export const GITHUB_RELEASES_URL = `https://github.com/${GITHUB_REPO}/releases`;

// API
export const DEFAULT_ENDPOINT = 'https://api.revenexx.com/v1';
export const REGISTER_URL = 'https://revenexx.com/register';

// SSO (Zitadel OIDC) — overridable per environment via env vars (DX-57).
export const SSO_ISSUER = process.env.REVENEXX_SSO_ISSUER || 'https://id.revenexx.com';
export const SSO_CLIENT_ID = process.env.REVENEXX_SSO_CLIENT_ID || '378821498762167046';
export const SSO_SCOPES = 'openid profile email offline_access urn:zitadel:iam:org:projects:roles urn:zitadel:iam:org:project:id:357830079859917788:aud urn:zitadel:iam:org:project:id:379585984620135174:aud';
// Loopback redirect URI — must exactly match the URI registered on the Zitadel app.
export const SSO_REDIRECT_URI = process.env.REVENEXX_SSO_REDIRECT_URI || 'http://127.0.0.1:8000/callback';
