import axios from 'axios';
import { msalInstance } from '../features/auth/msalInstance.js';
import { apiRequest, loginRequest } from '../features/auth/msalConfig.js';

const httpClient = axios.create({ baseURL: import.meta.env.VITE_API_URL });


httpClient.interceptors.request.use(async (config) => {
  const account = msalInstance.getActiveAccount() || msalInstance.getAllAccounts()[0];
  if (account) {
    const tokenResponse = await msalInstance.acquireTokenSilent({ ...apiRequest, account });
    config.headers.Authorization = `Bearer ${tokenResponse.accessToken}`;
  }
  return config;
});

httpClient.interceptors.response.use(
  (response) => {
    return response.data.data;
  },
  (error) => {
    if (error.response && (error.response.status === 401 || error.response.status === 403)) {
      msalInstance.loginRedirect(loginRequest);
    } 

    if(error.response){
      const errorMessage = error.response.data?.error?.message || 'Error desconocido';
      return Promise.reject(new Error(errorMessage));
    } else{
      return Promise.reject(new Error('Error de conexión con el servidor'));
    }
  }
);
export default httpClient;
