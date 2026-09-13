# Kế Hoạch Triển Khai Tính Năng Đổi Mật Khẩu Khi Quên Trong Hồ Sơ Cá Nhân (Profile)

Tài liệu này đánh giá tính khả dụng của API Backend đối với nghiệp vụ **"Đổi mật khẩu khi quên trong Hồ sơ cá nhân"** và đề xuất giải pháp kỹ thuật, thiết kế giao diện chi tiết để tích hợp trên Frontend.

---

## 1. Kết Quả Đối Soát Backend API

Backend ASP.NET Core (`BookManagement.Api` / `UserController.cs` và `UserService.cs`) **ĐÃ HỖ TRỢ HOÀN CHỈNH 100%** bộ API xác thực OTP để đổi mật khẩu trong phiên đăng nhập của người dùng:

| STT | Endpoint | Method | Phân quyền | Payload (Body) | Chức năng nghiệp vụ Backend |
| :---: | :--- | :---: | :---: | :--- | :--- |
| **1** | `/api/user/SendPasswordOtp` | `POST` | `[Authorize]` | `{ "email": "user@example.com" }` | Sinh mã OTP 6 chữ số ngẫu nhiên, lưu vào Cache 15 phút và gửi email HTML bảo mật tới Gmail của người dùng. |
| **2** | `/api/user/VerifyPasswordOtp` | `POST` | `[Authorize]` | `{ "email": "user@example.com", "otp": "123456" }` | Kiểm tra tính chính xác và thời hạn của OTP; cấp quyền đổi mật khẩu (`verified_reset_{email}`) trong 10 phút. |
| **3** | `/api/user/ResetNewPassword` | `POST` | `[Authorize]` | `{ "email": "user@example.com", "newPassword": "Password123!" }` | Kiểm tra token xác thực, mã hóa BCrypt mật khẩu mới và lưu vào cơ sở dữ liệu `BookManagementDb`. |
| **4** | `/api/user/ChangePassword` | `POST` | `[Authorize]` | `{ "oldPassword": "...", "newPassword": "..." }` | Đổi mật khẩu trực tiếp (dành cho người dùng vẫn nhớ mật khẩu cũ). |

