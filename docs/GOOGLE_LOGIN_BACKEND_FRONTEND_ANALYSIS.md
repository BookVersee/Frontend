# TÀI LIỆU PHÂN TÍCH & ĐỐI SOÁT TÍNH NĂNG ĐĂNG NHẬP GOOGLE (BACKEND & FRONTEND)

> **Dự án**: BookVerse - Multi-Vendor Book Marketplace  
> **Ngày lập báo cáo**: 29/08/2026  
> **Tài liệu tham chiếu**: Branch Backend `origin/feature/nanh/update-login-google` & Frontend `src/`  

---

## 1. TỔNG QUAN HIỆN TRẠNG TRIỂN KHAI

Tính năng **Google OAuth Authentication (Đăng nhập / Đăng ký nhanh bằng tài khoản Google)** đã được đội ngũ Backend hoàn thiện trên nhánh tính năng riêng. Phía Frontend hiện tại đã xây dựng giao diện UI (nút đăng nhập, modal chọn tài khoản Google giả lập) nhưng **chưa đồng bộ chính xác theo hợp đồng API thực tế mà Backend yêu cầu**.

---

## 2. VỊ TRÍ MÃ NGUỒN ĐĂNG NHẬP GOOGLE TRONG FOLDER BACKEND

Tính năng Đăng nhập Google được triển khai trong nhánh git:
- **Git Branch**: `feature/nanh/update-login-google` (Commit hash: `412b063`)
- **Tác giả**: `NAnh <nguyenngocanh066206@gmail.com>`

Chi tiết các file mã nguồn liên quan trong folder `Backend/`:

```
Backend/
├── BookManagement.Api/
│   ├── Controllers/
│   │   └── AuthController.cs                # [POST] /api/auth/GoogleLogin
│   ├── Program.cs                           # Đăng ký DI IOptions<GoogleAuthOptions>
│   └── appsettings.json                     # Cấu hình GoogleAuth:ClientId
└── BookManagement.Service/
    ├── Auth/
    │   ├── AuthRequest.cs                   # Định nghĩa GoogleLoginRequest { IdToken }
    │   ├── IUserSessionService.cs           # Interface GoogleLoginAsync(...)
    │   └── UserSessionService.cs            # Logic xác thực JWT token qua Google API SDK
    ├── Models/
    │   └── GoogleAuthOptions.cs             # Model mapping cấu hình Google ClientId
    └── BookManagement.Service.csproj        # Package: Google.Apis.Auth (v1.76.0)
```

### Chi tiết logic xử lý tại Backend:

1. **Endpoint**: `POST /api/auth/GoogleLogin` (thuộc `AuthController.cs`)
2. **DTO Đầu vào (`GoogleLoginRequest`)**:
   ```csharp
   public class GoogleLoginRequest
   {
       public string IdToken { get; set; } = null!; // Google JWT ID Token từ Google OAuth SDK
   }
   ```
3. **Quy trình xác thực (`UserSessionService.GoogleLoginAsync`)**:
   - Sử dụng thư viện chính thức `Google.Apis.Auth` (`GoogleJsonWebSignature.ValidateAsync(request.IdToken, settings)`).
   - Kiểm tra `Audience` khớp với `GoogleAuth:ClientId` cấu hình trong hệ thống.
   - Giải mã lấy thông tin người dùng an toàn từ Google: `payload.Email`, `payload.Name`.
   - Tìm người dùng trong CSDL theo email (`_context.Users.FirstOrDefaultAsync(u => u.Email.ToLower() == email)`):
     - **Nếu tài khoản chưa tồn tại**: Tự động đăng ký người dùng mới với `Role = UserRole.CUSTOMER`, `Status = UserStatus.ACTIVE`, tự sinh `Username` từ tiền tố email.
     - **Nếu tài khoản đã tồn tại**: Giữ nguyên thông tin và Role hiện có (CUSTOMER, SHOP, ADMIN, DELIVER).
   - Kiểm tra nếu `user.Status == UserStatus.LOCKED` thì từ chối đăng nhập (ném lỗi tài khoản bị khóa).
   - Sinh chuỗi `AccessToken` (JWT), khởi tạo Session vào CSDL và trả về `RefreshToken`, `ExpiresAt`.

