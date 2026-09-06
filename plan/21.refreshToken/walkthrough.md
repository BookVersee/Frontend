# Walkthrough: Hoàn Tất Triển Khai Toàn Diện Cơ Chế Refresh Token (Silent Token Rotation & Axios Interceptor)

## 1. Kết Quả Kiểm Tra Nghi Vấn Của Người Dùng

- **Nghi vấn ban đầu**: "Chưa gọi API Refresh Token" $\rightarrow$ **100% ĐÚNG**.
- **Thực trạng phát hiện**:
  - Backend (.NET 8) đã xây dựng endpoint `POST /api/auth/RefreshToken` với cơ chế Token Rotation hiện đại.
  - Frontend trước đây khi đăng nhập chỉ lưu `accessToken` và bỏ qua `refreshToken`.
  - Trong [api.ts](file:///Users/nguyenvanminhtam/Frontend/src/services/api.ts), khi gặp lỗi `HTTP 401 Unauthorized`, interceptor chỉ xóa token và đăng xuất người dùng, khiến phiên làm việc bị ngắt đột ngột khi token ngắn hạn hết hạn.

---

## 2. Các Thay Đổi Kỹ Thuật Đã Triển Khai

### 🔹 A. Tầng Quản lý Lưu Trữ ([src/utils/storage.ts](file:///Users/nguyenvanminhtam/Frontend/src/utils/storage.ts))
- Bổ sung 2 hàm helper:
  - `getStoredRefreshToken(): string | null`
  - `setStoredRefreshToken(refreshToken: string): void`
- Hàm `removeStoredToken()` đảm bảo dọn sạch đồng thời `bookverse_auth_token`, `bookverse_refresh_token` và thông tin user.

### 🔹 B. Tầng Dịch Vụ Xác Thực ([src/services/authService.ts](file:///Users/nguyenvanminhtam/Frontend/src/services/authService.ts))
- Bổ sung hàm `refreshToken(): Promise<string>`:
  - Gửi request `POST /auth/RefreshToken` kèm `refreshToken`.
  - Hỗ trợ **Token Rotation**: Lưu cặp `accessToken` mới và `refreshToken` mới do Backend sinh ra.
  - Cập nhật thông tin User nếu Backend trả về.
- Cập nhật các hàm `login()`, `register()`, `loginWithGoogle()`: Lưu `refreshToken` vào `localStorage` ngay khi đăng nhập thành công.
- Cập nhật `logout()`: Tự động lấy `refreshToken` gửi lên `POST /user/Logout` để Backend thu hồi phiên trong CSDL trước khi dọn dẹp bộ nhớ client.

### 🔹 C. Tầng Mạng & Axios Response Interceptor ([src/services/api.ts](file:///Users/nguyenvanminhtam/Frontend/src/services/api.ts))
- **Xử lý Silent Refresh**: Khi một request nhận lỗi `HTTP 401`:
  - Kiểm tra xem request có phải endpoint auth công khai (`/auth/login`, `/auth/register`, `/auth/RefreshToken`, `/auth/GoogleLogin`) hay không. Nếu phải, không lặp lại để tránh đệ quy.
  - Tự động gọi `POST /api/auth/RefreshToken` bằng instance axios độc lập.
  - Cập nhật Header `Authorization = Bearer <newToken>` và tự động **retry lại request gốc**.
- **Chống Race Condition (Failed Request Queueing)**:
  - Quản lý cờ `isRefreshing` và hàng đợi `failedQueue`.
  - Khi có nhiều request cùng nhận lỗi 401 đồng thời (ví dụ khi vừa tải trang Dashboard), chỉ có **duy nhất 1 request refresh** được gửi đi.
  - Các request còn lại được tạm hoãn trong hàng đợi và sẽ tự động chạy lại ngay khi có token mới.
- **Xử lý khi RefreshToken hết hạn**:
  - Nếu request refresh cũng thất bại (refresh token hết hạn hoặc bị thu hồi), hệ thống dọn sạch bộ nhớ và phát event `auth:session-expired`.

### 🔹 D. Tầng Trạng Thái Xác Thực ([src/contexts/AuthContext.tsx](file:///Users/nguyenvanminhtam/Frontend/src/contexts/AuthContext.tsx))
- Lắng nghe event `auth:session-expired` để tự động reset state `user = null`, `token = null`, `role = "customer"`.
- Cập nhật `logout()` truyền `refreshToken` lên backend thu hồi session.

---

## 3. Kết Quả Kiểm Tra (Verification)

- **Biên dịch Vite**:
  ```bash
  npm run build
  ```
  Kết quả: `✓ built in 950ms` — **0 lỗi TypeScript, 0 lỗi cú pháp**.
- **Kiểm tra Linting**:
  ```bash
  npm run lint
  ```
  Kết quả: **Pass 100%**.
- **Tuân thủ quy tắc dự án**: Toàn bộ mã nguồn `Backend/` giữ nguyên vẹn 100%.
