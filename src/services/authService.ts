import { apiClient } from "./api";
import { User, AuthResponse, Role, Shop, ApiResponse } from "../types";
import { DEMO_USERS, INITIAL_SHOPS } from "./mockData";
import { setStoredToken, setStoredUser, removeStoredToken, getStoredUser } from "../utils/storage";

export interface RegisterData {
  username?: string;
  name: string;
  email: string;
  password?: string;
  role?: Role;
  phone?: string;
  address?: string;
}

export const authService = {
  async login(usernameOrEmail: string, password?: string): Promise<AuthResponse> {
    try {
      // Gọi API thực tế của Backend
      const response = await apiClient.post<ApiResponse<any>>("/auth/login", {
        usernameOrEmail: usernameOrEmail.trim(),
        password: password || "",
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
    } catch (error: any) {
      console.warn("Login API error:", error);

      // Nếu Backend có phản hồi lỗi (HTTP 400, 401, 403, ...) -> Báo lỗi chính xác cho người dùng
      if (error.response) {
        const errorData = error.response.data;
        const msg =
          errorData?.message ||
          errorData?.errors?.detail ||
          (typeof errorData?.errors === "string" ? errorData.errors : null);

        if (error.response.status === 401 || msg?.includes("Invalid username/email or password")) {
          throw new Error("Tên đăng nhập hoặc mật khẩu không chính xác.");
        }
        if (msg?.includes("locked")) {
          throw new Error("Tài khoản này đã bị khóa bởi Quản trị viên.");
        }
        throw new Error(msg || "Đăng nhập không thành công. Vui lòng kiểm tra lại thông tin.");
      }

      // Chỉ fallback sang mock user khi máy chủ Backend không bật VÀ cờ VITE_ENABLE_MOCK=true
      const isMockEnabled = import.meta.env.VITE_ENABLE_MOCK === "true";
      if (isMockEnabled && !error.response) {
        const user = DEMO_USERS.find(
          (u) => u.email.toLowerCase() === usernameOrEmail.toLowerCase()
        );
        if (user) {
          if (user.status === "LOCKED") {
            throw new Error("Tài khoản này đã bị khóa bởi Quản trị viên.");
          }
          const mockToken = `mock-jwt-token-${user.id}-${Date.now()}`;
          setStoredToken(mockToken);
          setStoredUser(user);
          return { token: mockToken, user };
        }
      }

      throw new Error("Không thể kết nối đến máy chủ Backend. Vui lòng thử lại sau.");
    }
  },

  async register(
    data: RegisterData | string,
    email?: string,
    role: Role = "customer",
    phone?: string,
    address?: string,
    password?: string
  ): Promise<AuthResponse> {
    const payload: RegisterData =
      typeof data === "string"
        ? {
            name: data,
            email: email || "",
            role,
            phone,
            address,
            password: password || "Password123!",
          }
        : data;

    const username = payload.username || payload.email.split("@")[0];
    const userPassword = payload.password || "Password123!";
    const userRole = payload.role || "customer";

    try {
      const response = await apiClient.post<ApiResponse<any>>("/auth/register", {
        username: username,
        email: payload.email,
        password: userPassword,
        fullName: payload.name,
        phone: payload.phone || "",
        address: payload.address || "",
        role: userRole.toUpperCase(), // Backend Role dạng UPPERCASE
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
    } catch (error: any) {
      console.warn("Register API error:", error);

      // Nếu Backend có phản hồi lỗi (trùng username, trùng email, ...)
      if (error.response) {
        const errorData = error.response.data;
        const msg =
          errorData?.message ||
          errorData?.errors?.detail ||
          (typeof errorData?.errors === "string" ? errorData.errors : null);

        if (msg?.includes("Username is already taken") || msg?.includes("Username")) {
          throw new Error("Tên đăng nhập này đã được sử dụng. Vui lòng chọn tên khác.");
        }
        if (msg?.includes("Email is already registered") || msg?.includes("Email")) {
          throw new Error("Địa chỉ Email này đã được đăng ký tài khoản trong hệ thống.");
        }
        throw new Error(msg || "Đăng ký không thành công. Vui lòng thử lại.");
      }

      // Chỉ fallback sang mock khi Backend không hoạt động VÀ có bật cờ Mock
      const isMockEnabled = import.meta.env.VITE_ENABLE_MOCK === "true";
      if (isMockEnabled && !error.response) {
        const user: User = {
          id: Date.now(),
          name: payload.name,
          email: payload.email,
          role: userRole,
          phone: payload.phone || "0901234567",
          address: payload.address || "TP. Hồ Chí Minh",
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

      throw new Error("Không thể kết nối đến máy chủ Backend để đăng ký tài khoản.");
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
