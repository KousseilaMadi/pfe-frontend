import { createContext, useContext, useState, useEffect } from 'react';
import * as api from '../api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(false);

    async function login(username, password) {
        try {
            const loggedInUser = await api.login(username, password);
            setUser(loggedInUser);
            return { success: true };
        } catch (e) {
            return { success: false, error: e };
        }
    }

    async function logout() {
        await api.logout();
        setUser(null);
    }

    const isAdmin = () => user?.role === 'admin';
    const isManager = () => user?.role === 'manager';
    const isOperator = () => user?.role === 'operator';
    const isAdminOrManager = () => isAdmin() || isManager();
    const canManageStock = () => user !== null;
    const canValidateOrders = () => isManager();
    const canManageProducts = () => isAdminOrManager();
    const canManageUsers = () => isAdmin();
    const canManageSettings = () => isAdminOrManager();

    return (
        <AuthContext.Provider value={{
            user,
            loading,
            login,
            logout,
            isAdmin,
            isManager,
            isOperator,
            isAdminOrManager,
            canManageStock,
            canValidateOrders,
            canManageProducts,
            canManageUsers,
            canManageSettings,
        }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    return useContext(AuthContext);
}