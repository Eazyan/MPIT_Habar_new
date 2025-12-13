"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { auth } from "@/lib/api";

interface User {
    id: number;
    email: string;
    full_name: string | null;
}

interface AuthContextType {
    isAuthenticated: boolean;
    isLoading: boolean;
    user: User | null;
    login: (token: string) => void;
    logout: () => void;
}

const AuthContext = createContext<AuthContextType>({
    isAuthenticated: false,
    isLoading: true,
    user: null,
    login: () => { },
    logout: () => { },
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [user, setUser] = useState<User | null>(null);
    const router = useRouter();

    useEffect(() => {
        const token = localStorage.getItem("token");
        if (token) {
            // Fetch user profile
            auth.getMe()
                .then((userData) => {
                    setUser(userData);
                    setIsAuthenticated(true);
                })
                .catch(() => {
                    // Token invalid, clear it
                    localStorage.removeItem("token");
                    setIsAuthenticated(false);
                })
                .finally(() => {
                    setIsLoading(false);
                });
        } else {
            setIsLoading(false);
        }
    }, []);

    const login = (token: string) => {
        localStorage.setItem("token", token);
        // Fetch user after login
        auth.getMe()
            .then((userData) => {
                setUser(userData);
                setIsAuthenticated(true);
                router.push("/");
            })
            .catch(() => {
                setIsAuthenticated(false);
            });
    };

    const logout = () => {
        auth.logout();
        setUser(null);
        setIsAuthenticated(false);
    };

    return (
        <AuthContext.Provider value={{ isAuthenticated, isLoading, user, login, logout }}>
            {children}
        </AuthContext.Provider>
    );
}

export const useAuth = () => useContext(AuthContext);
