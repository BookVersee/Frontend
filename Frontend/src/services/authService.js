import { apiClient } from "./api";
import { DEMO_USERS } from "./mockData";
import { setStoredToken, setStoredUser, removeStoredToken } from "../utils/storage";

export const authService = {
  async login(email, password) {
    try {
      const response = await apiClient.post("/auth/login", {
        email,
        password,
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
        role: "customer",
      };
      const mockToken = `mock-jwt-token-${user.id}-${Date.now()}`;
      setStoredToken(mockToken);
      setStoredUser(user);
      return { token: mockToken, user };
    }
  },

  async register(name, email, role = "customer", phone = "") {
    try {
      const response = await apiClient.post("/auth/register", {
        name,
        email,
        role,
        phone,
      });
      setStoredToken(response.data.token);
      setStoredUser(response.data.user);
      return response.data;
    } catch {
      const user = {
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

  async getProfile() {
    try {
      const response = await apiClient.get("/auth/profile");
      return response.data;
    } catch {
      return null;
    }
  },

  logout() {
    removeStoredToken();
  },

  switchRole(role) {
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
