# Walkthrough: Chuẩn Hóa Nghiệp Vụ Hồ Sơ & Xóa Bỏ Ví Ảo 500k

Chúng tôi đã hoàn thành việc rà soát và khắc phục toàn bộ các thông tin thừa, dữ liệu ảo không đúng với nghiệp vụ sàn BookVerse trên màn hình [ProfilePage.tsx](file:///Users/nguyenvanminhtam/Frontend/src/pages/customer/ProfilePage.tsx).

---

## 1. Các Vấn Đề Đã Được Khắc Phục

### A. Loại Bỏ Hoàn Toàn Thẻ "Ví Hoàn Tiền 500.000 đ" (Dữ Liệu Ảo)
- **Vấn đề trước đây**: Thẻ mini widget bên trái hiển thị `"VÍ HOÀN TIỀN: 500.000 đ"` và dòng chữ *"Tích lũy tiền bồi hoàn khiếu nại & số dư tài khoản"*. Số tiền này được lấy từ fallback mock data (`user?.balance || 500000`).
- **Thực tế hệ thống**: Backend không hề có ví tiền lưu ký, không có bảng `Wallet`. Khách hàng thanh toán qua MoMo/COD và khi có hoàn tiền khiếu nại thì tiền được hoàn trực tiếp về tài khoản MoMo / ngân hàng của khách.
- **Thay đổi**:
  - Xóa bỏ 100% thẻ Ví ảo và các thông tin liên quan đến ví.
  - Thay thế bằng **Thẻ Tổng Quan Tài Khoản**: Hiển thị trạng thái tài khoản kích hoạt, ngày tham gia BookVerse, giải thích phương thức thanh toán an toàn, và nút tắt tiện lợi **"Quản lý Đơn hàng của tôi"** dẫn thẳng đến trang đơn hàng.

---

### B. Chuẩn Hóa Phân Hệ "Lịch Sử Giao Dịch" (Tab 2)
- **Thay đổi tên gọi & mô tả**:
  - Tên Tab chuyển từ *"Biến động dòng tiền / Ví hoàn tiền & giao dịch"* sang **"Lịch sử giao dịch - Thanh toán & Hoàn tiền"**.
  - Tiêu đề chính: *"Lịch sử thanh toán & Hoàn tiền - Theo dõi chi tiết các giao dịch thanh toán đơn hàng MoMo/COD và các khoản bồi hoàn khiếu nại"*.
- **3 Thẻ thống kê tài chính**:
  - ↗️ **Tổng thanh toán đơn**: Tổng tiền đã thanh toán cho các đơn hàng đã đặt.
  - ↙️ **Tổng tiền hoàn khiếu nại**: Tổng tiền đã được bồi hoàn từ các yêu cầu khiếu nại/đổi trả.
  - 📑 **Tổng số giao dịch**: Số lần phát sinh giao dịch thực tế.
- **Xóa bỏ fallback Mock Data**:
  - Trong [authService.ts](file:///Users/nguyenvanminhtam/Frontend/src/services/authService.ts), hàm `getUserTransactions()` đã xóa bỏ đoạn fallback về `INITIAL_TRANSACTIONS` (giao dịch ảo 1001 với 199k).
  - Khi chưa có giao dịch, hiển thị Empty State trung thực: *"Chưa có giao dịch thanh toán hoặc hoàn tiền nào."*
- **Sửa lỗi phân loại giao dịch (Bug Fix)**:
  - Logic cũ coi `transactionType === "IN"` là hoàn tiền. Tuy nhiên Backend ghi nhận thanh toán MoMo thành công là `ReferenceType.ORDER_PAYMENT` với `TransactionType.IN`.
  - Logic mới chuẩn xác 100%: Chỉ khi `referenceType === "REFUND"` mới là Hoàn tiền khiếu nại, còn `ORDER_PAYMENT` là Thanh toán đơn hàng.

---

### C. Xử Lý Giao Diện Tài Khoản Google OAuth (Tab 3)
- **Trước đây**: Khi đăng nhập bằng Google, màn hình lập tức bung form OTP đổi mật khẩu choán màn hình kèm thông báo tiếng Anh `Request processed successfully`.
- **Sau khi chuẩn hóa**:
  - Hiển thị Card bảo mật Google trang nhã: Huy hiệu xanh *"An toàn"*, thông báo tài khoản được bảo vệ bởi lớp bảo mật một chạm của Google và không bắt buộc phải có mật khẩu riêng.
  - Bổ sung nút bấm **"Thiết lập thêm mật khẩu riêng (Email & Mật khẩu)"**. Chỉ khi người dùng chủ động bấm nút thì form OTP mới mở ra, kèm nút *"Thu gọn"* nếu không muốn thao tác nữa.
  - Chuẩn hóa thông báo tiếng Việt, loại bỏ hoàn toàn dòng chữ tiếng Anh mặc định của Backend.

---

### D. Xóa Bỏ Địa Chỉ Nhận Hàng Mặc Định Ảo (Tab 1)
- **Trước đây**: Khởi tạo state bằng `user?.address || "123 Nguyễn Huệ, Quận 1, TP.HCM"`. Người dùng mới ở tỉnh khác cũng bị gán địa chỉ giả.
- **Sau khi chuẩn hóa**: Để trống `user?.address || ""` và thêm placeholder hướng dẫn cụ thể để người dùng nhập địa chỉ chuẩn xác cho việc tính cước giao vận GHN.

---

## 2. Kết Quả Kiểm Thử & Xác Minh
- **Linter**: `npm run lint` -> **Passed** (0 lỗi, 0 warning).
- **Production Build**: `npm run build` -> **Passed** (1922 modules, hoàn tất trong 873ms).
- **Backend Integrity**: Tuân thủ nghiêm ngặt **RULE 1**, không thay đổi bất kỳ file nào trong `Backend/`.
