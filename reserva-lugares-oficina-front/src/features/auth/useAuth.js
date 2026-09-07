// src/features/auth/useAuth.js
import { useMsal } from '@azure/msal-react';
import { loginRequest } from './msalConfig';

export const useAuth = () => {
    const { instance, accounts } = useMsal();
    const usuarioActual = accounts[0] ?? null;
    const iniciarSesion = () => instance.loginRedirect(loginRequest);
    const cerrarSesion = () => instance.logoutRedirect();
    return { usuarioActual, iniciarSesion, cerrarSesion };
};
