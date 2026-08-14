import { apiClient } from "./api";
import { User, AuthResponse, Role } from "../types";
import { DEMO_USERS } from "./mockData";
import { setStoredToken, setStoredUser, removeStoredToken } from "../utils/storage";

export const authService = {
  async login(email: string, _password?: string): Promise<AuthResponse> {
    try {
      const response = await apiClient.post<AuthResponse>("/auth/login", {
        email,
        password: _password,
      });
      setStoredToken(response.data.token);
      setStoredUser(response.data.user);
      return response.data;
    } catch {
      // Fallback mock authentication
      const user = DEMO_USERS.find((u) => u.email.toLowerCase() === email.toLowerCase()) || {
        id: Date.now(),
        name: email.split("@")[0],
        email: email,
        role: "customer" as Role,
      };
      const mockToken = `mock-jwt-token-${user.id}-${Date.now()}`;
      setStoredToken(mockToken);
      setStoredUser(user);
      return { token: mockToken, user };
    }
  },

  async register(name: string, email: string, role: Role = "customer", phone?: string): Promise<AuthResponse> {
    try {
      const response = await apiClient.post<AuthResponse>("/auth/register", {
        name,
        email,
        role,
        phone,
      });
      setStoredToken(response.data.token);
      setStoredUser(response.data.user);
      return response.data;
    } catch {
      const user: User = {
        id: Date.now(),
        name,
        email,
        role,
        phone,
        createdAt: new Date().toLocaleDateString("vi-VN"),
      };
      const mockToken = `mock-jwt-token-${user.id}-${Date.now()}`;
      setStoredToken(mockToken);
      setStoredUser(user);
      return { token: mockToken, user };
    }
  },

  async getProfile(): Promise<User | null> {
    try {
      const response = await apiClient.get<User>("/auth/profile");
      return response.data;
    } catch {
      return null;
    }
  },

  logout(): void {
    removeStoredToken();
  },

  switchRole(role: Role): User {
    const matchedUser = DEMO_USERS.find((u) => u.role === role) || {
      id: Date.now(),
      name: `User ${role}`,
      email: `${role}@bookverse.com`,
      role,
    };
    const mockToken = `mock-jwt-token-${matchedUser.id}-${role}`;
    setStoredToken(mockToken);
    setStoredUser(matchedUser);
    return matchedUser;
  },
};
