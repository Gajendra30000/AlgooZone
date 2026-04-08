import { createContext, useState, useEffect, useContext } from 'react';
import axios from 'axios';
import API_URL from '../config';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    // Initial check (you might want to verify token with backend in a real app)
    useEffect(() => {
        const storedUser = localStorage.getItem('dsa_user');
        if (storedUser) {
            setUser(JSON.parse(storedUser));
        }
        setLoading(false);
    }, []);

    const login = async (registrationNumber, password) => {
        try {
            console.log('🔐 LOGIN ATTEMPT:', { registrationNumber });
            
            if (!registrationNumber || !password) {
                const errorMsg = 'Please provide both registration number and password';
                console.warn('❌ VALIDATION FAILED:', errorMsg);
                return {
                    success: false,
                    message: errorMsg
                };
            }

            const { data } = await axios.post(`${API_URL}/auth/login`, { 
                registrationNumber, 
                password 
            });
            
            console.log('✅ LOGIN SUCCESS');
            setUser(data);
            localStorage.setItem('dsa_user', JSON.stringify(data));
            localStorage.setItem('dsa_token', data.token);
            return { success: true };
        } catch (error) {
            console.error('❌ LOGIN ERROR:');
            console.error('Status:', error.response?.status);
            console.error('Message:', error.response?.data?.message);
            console.error('Error Details:', error.response?.data?.error);
            console.error('Full Error:', error);

            let errorMessage = 'Login failed. Please try again.';
            let errorDetails = '';

            if (error.response?.status === 401) {
                errorMessage = 'Invalid registration number or password';
                errorDetails = 'Please check your credentials and try again.';
            } else if (error.response?.status === 400) {
                errorMessage = error.response?.data?.message || 'Invalid input provided';
                errorDetails = error.response?.data?.error || '';
            } else if (error.response?.status === 500) {
                errorMessage = 'Server error. Please try again later.';
                errorDetails = error.response?.data?.error || '';
            } else if (error.code === 'ERR_NETWORK') {
                errorMessage = 'Cannot connect to server. Is the backend running?';
                errorDetails = `Check if server is running on ${API_URL}`;
            }

            return {
                success: false,
                message: errorMessage,
                details: errorDetails,
                statusCode: error.response?.status,
                error: error.response?.data?.error
            };
        }
    };

    const adminLogin = async (username, password) => {
        try {
            console.log('🔐 ADMIN LOGIN ATTEMPT:', { username });
            
            if (!username || !password) {
                const errorMsg = 'Please provide both username and password';
                console.warn('❌ ADMIN VALIDATION FAILED:', errorMsg);
                return {
                    success: false,
                    message: errorMsg
                };
            }

            const { data } = await axios.post(`${API_URL}/auth/admin/login`, { username, password });
            
            console.log('✅ ADMIN LOGIN SUCCESS');
            setUser({ ...data, role: 'admin' });
            localStorage.setItem('dsa_user', JSON.stringify({ ...data, role: 'admin' }));
            localStorage.setItem('dsa_token', data.token);
            return { success: true };
        } catch (error) {
            console.error('❌ ADMIN LOGIN ERROR:');
            console.error('Status:', error.response?.status);
            console.error('Message:', error.response?.data?.message);
            console.error('Full Error:', error);

            let errorMessage = 'Admin login failed. Please try again.';
            let errorDetails = '';

            if (error.response?.status === 401) {
                errorMessage = 'Invalid admin credentials';
                errorDetails = 'Please verify username and password.';
            } else if (error.response?.status === 400) {
                errorMessage = error.response?.data?.message || 'Invalid input provided';
                errorDetails = error.response?.data?.error || '';
            } else if (error.code === 'ERR_NETWORK') {
                errorMessage = 'Cannot connect to server';
                errorDetails = 'Check if backend is running';
            }

            return {
                success: false,
                message: errorMessage,
                details: errorDetails,
                statusCode: error.response?.status
            };
        }
    };

    const logout = () => {
        setUser(null);
        localStorage.removeItem('dsa_user');
        localStorage.removeItem('dsa_token');
    };

    return (
        <AuthContext.Provider value={{ user, login, adminLogin, logout, loading }}>
            {children}
        </AuthContext.Provider>
    );
};
