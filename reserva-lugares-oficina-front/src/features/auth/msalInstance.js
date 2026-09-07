import { PublicClientApplication } from '@azure/msal-browser';
import { msalConfig } from './msalConfig.js';

// Instancia única de MSAL, compartida entre main.jsx (MsalProvider) y httpClient.js
// (que necesita pedir tokens fuera de un componente de React).
export const msalInstance = new PublicClientApplication(msalConfig);
