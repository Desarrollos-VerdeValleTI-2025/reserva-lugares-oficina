import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { ConfigProvider } from 'antd';
import { MsalProvider } from '@azure/msal-react';
import { msalInstance } from './features/auth/msalInstance.js';
import App from './App.jsx';

// msal-browser exige inicializar la instancia antes de usarla (obligatorio desde v3)
msalInstance.initialize().then(() => {
  createRoot(document.getElementById('root')).render(
    <StrictMode>
      <MsalProvider instance={msalInstance}>
        <ConfigProvider
        theme={{
          token: {
            borderRadius: 8,
            colorPrimary: '#2E7D32',
          }
            }}>
          <App />
        </ConfigProvider>
      </MsalProvider>
    </StrictMode>,
  );
});

