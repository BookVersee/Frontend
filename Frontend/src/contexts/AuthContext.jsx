import React, { createContext, useContext, useState, useEffect } from "react";
import { authService } from "../services/authService";
import { getStoredUser, getStoredToken } from "../utils/storage";

const AuthContext = createContext(undefined);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => getStoredUser());
  const [token, setToken] = useState(() => getStoredToken());
  const [role, setRole] = useState(() => {
    const stored = getStoredUser();
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

  const login = async (email, password) => {
    const res = await authService.login(email, password);
    setUser(res.user);
    setRole(res.user.role);
    setToken(res.token);
  };

  const register = async (name, email, newRole = "customer", phone = "") => {
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

  const switchRole = (newRole) => {
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

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within an AuthProvider");
  return ctx;
};
