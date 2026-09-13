# Báo Cáo Triển Khai: Đổi Mật Khẩu Khi Quên Trong Hồ Sơ Cá Nhân (Profile)

Đã hoàn thành kiểm tra đối soát Backend API và tích hợp thành công giao diện **Đổi Mật Khẩu Khi Quên bằng mã xác thực OTP Email** trên trang Hồ sơ cá nhân ([ProfilePage.tsx](file:///Users/nguyenvanminhtam/Frontend/src/pages/customer/ProfilePage.tsx)).

---

## 1. Kết Quả Đối Soát Backend API

Backend ASP.NET Core (`BookManagement.Api` / `UserController.cs` và `UserService.cs`) đã được tích hợp đầy đủ 3 API xác thực OTP:

1. **`POST /api/user/SendPasswordOtp`**: 
   - Body: `{ "email": "user@example.com" }`
   - Tạo mã OTP 6 chữ số ngẫu nhiên, lưu vào Cache 15 phút và gửi email HTML bảo mật tới Gmail của người dùng.
2. **`POST /api/user/VerifyPasswordOtp`**: 
   - Body: `{ "email": "user@example.com", "otp": "123456" }`
   - Kiểm tra mã OTP, lưu quyền đổi mật khẩu vào cache 10 phút.
3. **`POST /api/user/ResetNewPassword`**: 
   - Body: `{ "email": "user@example.com", "newPassword": "Password123!" }`
   - Kiểm tra cache xác thực, mã hóa BCrypt mật khẩu mới và cập nhật cơ sở dữ liệu `BookManagementDb`.

---

## 2. Các Thay Đổi Đã Triển Khai Trên Frontend

### File cập nhật: [src/pages/customer/ProfilePage.tsx](file:///Users/nguyenvanminhtam/Frontend/src/pages/customer/ProfilePage.tsx)

1. **Quản lý State linh hoạt**:
   - `passChangeMode`: Chuyển đổi giữa 2 chế độ `"old_password"` (nhớ mật khẩu cũ) và `"email_otp"` (quên mật khẩu cũ, dùng OTP).
   - `profileOtp`, `profileOtpSent`, `profileOtpSending`, `profileOtpVerifying`: Quản lý trạng thái nhập và xác thực OTP.
   - `profileOtpCooldown`: Bộ đếm ngược 60 giây chống spam gửi lại OTP.

2. **Giao diện Trực quan & Hiện đại (UX/UI)**:
   - **Segmented Switch**: Thanh chuyển đổi nhanh giữa hai chế độ *"Nhớ mật khẩu cũ"* và *"Quên mật khẩu? (Dùng OTP)"*.
   - **Shortcut Link**: Ở form nhập mật khẩu cũ, có nút *"Quên mật khẩu hiện tại?"* bấm vào sẽ chuyển tức thì sang form xác thực OTP.
   - **Banner hướng dẫn OTP**: Thông báo rõ ràng mã OTP 6 số sẽ được gửi về hộp thư của tài khoản đang đăng nhập.
   - **Password Strength Meter**: Thanh đo độ mạnh/yếu của mật khẩu mới theo thời gian thực (Yếu / Trung bình / Rất mạnh).
   - **Nút Ẩn/Hiện mật khẩu**: Tích hợp icon `Eye` / `EyeOff` cho tất cả các ô nhập mật khẩu.
   - **Bảo toàn phiên đăng nhập**: Người dùng đổi mật khẩu thành công ngay trong trang Hồ sơ mà không bị gián đoạn hay bắt buộc phải đăng xuất ra ngoài.

---

## 3. Hướng Dẫn Kiểm Thử Trực Tiếp (Manual Verification)

1. Truy cập vào ứng dụng tại trình duyệt: **`http://localhost:5173`** (hoặc `http://localhost:5174`).
2. Đăng nhập vào bất kỳ tài khoản nào (Ví dụ: `customer@bookverse.com` hoặc `nguyenngocanh066206@gmail.com` / Mật khẩu: `Password123!`).
3. Nhấp vào Avatar góc trên bên phải ➔ Chọn **Hồ sơ cá nhân**.
4. Kéo xuống mục **"Đổi mật khẩu tài khoản"**:
   - **Thử nghiệm 1 (Nhớ mật khẩu cũ)**: Nhập mật khẩu hiện tại `Password123!`, mật khẩu mới và bấm *Cập nhật mật khẩu mới*.
   - **Thử nghiệm 2 (Quên mật khẩu cũ)**: Bấm tab **"Quên mật khẩu? (Dùng OTP)"** hoặc bấm link *"Quên mật khẩu hiện tại?"*.
     - Bấm **"Gửi mã OTP về Email"**.
     - Nhập mã OTP 6 số nhận được từ email (hoặc từ console log backend).
     - Nhập mật khẩu mới (quan sát thanh đo độ mạnh mật khẩu) và bấm **"Xác nhận & Cập nhật mật khẩu"**.
     - Thông báo thành công màu xanh hiển thị và hệ thống tự động reset form an toàn.