4. **Cấu trúc DTO Kết quả trả về (`ApiResponse<TokenResponse>`)**:
   ```json
   {
     "success": true,
     "message": "Google authentication successful.",
     "data": {
       "accessToken": "eyJhbGciOiJIUzI1NiIsIn...",
       "refreshToken": "4a1b-9f2c-...",
       "expiresAt": "2026-09-05T07:30:00Z",
       "user": {
         "id": "e2c34a1b-...",
         "username": "tamnguyen",
         "email": "tam.nguyen.dev@gmail.com",
         "fullName": "Tâm Nguyễn",
         "role": "CUSTOMER",
         "status": "ACTIVE",
         "createdAt": "2026-08-29T07:30:00Z"
       }
     }
   }
   ```

---

## 3. PHÂN TÍCH MÃ NGUỒN HIỆN TẠI PHÍA FRONTEND

Phía Frontend đã có các thành phần giao diện và logic sau:

1. **`src/components/auth/AuthModal.tsx`**:
   - Nút *"Tiếp tục với Google"* (Tab Đăng nhập) và *"Đăng ký nhanh bằng Google"* (Tab Đăng ký).
   - Dialog chọn tài khoản mẫu Google (`GOOGLE_SAMPLE_ACCOUNTS`) hoặc nhập email Gmail tùy chỉnh.
2. **`src/services/authService.ts` (`loginWithGoogle`)**:
   - Hiện đang gọi tới endpoint `/auth/google` (qua Vite proxy thành `/api/auth/google`).
   - Gửi payload dạng: `{ email, name, avatar, googleId }`.
   - Khi API lỗi (hoặc endpoint chưa có), tự động fallback về xác thực Mock User nội bộ.
3. **`src/contexts/AuthContext.tsx`**:
   - Hàm `loginWithGoogle` gọi qua `authService.loginWithGoogle`.
4. **`src/components/common/Header.tsx` & `src/pages/customer/ProfilePage.tsx`**:
   - Hiển thị badge nhận diện người dùng đăng nhập bằng Google (`user.authProvider === 'google'`).

---

## 4. BẢNG ĐỐI SOÁT & KHOẢNG CÁCH (GAP ANALYSIS) GIỮA FRONTEND VÀ BACKEND

| Tiêu chí đối soát | Backend Yêu Cầu (`feature/nanh/update-login-google`) | Frontend Đang Triển Khai (`src/`) | Kết Luận & Đánh Giá |
| :--- | :--- | :--- | :--- |
| **1. Đường dẫn Endpoint API** | `POST /api/auth/GoogleLogin` | `POST /auth/google` (Proxy thành `/api/auth/google`) | ❌ **Chưa khớp URL**: Khác tên endpoint (`GoogleLogin` vs `google`). Khi gọi sẽ gặp lỗi HTTP 404. |
| **2. Request Payload (F gửi lên B)** | `{ "idToken": "string" }`<br>*(Bắt buộc là Google ID Token được Google ký số)* | `{ "email": "...", "name": "...", "avatar": "...", "googleId": "..." }` | ❌ **Chưa gửi đúng mục B yêu cầu**: Backend không chấp nhận `email`/`name` thô từ client vì rủi ro bảo mật (bị mạo danh). Backend bắt buộc nhận `idToken` để xác thực với Google Server. |
| **3. Cơ chế kích hoạt Google SDK** | Yêu cầu tích hợp Google Identity Services (GIS) / Google OAuth Client để người dùng đăng nhập popup thực tế và lấy `credential/idToken`. | Hiện tại đang dùng danh sách tài khoản Mock (`GOOGLE_SAMPLE_ACCOUNTS`) và ô nhập Gmail tĩnh trên giao diện. | ⚠️ **Chưa tích hợp SDK thực tế**: Chưa có popup Google thật. |
| **4. Thông tin Header gửi kèm** | Đọc `User-Agent` (lấy thiết bị `deviceInfo`) và IP máy khách. | Axios tự động gửi kèm `User-Agent` của trình duyệt. | ✅ **Đã đáp ứng đầy đủ**. |
| **5. Dữ liệu Backend gửi về (B -> F)** | Trả về `accessToken`, `refreshToken`, `expiresAt`, và `user` (id, username, email, fullName, role, status, createdAt). | Frontend đã có hàm map `accessToken` và các trường `id`, `fullName`, `email`, `role`, `status`, `createdAt` vào state `User`. | ✅ **Đã hỗ trợ đầy đủ các trường user & token chính**. |
| **6. Quản lý Refresh Token** | Backend cung cấp `refreshToken` & `expiresAt` để gia hạn phiên. | Frontend hiện chỉ lưu `accessToken` vào `localStorage`, chưa lưu `refreshToken`. | ℹ️ **Lưu ý tối ưu**: Cần bổ sung lưu `refreshToken` để kích hoạt cơ chế Refresh Token khi hết hạn. |

