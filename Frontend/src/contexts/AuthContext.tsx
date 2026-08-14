import React, { createContext, useContext, useState, useEffect } from "react";
import { User, Role } from "../types";
import { authService } from "../services/authService";
import { getStoredUser, getStoredToken } from "../utils/storage";

interface AuthContextType {
  user: User | null;
  role: Role;
  token: string | null;
  isAuthenticated: boolean;
  login: (email: string, password?: string) => Promise<void>;
  register: (name: string, email: string, role?: Role, phone?: string) => Promise<void>;
  logout: () => void;
  switchRole: (role: Role) => void;
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

  const register = async (name: string, email: string, newRole: Role = "customer", phone?: string) => {
    const res = await authService.register(name, email, newRole, phone);
    setUser(res.user);
    setRole(res.user.role);
    setToken(res.token);
  };

  const logout = () => {
    authService.logout();
    setUser(null);
    setToken(null);
    setRole("customer");
  };

  const switchRole = (newRole: Role) => {
    const updatedUser = authService.switchRole(newRole);
    setUser(updatedUser);
    setRole(newRole);
    setToken(getStoredToken());
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        role,
        token,
        isAuthenticated: !!token,
        login,
        register,
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
