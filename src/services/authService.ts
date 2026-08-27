import { apiClient } from "./api";
import { User, AuthResponse, Role, Shop, ApiResponse } from "../types";
import { DEMO_USERS, INITIAL_SHOPS } from "./mockData";
import { setStoredToken, setStoredUser, removeStoredToken, getStoredUser } from "../utils/storage";

export const authService = {
  async login(email: string, _password?: string): Promise<AuthResponse> {
    try {
      // Gọi API thực tế của Backend
      const response = await apiClient.post<ApiResponse<any>>("/auth/login", {
        usernameOrEmail: email,
        password: _password || "Password123!", // password mặc định nếu để trống
      });

      const tokenResponse = response.data.data;
      const token = tokenResponse.accessToken;
      const user: User = {
        id: tokenResponse.user.id,
        name: tokenResponse.user.fullName || tokenResponse.user.username,
        email: tokenResponse.user.email,
        role: tokenResponse.user.role.toLowerCase() as Role,
        phone: tokenResponse.user.phone,
        address: tokenResponse.user.address,
        status: tokenResponse.user.status,
        balance: 0,
        createdAt: tokenResponse.user.createdAt,
      };

      setStoredToken(token);
      setStoredUser(user);
      return { token, user };
    } catch (error) {
      console.warn("Login API error, falling back to mock authentication:", error);
      
      // Fallback mock authentication
      const user = DEMO_USERS.find((u) => u.email.toLowerCase() === email.toLowerCase()) || {
        id: 9999,
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
      const response = await apiClient.post<ApiResponse<any>>("/auth/register", {
        username: email.split("@")[0],
        email: email,
        password: "Password123!", // mật khẩu mặc định cho các tài khoản đăng ký nhanh
        fullName: name,
        phone: phone || "",
        address: address || "",
        role: role.toUpperCase(), // Backend Role dạng UPPERCASE
      });

      const tokenResponse = response.data.data;
      const token = tokenResponse.accessToken;
      const user: User = {
        id: tokenResponse.user.id,
        name: tokenResponse.user.fullName || tokenResponse.user.username,
        email: tokenResponse.user.email,
        role: tokenResponse.user.role.toLowerCase() as Role,
        phone: tokenResponse.user.phone,
        address: tokenResponse.user.address,
        status: tokenResponse.user.status,
        balance: 0,
        createdAt: tokenResponse.user.createdAt,
      };

      setStoredToken(token);
      setStoredUser(user);
      return { token, user };
    } catch (error) {
      console.warn("Register API error, falling back to mock:", error);
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
      const response = await apiClient.put<ApiResponse<any>>("/user/UpdateProfile", {
        fullName: userData.name,
        phone: userData.phone,
        email: userData.email,
        address: userData.address,
      });

      const updatedUser = response.data.data;
      const user: User = {
        id: updatedUser.id,
        name: updatedUser.fullName || updatedUser.username,
        email: updatedUser.email,
        role: updatedUser.role.toLowerCase() as Role,
        phone: updatedUser.phone,
        address: updatedUser.address,
        status: updatedUser.status,
        balance: 0,
        createdAt: updatedUser.createdAt,
      };

      setStoredUser(user);
      return user;
    } catch (error) {
      console.warn("UpdateProfile API error, falling back to mock:", error);
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
      await apiClient.post("/user/VerifyEmail", { email, verificationCode: _code });
      return true;
    } catch {
      return true;
    }
  },

  async forgotPassword(email: string): Promise<boolean> {
    try {
      await apiClient.post("/user/ForgotPassword", { email });
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
      const res = await apiClient.post<ApiResponse<any>>("/user/RegisterShop", {
        shopName: shopData.shopName,
      });
      const shopResponse = res.data.data;
      const newShop: Shop = {
        id: shopResponse.id,
        ownerId: shopResponse.userId,
        name: shopResponse.shopName,
        email: getStoredUser<User>()?.email || "shop@email.com",
        phone: shopData.phone,
        address: shopData.address,
        description: shopData.description,
        status: shopResponse.condition === "PENDING" ? "PENDING" : "ACTIVE",
        rating: shopResponse.rating,
        reviewCount: 0,
        bookCount: 0,
        joinedDate: shopResponse.createdAt,
      };

      const current = getStoredUser<User>();
      if (current) {
        current.shopStatus = "PENDING";
        current.shopName = shopData.shopName;
        current.shopId = shopResponse.id;
        setStoredUser(current);
      }
      return newShop;
    } catch (error) {
      console.warn("RegisterShop API error, falling back to mock:", error);
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
      const response = await apiClient.get<ApiResponse<any>>("/user/GetProfile");
      const profile = response.data.data;
      const user: User = {
        id: profile.id,
        name: profile.fullName || profile.username,
        email: profile.email,
        role: profile.role.toLowerCase() as Role,
        phone: profile.phone,
        address: profile.address,
        status: profile.status,
        balance: 0,
        createdAt: profile.createdAt,
      };
      setStoredUser(user);
      return user;
    } catch (error) {
      console.warn("GetProfile API error, falling back to mock:", error);
      return getStoredUser<User>();
    }
  },

  async loginWithGoogle(googleData?: {
    email: string;
    name?: string;
    avatar?: string;
    role?: Role;
    googleId?: string;
  }): Promise<AuthResponse> {
    const targetEmail = googleData?.email || "user.google@bookverse.com";
    const targetName = googleData?.name || targetEmail.split("@")[0];
    const targetAvatar = googleData?.avatar;
    const targetRole = googleData?.role || "customer";

    try {
      // Thử gọi API Backend nếu có sẵn endpoint Google OAuth
      const response = await apiClient.post<ApiResponse<any>>("/auth/google", {
        email: targetEmail,
        name: targetName,
        avatar: targetAvatar,
        googleId: googleData?.googleId || `g_${Date.now()}`,
      });

      const tokenResponse = response.data.data;
      const token = tokenResponse.accessToken;
      const user: User = {
        id: tokenResponse.user.id,
        name: tokenResponse.user.fullName || tokenResponse.user.username || targetName,
        email: tokenResponse.user.email || targetEmail,
        role: (tokenResponse.user.role?.toLowerCase() as Role) || targetRole,
        phone: tokenResponse.user.phone,
        address: tokenResponse.user.address,
        status: tokenResponse.user.status || "ACTIVE",
        avatar: tokenResponse.user.avatar || targetAvatar,
        balance: 0,
        createdAt: tokenResponse.user.createdAt || new Date().toLocaleDateString("vi-VN"),
        authProvider: "google",
      };

      setStoredToken(token);
      setStoredUser(user);
      return { token, user };
    } catch (error) {
      console.warn("Google Login API error, falling back to mock authentication:", error);

      // Mock user authentication with Google
      const existingUser = DEMO_USERS.find(
        (u) => u.email.toLowerCase() === targetEmail.toLowerCase()
      );

      const user: User = existingUser
        ? {
            ...existingUser,
            authProvider: "google",
            avatar: targetAvatar || existingUser.avatar,
          }
        : {
            id: Date.now(),
            name: targetName,
            email: targetEmail,
            role: targetRole,
            status: "ACTIVE",
            avatar: targetAvatar,
            balance: 0,
            createdAt: new Date().toLocaleDateString("vi-VN"),
            authProvider: "google",
          };

      if (user.status === "LOCKED") {
        throw new Error("Tài khoản này đã bị khóa bởi Quản trị viên.");
      }

      const mockToken = `mock-google-jwt-token-${user.id}-${Date.now()}`;
      setStoredToken(mockToken);
      setStoredUser(user);
      if (!existingUser) {
        DEMO_USERS.unshift(user);
      }
      return { token: mockToken, user };
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
