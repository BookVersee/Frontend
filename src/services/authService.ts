import { apiClient } from "./api";
import { User, AuthResponse, Role, Shop } from "../types";
import { DEMO_USERS, INITIAL_SHOPS } from "./mockData";
import { setStoredToken, setStoredUser, removeStoredToken, getStoredUser } from "../utils/storage";

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
        status: "ACTIVE" as const,
        createdAt: "24/08/2026",
      };

      if (user.status === "LOCKED") {
        throw new Error("Tài khoản này đã bị khóa bởi Quản trị viên.");
      }

      const mockToken = `mock-jwt-token-${user.id}-${Date.now()}`;
      setStoredToken(mockToken);
      setStoredUser(user);
      return { token: mockToken, user };
    }
  },

  async register(
    name: string,
    email: string,
    role: Role = "customer",
    phone?: string,
    address?: string
  ): Promise<AuthResponse> {
    try {
      const response = await apiClient.post<AuthResponse>("/auth/register", {
        name,
        email,
        role,
        phone,
        address,
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
        phone: phone || "0901234567",
        address: address || "TP. Hồ Chí Minh",
        status: "ACTIVE",
        balance: 0,
        createdAt: new Date().toLocaleDateString("vi-VN"),
      };
      const mockToken = `mock-jwt-token-${user.id}-${Date.now()}`;
      setStoredToken(mockToken);
      setStoredUser(user);
      DEMO_USERS.unshift(user);
      return { token: mockToken, user };
    }
  },

  async updateProfile(userData: Partial<User>): Promise<User> {
    try {
      const response = await apiClient.put<User>("/auth/profile", userData);
      setStoredUser(response.data);
      return response.data;
    } catch {
      const current = getStoredUser<User>();
      const updated = { ...current, ...userData } as User;
      setStoredUser(updated);
      const idx = DEMO_USERS.findIndex((u) => u.id === updated.id);
      if (idx !== -1) {
        DEMO_USERS[idx] = updated;
      }
      return updated;
    }
  },

  async verifyEmail(email: string, _code: string): Promise<boolean> {
    try {
      await apiClient.post("/auth/verify-email", { email, code: _code });
      return true;
    } catch {
      return true;
    }
  },

  async forgotPassword(email: string): Promise<boolean> {
    try {
      await apiClient.post("/auth/forgot-password", { email });
      return true;
    } catch {
      return true;
    }
  },

  async registerShop(shopData: {
    shopName: string;
    phone: string;
    address: string;
    description: string;
  }): Promise<Shop> {
    try {
      const res = await apiClient.post<Shop>("/shops/register", shopData);
      return res.data;
    } catch {
      const current = getStoredUser<User>();
      const newShop: Shop = {
        id: Date.now(),
        ownerId: current?.id || 1,
        name: shopData.shopName,
        email: current?.email || "shop@email.com",
        phone: shopData.phone,
        address: shopData.address,
        description: shopData.description,
        status: "PENDING",
        rating: 0,
        reviewCount: 0,
        bookCount: 0,
        joinedDate: new Date().toLocaleDateString("vi-VN"),
      };
      INITIAL_SHOPS.push(newShop);
      if (current) {
        current.shopStatus = "PENDING";
        current.shopName = shopData.shopName;
        setStoredUser(current);
      }
      return newShop;
    }
  },

  async getProfile(): Promise<User | null> {
    try {
      const response = await apiClient.get<User>("/auth/profile");
      return response.data;
    } catch {
      return getStoredUser<User>();
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
      status: "ACTIVE",
    };
    const mockToken = `mock-jwt-token-${matchedUser.id}-${role}`;
    setStoredToken(mockToken);
    setStoredUser(matchedUser);
    return matchedUser;
  },
};
