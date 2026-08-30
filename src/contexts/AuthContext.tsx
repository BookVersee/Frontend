import React, { createContext, useContext, useState, useEffect } from "react";
import { User, Role } from "../types";
import { authService, RegisterData } from "../services/authService";
import { getStoredUser, getStoredToken } from "../utils/storage";

interface AuthContextType {
  user: User | null;
  role: Role;
  token: string | null;
  isAuthenticated: boolean;
  login: (email: string, password?: string) => Promise<void>;
  loginWithGoogle: (idTokenOrData?: string | {
    email?: string;
    name?: string;
    avatar?: string;
    role?: Role;
    googleId?: string;
    idToken?: string;
  }) => Promise<void>;
  register: (
    data: RegisterData | string,
    email?: string,
    role?: Role,
    phone?: string,
    address?: string,
    password?: string
  ) => Promise<void>;
  forgotPassword: (email: string) => Promise<string>;
  verifyResetOtp: (email: string, otpCode: string) => Promise<string>;
  resetPassword: (email: string, otpCode: string, newPassword: string) => Promise<string>;
  logout: () => void;
  switchRole: (role: Role) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => getStoredUser<User>());
  const [token, setToken] = useState<string | null>(() => getStoredToken());
  const [role, setRole] = useState<Role>(() => {
    const stored = getStoredUser<User>();
    return stored?.role || "customer";
  });

  useEffect(() => {
    if (token && !user) {
      authService.getProfile().then((profile) => {
        if (profile) {
          setUser(profile);
          setRole(profile.role);
        }
      });
    }
  }, [token, user]);

  const login = async (email: string, password?: string) => {
    const res = await authService.login(email, password);
    setUser(res.user);
    setRole(res.user.role);
    setToken(res.token);
  };

  const loginWithGoogle = async (idTokenOrData?: string | {
    email?: string;
    name?: string;
    avatar?: string;
    role?: Role;
    googleId?: string;
    idToken?: string;
  }) => {
    const res = await authService.loginWithGoogle(idTokenOrData);
    setUser(res.user);
    setRole(res.user.role);
    setToken(res.token);
  };

  const register = async (
    data: RegisterData | string,
    email?: string,
    newRole: Role = "customer",
    phone?: string,
    address?: string,
    password?: string
  ) => {
    const res = await authService.register(data, email, newRole, phone, address, password);
    setUser(res.user);
    setRole(res.user.role);
    setToken(res.token);
  };

  const forgotPassword = async (email: string) => {
    return await authService.forgotPassword(email);
  };

  const verifyResetOtp = async (email: string, otpCode: string) => {
    return await authService.verifyResetOtp(email, otpCode);
  };

  const resetPassword = async (email: string, otpCode: string, newPassword: string) => {
    return await authService.resetPassword(email, otpCode, newPassword);
  };

  const logout = () => {
    authService.logout();
    setUser(null);
    setToken(null);
    setRole("customer");
  };

  const switchRole = async (newRole: Role) => {
    const res = await authService.switchRole(newRole);
    setUser(res.user);
    setRole(res.user.role);
    setToken(res.token);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        role,
        token,
        isAuthenticated: !!token,
        login,
        loginWithGoogle,
        register,
        forgotPassword,
        verifyResetOtp,
        resetPassword,
        logout,
        switchRole,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within an AuthProvider");
  return ctx;
};
