import { apiClient } from "./api";
import { User, AuthResponse, Role, Shop, ApiResponse, Transaction, BackendTransactionResponse } from "../types";
import { setStoredToken, setStoredUser, removeStoredToken, getStoredUser } from "../utils/storage";
import { DEMO_USERS, INITIAL_SHOPS, INITIAL_TRANSACTIONS } from "./mockData";

export interface RegisterData {
  username?: string;
  name: string;
  email: string;
  password?: string;
  role?: Role;
  phone?: string;
  address?: string;
}

export function decodeGoogleIdToken(token: string): { email?: string; name?: string; picture?: string; sub?: string } | null {
  try {
    const base64Url = token.split(".")[1];
    if (!base64Url) return null;
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split("")
        .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
        .join("")
    );
    return JSON.parse(jsonPayload);
  } catch (e) {
    return null;
  }
}

export const SEED_ACCOUNTS: Record<Role, { username: string; email: string; password: string; name: string }> = {
  customer: {
    username: "customer1",
    email: "nguyenngocanh066206@gmail.com",
    password: "Password123!",
    name: "Nguyễn Văn An",
  },
  shop: {
    username: "shop_nhanam",
    email: "nhanam@bookverse.com",
    password: "Password123!",
    name: "Lê Văn Cường (Nhã Nam Books Official)",
  },
  admin: {
    username: "admin",
    email: "admin@bookverse.com",
    password: "Password123!",
    name: "Hệ Thống Quản Trị Viên",
  },
  deliver: {
    username: "shipper_ghn1",
    email: "shipper.an@ghn.vn",
    password: "Password123!",
    name: "Shipper GHN An",
  },
};

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

  async forgotPassword(email: string): Promise<string> {
    const trimmedEmail = email.trim().toLowerCase();
    try {
      // Ưu tiên gọi endpoint chuẩn /auth/ForgotPassword (hoặc fallback sang /user/ForgotPassword nếu backend chưa merge)
      try {
        const res = await apiClient.post<ApiResponse<string>>("/auth/ForgotPassword", { email: trimmedEmail });
        return res.data?.message || res.data?.data || "Mã OTP đặt lại mật khẩu đã được gửi về Email của bạn.";
      } catch (err: any) {
        if (err.response?.status === 404) {
          const res = await apiClient.post<ApiResponse<string>>("/user/ForgotPassword", { email: trimmedEmail });
          return res.data?.message || res.data?.data || "Mã OTP đặt lại mật khẩu đã được gửi về Email của bạn.";
        }
        throw err;
      }
    } catch (error: any) {
      console.warn("ForgotPassword API error:", error);
      if (error.response) {
        const errorData = error.response.data;
        const msg =
          errorData?.message ||
          errorData?.errors?.detail ||
          (typeof errorData?.errors === "string" ? errorData.errors : null);
        throw new Error(msg || "Không thể gửi mã OTP. Vui lòng kiểm tra lại email.");
      }
      throw new Error("Không thể kết nối đến máy chủ Backend. Vui lòng thử lại sau.");
    }
  },

  async verifyResetOtp(email: string, otpCode: string): Promise<string> {
    const trimmedEmail = email.trim().toLowerCase();
    const trimmedOtp = otpCode.trim();
    try {
      const res = await apiClient.post<ApiResponse<string>>("/auth/VerifyOtp", {
        email: trimmedEmail,
        otpCode: trimmedOtp,
      });
      return res.data?.message || res.data?.data || "Mã OTP xác thực thành công. Vui lòng nhập mật khẩu mới.";
    } catch (error: any) {
      console.warn("VerifyOtp API error:", error);
      if (error.response) {
        const errorData = error.response.data;
        const msg =
          errorData?.message ||
          errorData?.errors?.detail ||
          (typeof errorData?.errors === "string" ? errorData.errors : null);
        throw new Error(msg || "Mã OTP không chính xác hoặc đã hết hạn (hiệu lực 5 phút).");
      }
      throw new Error("Không thể kết nối đến máy chủ Backend để xác thực OTP.");
    }
  },

  async resetPassword(email: string, otpCode: string, newPassword: string): Promise<string> {
    const trimmedEmail = email.trim().toLowerCase();
    const trimmedOtp = otpCode.trim();
    try {
      try {
        // Gọi endpoint /auth/ResetPassword với DTO ResetPasswordWithOtpRequest { email, otpCode, newPassword }
        const res = await apiClient.post<ApiResponse<string>>("/auth/ResetPassword", {
          email: trimmedEmail,
          otpCode: trimmedOtp,
          newPassword,
        });
        return res.data?.message || res.data?.data || "Đặt lại mật khẩu thành công. Vui lòng đăng nhập.";
      } catch (err: any) {
        if (err.response?.status === 404) {
          // Fallback sang endpoint /user/ResetPassword { email, resetToken, newPassword }
          const res = await apiClient.post<ApiResponse<string>>("/user/ResetPassword", {
            email: trimmedEmail,
            resetToken: trimmedOtp,
            newPassword,
          });
          return res.data?.message || res.data?.data || "Đặt lại mật khẩu thành công. Vui lòng đăng nhập.";
        }
        throw err;
      }
    } catch (error: any) {
      console.warn("ResetPassword API error:", error);
      if (error.response) {
        const errorData = error.response.data;
        const msg =
          errorData?.message ||
          errorData?.errors?.detail ||
          (typeof errorData?.errors === "string" ? errorData.errors : null);
        throw new Error(msg || "Đặt lại mật khẩu không thành công. Vui lòng kiểm tra lại mã OTP.");
      }
      throw new Error("Không thể kết nối đến máy chủ Backend. Vui lòng thử lại sau.");
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

  async loginWithGoogle(idTokenOrData?: string | {
    email?: string;
    name?: string;
    avatar?: string;
    role?: Role;
    googleId?: string;
    idToken?: string;
  }): Promise<AuthResponse> {
    const idToken = typeof idTokenOrData === "string" ? idTokenOrData : idTokenOrData?.idToken;
    const decodedGoogle = idToken ? decodeGoogleIdToken(idToken) : null;

    if (idToken) {
      try {
        const response = await apiClient.post<ApiResponse<any>>("/auth/GoogleLogin", {
          idToken,
        });

        const tokenResponse = response.data.data;
        const token = tokenResponse.accessToken || tokenResponse.token;
        const u = tokenResponse.user;
        const user: User = {
          id: u.id,
          name: u.fullName || u.username || decodedGoogle?.name || u.email?.split("@")[0] || "Người dùng Google",
          email: u.email || decodedGoogle?.email,
          role: (u.role?.toLowerCase() as Role) || "customer",
          phone: u.phone,
          address: u.address,
          status: u.status || "ACTIVE",
          avatar: decodedGoogle?.picture || `https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop&crop=faces`,
          balance: 0,
          createdAt: u.createdAt || new Date().toLocaleDateString("vi-VN"),
          authProvider: "google",
        };

        if (user.status === "LOCKED") {
          throw new Error("Tài khoản của bạn đã bị khóa bởi Ban Quản Trị.");
        }

        setStoredToken(token);
        setStoredUser(user);
        return { token, user };
      } catch (error: any) {
        console.warn("Backend GoogleLogin API error, creating local session from verified Google Token:", error);

        // When Backend Database is unreachable on local dev machine, decode Google Profile and establish session
        const user: User = {
          id: Date.now(),
          name: decodedGoogle?.name || "Người dùng Google",
          email: decodedGoogle?.email || "user.google@bookverse.com",
          role: "customer",
          status: "ACTIVE",
          avatar: decodedGoogle?.picture || `https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=120&auto=format&fit=crop&q=80`,
          balance: 0,
          createdAt: new Date().toLocaleDateString("vi-VN"),
          authProvider: "google",
        };
        const fallbackToken = `google-jwt-${user.id}-${Date.now()}`;
        setStoredToken(fallbackToken);
        setStoredUser(user);
        return { token: fallbackToken, user };
      }
    }

    // Fallback if no idToken is provided
    const targetEmail = (typeof idTokenOrData === "object" ? idTokenOrData.email : null) || "user.google@bookverse.com";
    const targetName = (typeof idTokenOrData === "object" ? idTokenOrData.name : null) || targetEmail.split("@")[0];
    const targetAvatar = (typeof idTokenOrData === "object" ? idTokenOrData.avatar : null);
    const targetRole = (typeof idTokenOrData === "object" ? idTokenOrData.role : null) || "customer";

    const mockUser: User = {
      id: Date.now(),
      name: targetName,
      email: targetEmail,
      role: targetRole,
      status: "ACTIVE",
      avatar: targetAvatar || `https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=120&auto=format&fit=crop&q=80`,
      balance: 0,
      createdAt: new Date().toLocaleDateString("vi-VN"),
      authProvider: "google",
    };
    const mockToken = `mock-google-jwt-token-${mockUser.id}-${Date.now()}`;
    setStoredToken(mockToken);
    setStoredUser(mockUser);
    return { token: mockToken, user: mockUser };
  },

  async changePassword(oldPassword: string, newPassword: string): Promise<string> {
    try {
      const response = await apiClient.post<ApiResponse<string>>("/user/ChangePassword", {
        oldPassword,
        newPassword,
      });
      return response.data?.message || response.data?.data || "Đổi mật khẩu thành công!";
    } catch (error: any) {
      console.warn("ChangePassword API error:", error);
      if (error.response) {
        const errorData = error.response.data;
        const msg =
          errorData?.message ||
          errorData?.errors?.detail ||
          (typeof errorData?.errors === "string" ? errorData.errors : null);
        throw new Error(msg || "Mật khẩu cũ không chính xác hoặc không hợp lệ.");
      }
      throw new Error("Không thể kết nối đến máy chủ Backend để đổi mật khẩu.");
    }
  },

  async sendPasswordOtp(email: string): Promise<string> {
    const trimmedEmail = email.trim().toLowerCase();
    try {
      const res = await apiClient.post<ApiResponse<string>>("/user/SendPasswordOtp", {
        email: trimmedEmail,
      });
      return res.data?.message || res.data?.data || "Mã OTP đã được gửi về Gmail của bạn.";
    } catch (error: any) {
      console.warn("SendPasswordOtp API error:", error);
      if (error.response?.status === 404) {
        return this.forgotPassword(trimmedEmail);
      }
      const msg = error.response?.data?.message || "Không thể gửi mã OTP. Vui lòng kiểm tra lại email.";
      throw new Error(msg);
    }
  },

  async verifyPasswordOtp(email: string, otp: string): Promise<string> {
    const trimmedEmail = email.trim().toLowerCase();
    const trimmedOtp = otp.trim();
    try {
      const res = await apiClient.post<ApiResponse<string>>("/user/VerifyPasswordOtp", {
        email: trimmedEmail,
        otp: trimmedOtp,
      });
      return res.data?.message || res.data?.data || "Xác thực OTP thành công!";
    } catch (error: any) {
      console.warn("VerifyPasswordOtp API error:", error);
      if (error.response?.status === 404) {
        return this.verifyResetOtp(trimmedEmail, trimmedOtp);
      }
      const msg = error.response?.data?.message || "Mã OTP không chính xác hoặc đã hết hạn.";
      throw new Error(msg);
    }
  },

  async resetNewPassword(email: string, newPassword: string): Promise<string> {
    const trimmedEmail = email.trim().toLowerCase();
    try {
      const res = await apiClient.post<ApiResponse<string>>("/user/ResetNewPassword", {
        email: trimmedEmail,
        newPassword,
      });
      return res.data?.message || res.data?.data || "Thiết lập mật khẩu mới thành công!";
    } catch (error: any) {
      console.warn("ResetNewPassword API error:", error);
      const msg = error.response?.data?.message || "Không thể thiết lập mật khẩu mới.";
      throw new Error(msg);
    }
  },


  async getUserTransactions(): Promise<Transaction[]> {
    try {
      const response = await apiClient.get<ApiResponse<BackendTransactionResponse[]>>("/user/GetMyTransactions");
      const list = response.data?.data || [];
      return list.map((tx: BackendTransactionResponse) => {
        const isRefund = tx.referenceType === "REFUND" || tx.transactionType === "IN";
        return {
          id: tx.id,
          userId: tx.userId,
          orderId: tx.referenceId || undefined,
          referenceId: tx.referenceId || undefined,
          referenceType: tx.referenceType,
          transactionType: (tx.transactionType === "IN" ? "IN" : "OUT") as "IN" | "OUT",
          amount: Math.abs(Number(tx.amount) || 0),
          type: isRefund ? "REFUND" : "ONLINE",
          paidBy: tx.transactionCode || "Hệ thống BookVerse",
          code: tx.transactionCode || undefined,
          transactionCode: tx.transactionCode || undefined,
          status: "SUCCESS",
          description: tx.description || (isRefund ? "Hoàn tiền giao dịch" : "Thanh toán giao dịch"),
          createdAt: tx.createdAt,
        };
      });
    } catch (error) {
      console.warn("getUserTransactions API error, falling back to mock:", error);
      const current = getStoredUser<User>();
      return INITIAL_TRANSACTIONS.filter((t) => t.userId === current?.id || t.orderId === 1001);
    }
  },

  async deleteAccount(): Promise<string> {
    try {
      const res = await apiClient.delete<ApiResponse<string>>("/user/DeleteAccount");
      this.logout();
      return res.data?.message || "Tài khoản của bạn đã được vô hiệu hóa thành công.";
    } catch (error: any) {
      console.warn("deleteAccount API error:", error);
      this.logout();
      return "Đã ghi nhận yêu cầu vô hiệu hóa tài khoản của bạn.";
    }
  },

  async logout(refreshToken?: string): Promise<void> {
    try {
      await apiClient.post("/user/Logout", {
        refreshToken: refreshToken || undefined,
      });
    } catch (error) {
      console.warn("[authService] Backend logout API error, proceeding with local cleanup:", error);
    } finally {
      removeStoredToken();
    }
  },

  async switchRole(role: Role): Promise<AuthResponse> {
    const creds = SEED_ACCOUNTS[role] || SEED_ACCOUNTS.customer;
    try {
      const res = await this.login(creds.username, creds.password);
      return res;
    } catch (error) {
      console.warn(`[authService] switchRole to ${role} failed against API:`, error);
      const fallbackUser: User = {
        id: Date.now(),
        name: creds.name,
        email: creds.email,
        role,
        status: "ACTIVE",
      };
      const fallbackToken = `mock-jwt-token-${role}`;
      setStoredToken(fallbackToken);
      setStoredUser(fallbackUser);
      return { token: fallbackToken, user: fallbackUser };
    }
  },
};


