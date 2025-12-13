import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export const api = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Request Interceptor: Add Token
api.interceptors.request.use((config) => {
    if (typeof window !== 'undefined') {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
    }
    return config;
});

// Response Interceptor: Handle 401
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            if (typeof window !== 'undefined') {
                localStorage.removeItem('token');
                // Optional: Redirect to login
                // window.location.href = '/auth/login';
            }
        }
        return Promise.reject(error);
    }
);

export const auth = {
    login: async (email: string, password: string) => {
        const formData = new FormData();
        formData.append('username', email); // OAuth2 expects 'username'
        formData.append('password', password);

        const res = await api.post('/auth/login', formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
        });
        return res.data;
    },

    register: async (email: string, password: string, fullName: string) => {
        const res = await api.post('/auth/register', { email, password, full_name: fullName });
        return res.data;
    },

    logout: () => {
        localStorage.removeItem('token');
        window.location.href = '/auth/login';
    },

    getMe: async () => {
        const res = await api.get('/auth/me');
        return res.data;
    }
};