> [!NOTE]
> Backend đã có đầy đủ logic gửi email SMTP thực tế, quản lý cache OTP và mã hóa an toàn. Phía Frontend [authService.ts](file:///Users/nguyenvanminhtam/Frontend/src/services/authService.ts) cũng đã có sẵn các hàm bọc API tương ứng (`sendPasswordOtp`, `verifyPasswordOtp`, `resetNewPassword`, `changePassword`).

---

## 2. Vấn Đề Hiện Tại Trên Giao Diện Frontend ([ProfilePage.tsx](file:///Users/nguyenvanminhtam/Frontend/src/pages/customer/ProfilePage.tsx))

1. **Người dùng đăng nhập Google**: Đã có sẵn banner và luồng nhận OTP để thiết lập mật khẩu riêng.
2. **Người dùng thông thường (Email/Mật khẩu)**: Giao diện chỉ có duy nhất 1 form bắt buộc nhập `Mật khẩu hiện tại (oldPassword)`. 
   - Nếu người dùng **quên mật khẩu cũ** trong lúc đang ở trang Hồ sơ, họ bị bế tắc và không thể đổi mật khẩu, phải đăng xuất ra ngoài màn hình chính để dùng tính năng quên mật khẩu ở AuthModal.

---

## 3. Đề Xuất Giải Pháp Giao Diện & Trải Nghiệm (UX/UI)

Chúng ta sẽ nâng cấp Card **"Đổi mật khẩu tài khoản"** trong [ProfilePage.tsx](file:///Users/nguyenvanminhtam/Frontend/src/pages/customer/ProfilePage.tsx) với 2 chế độ linh hoạt:

### Chế độ 1: "Tôi nhớ mật khẩu cũ" (Mặc định)
- Form quen thuộc: `Mật khẩu hiện tại` + `Mật khẩu mới` + `Xác nhận mật khẩu mới`.
- Thêm đường dẫn nhanh dạng link phụ bên cạnh nhãn: **"Quên mật khẩu hiện tại? Đổi bằng mã OTP Email"**.

### Chế độ 2: "Quên mật khẩu cũ (Xác thực qua mã OTP Email)"
- Khi người dùng click vào link hoặc chuyển tab sang chế độ này:
  - **Bước 1**: Hiển thị nút **"Gửi mã OTP về [email của bạn]"** kèm bộ đếm ngược (Cooldown 60s chống spam).
  - **Bước 2**: Khi OTP đã gửi, hiển thị:
    - Ô nhập mã xác thực OTP 6 số (kèm nút "Gửi lại mã").
    - Ô nhập `Mật khẩu mới` (tối thiểu 6 ký tự, có thanh đánh giá độ mạnh yếu).
    - Ô nhập `Xác nhận mật khẩu mới`.
  - **Bước 3**: Bấm nút **"Xác nhận & Cập nhật mật khẩu"**:
    - Frontend gọi tuần tự `verifyPasswordOtp` ➔ `resetNewPassword`.
    - Thông báo thành công rực rỡ dạng banner xanh emerald, tự động xóa sạch các trường input và quay về trạng thái an toàn.

---

## User Review Required

> [!IMPORTANT]
> - Sau khi đặt lại mật khẩu mới thành công qua OTP trong Profile, người dùng **vẫn tiếp tục giữ phiên đăng nhập hiện tại** (không bắt buộc phải đăng xuất ra ngoài), hoặc bạn có muốn tự động đăng xuất để yêu cầu đăng nhập lại bằng mật khẩu mới không? (Khuyến nghị: Giữ phiên đăng nhập để người dùng không bị gián đoạn trải nghiệm).

---

## Open Questions

- Không có câu hỏi ngăn trở. Thiết kế đã bám sát 100% API Contract hiện có của Backend.

---

## Proposed Changes

### Frontend Customer Profile Component

#### [MODIFY] [ProfilePage.tsx](file:///Users/nguyenvanminhtam/Frontend/src/pages/customer/ProfilePage.tsx)
- Thêm state quản lý phương thức đổi mật khẩu cho người dùng thường:
  - `passChangeMode: "old_password" | "email_otp"`
  - `forgotOtp: string`, `forgotOtpSent: boolean`, `otpCooldown: number`
- Thêm handler `handleSendProfilePasswordOtp`: gọi `authService.sendPasswordOtp(user.email)` và kích hoạt đếm ngược 60s.
- Thêm handler `handleResetPasswordViaOtp`: kiểm tra tính hợp lệ của mật khẩu mới, gọi `authService.verifyPasswordOtp` và `authService.resetNewPassword`.
- Cập nhật JSX tại Card Đổi mật khẩu với thiết kế UI hiện đại, gradient đẹp mắt, hỗ trợ đầy đủ icon `KeyRound`, `ShieldCheck`, `Eye`, `EyeOff`, thông báo lỗi/thành công rõ ràng.

#### [MODIFY] [authService.ts](file:///Users/nguyenvanminhtam/Frontend/src/services/authService.ts)
- Kiểm tra và đảm bảo các hàm `sendPasswordOtp`, `verifyPasswordOtp`, `resetNewPassword` gửi đúng format payload chuẩn của `UserController` (`{ email }`, `{ email, otp }`, `{ email, newPassword }`).

---

## Verification Plan

### Manual Verification
1. **Kiểm tra luồng Đổi mật khẩu thường (Nhớ mật khẩu cũ)**:
   - Đăng nhập tài khoản mẫu `customer@bookverse.com` hoặc `nguyenngocanh066206@gmail.com`.
   - Vào Hồ sơ cá nhân ➔ Nhập mật khẩu cũ `Password123!`, nhập mật khẩu mới và xác nhận ➔ Kiểm tra phản hồi 200 OK từ Backend.
2. **Kiểm tra luồng Quên mật khẩu cũ qua OTP trong Profile**:
   - Bấm chuyển sang "Quên mật khẩu cũ / Xác thực OTP".
   - Bấm "Gửi mã OTP qua Email" ➔ Kiểm tra log backend / hòm thư nhận mã 6 số.
   - Nhập mã OTP 6 số + Mật khẩu mới ➔ Bấm xác nhận ➔ Kiểm tra mật khẩu được cập nhật thành công vào CSDL.
   - Đăng xuất và đăng nhập lại bằng mật khẩu mới để kiểm chứng tính toàn vẹn.