---

## 5. TRẠNG THÁI CHẠY HIỆN TẠI CỦA BACKEND VÀ FRONTEND

Hệ thống đã kiểm tra và xác nhận cả 2 ứng dụng **đang hoạt động bình thường** trên máy cục bộ:

- **Backend API**: 
  - **Địa chỉ**: `http://localhost:5226`
  - **Swagger UI**: `http://localhost:5226/swagger/index.html` (HTTP 200 OK)
  - **Process ID (PID)**: 30650 (`BookManagement.Api` - .NET 10.0)
  - **Ghi chú**: Backend hiện đang chạy trên nhánh `merge-test4`. Để kích hoạt endpoint `/api/auth/GoogleLogin`, nhánh `feature/nanh/update-login-google` cần được gộp (merge) vào nhánh chạy chính.
- **Frontend App**:
  - **Địa chỉ**: `http://localhost:5173` (HTTP 200 OK)
  - **Process ID (PID)**: 30743 (Vite Dev Server)
  - **Vite Proxy**: Đã cấu hình chuyển tiếp toàn bộ `/api` -> `http://localhost:5226`.

---

## 6. ĐỀ XUẤT CÁC BƯỚC ĐỒNG BỘ TIẾP THEO (KHI CÓ SỰ ĐỒNG Ý CỦA BẠN)

Nhằm đảm bảo tuân thủ nghiêm ngặt yêu cầu **"Không tự ý sửa code khi chưa có sự đồng ý"**, dưới đây là phương án kỹ thuật đề xuất để tích hợp trọn vẹn:

### Bước 1: Về phía Backend
1. Thực hiện merge nhánh `origin/feature/nanh/update-login-google` vào nhánh chính (`merge-test4`).
2. Cập nhật `GoogleAuth:ClientId` hợp lệ từ Google Cloud Console vào `BookManagement.Api/appsettings.json`.

### Bước 2: Về phía Frontend
1. Cài đặt thư viện chuẩn `@react-oauth/google` hoặc nhúng script Google Identity Services (`https://accounts.google.com/gsi/client`).
2. Cập nhật `src/services/authService.ts`:
   - Đổi URL gọi API thành: `POST /api/auth/GoogleLogin`.
   - Gửi payload chuẩn: `{ idToken: credential }`.
   - Lưu trữ cả `accessToken` và `refreshToken` (nếu cần duy trì phiên đăng nhập lâu dài).
3. Cập nhật `src/components/auth/AuthModal.tsx`:
   - Gắn nút đăng nhập Google thật sử dụng Google OAuth Pop-up/One-Tap với `VITE_GOOGLE_CLIENT_ID` đã cấu hình trong `.env.development`.
