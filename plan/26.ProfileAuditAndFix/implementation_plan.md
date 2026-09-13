# Kế Hoạch Phân Tích & Chuẩn Hóa Nghiệp Vụ Hồ Sơ Cá Nhân (Profile Dashboard)

Tài liệu này phân tích chi tiết tính xác thực của dữ liệu trên màn hình Hồ sơ cá nhân, chỉ ra các thông tin thừa, dữ liệu ảo (đặc biệt là **Ví hoàn tiền 500.000 đ**) không đúng với nghiệp vụ sàn BookVerse, và đề xuất phương án chuẩn hóa 100% bám sát Backend API hiện tại.

---

## 1. Kết Quả Phân Tích Nghiệp Vụ & Dữ Liệu Backend

### ❓ Câu hỏi 1: Backend có hỗ trợ "Ví hoàn tiền" không hay là dữ liệu ảo?
> [!CAUTION]
> **Khẳng định 100%: Backend hiện tại KHÔNG CÓ Ví tiền (Wallet / Balance) cho người dùng! Con số "500.000 đ" hoàn toàn là DỮ LIỆU ẢO (MOCK DATA).**
> - **Cơ sở dữ liệu Backend** (`AppDbContext.cs`): Không hề có bảng `Wallet`, `UserWallet` hay trường `Balance` trong bảng `Users`.
> - **Mô hình DTO** (`UserResponse.cs`): Chỉ có `Id, Username, Email, FullName, Phone, Address, Role, Status, CreatedAt`.
> - **Nghiệp vụ thực tế của sàn BookVerse**:
>   - Khách mua sách thanh toán trực tuyến qua cổng **MoMo Sandbox** hoặc tiền mặt **COD**.
>   - Khi đơn hàng phát sinh khiếu nại và được duyệt hoàn tiền (`ReturnStatus = REFUNDED`), hệ thống gọi API `PaymentService.ProcessRefundAsync` để **hoàn tiền trực tiếp về tài khoản MoMo / tài khoản ngân hàng của khách**, chứ sàn KHÔNG giữ tiền của khách trong ví ảo nội bộ.
>   - Khách hàng không có nghiệp vụ nạp tiền, rút tiền hay dùng số dư ví BookVerse để mua sách.
> - **Nguyên nhân xuất hiện trên giao diện**:
>   - Trong [ProfilePage.tsx](file:///Users/nguyenvanminhtam/Frontend/src/pages/customer/ProfilePage.tsx), code đang viết `{fmt(user?.balance || 500000)}`. Do `user.balance` không có trong API backend trả về, nó luôn rơi vào fallback `500000`, tạo cảm giác giả rằng người dùng đang có 500.000 đ trong tài khoản mà không thể rút hay tiêu.

---

### 🔎 Câu hỏi 2: Những thông tin gì đang liệt kê bị THỪA hoặc SAI LỆCH NGHIỆP VỤ?

| STT | Vị trí trên giao diện | Thông tin hiện tại | Đánh giá & Sai lệch nghiệp vụ | Phương án khắc phục |
| :--- | :--- | :--- | :--- | :--- |
| **1** | **Sidebar trái** | Thẻ *"VÍ HOÀN TIỀN: 500.000 đ"* với mô tả *"Tích lũy tiền bồi hoàn khiếu nại..."* | **Dữ liệu ảo 100%**. Sàn không có ví tiền lưu ký. Gây hoang mang cho người dùng vì không rút hay chi tiêu được. | **Xóa bỏ hoàn toàn thẻ Ví ảo**. Thay thế bằng **Thống kê hoạt động thực tế** (Ví dụ: Trạng thái tài khoản, Ngày tham gia, Lối tắt đến *Đơn hàng của tôi*). |
| **2** | **Menu Tab 2** | Tên tab: *"Biến động dòng tiền"* & phụ đề *"Ví hoàn tiền & giao dịch"* | Tên gọi mang tính ví điện tử/ngân hàng, không phù hợp sàn TMĐT sách. | Đổi thành **"Lịch sử giao dịch"** (hoặc *"Thanh toán & Hoàn tiền"*). |
| **3** | **Tab 2 (Giao dịch)** | Fallback mock `INITIAL_TRANSACTIONS` (kèm đơn hàng 1001 ảo 199.000 đ) | Khi API lỗi hoặc user mới chưa mua hàng, `authService.ts` lại nạp dữ liệu giả. | **Xóa sạch mock data fallback**. Hiển thị giao diện Empty State thực tế: *"Bạn chưa phát sinh giao dịch thanh toán hoặc hoàn tiền nào"*. |
| **4** | **Tab 2 (Giao dịch)** | Logic nhận diện hoàn tiền trong `authService.ts`: `tx.transactionType === "IN"` bị coi là refund | Trong Backend, thanh toán MoMo thành công ghi nhận `ReferenceType.ORDER_PAYMENT` với `TransactionType.IN`. Logic cũ coi `IN` là refund khiến đơn thanh toán bị phân loại nhầm thành hoàn tiền! | Sửa logic: Chỉ khi `referenceType === "REFUND"` mới là Hoàn tiền, `ORDER_PAYMENT` là Thanh toán đơn hàng. |
| **5** | **Tab 2 (Giao dịch)** | Bộ lọc và từ ngữ: Có chữ "giao dịch ví" | Hệ thống chỉ có giao dịch thanh toán MoMo/COD và hoàn tiền MoMo. | Loại bỏ chữ "ví", chuẩn hóa 2 loại: **Thanh toán đơn hàng** & **Tiền hoàn khiếu nại**. |
| **6** | **Tab 3 (Bảo mật)** | Banner thông báo màu xanh tiếng Anh: `Request processed successfully` | Do Backend trả về `message: "Request processed successfully."` mặc định, Frontend ưu tiên lấy message tiếng Anh này hiển thị cho người dùng. | Chuẩn hóa thông báo tiếng Việt thân thiện: *"Mã xác thực OTP đã được gửi về Gmail của bạn..."*. |
| **7** | **Tab 3 (Bảo mật)** | Người dùng đăng nhập bằng Google OAuth bị hiển thị ngay lập tức form OTP đổi mật khẩu choán màn hình | Người dùng Google đăng nhập tiện lợi bằng nút Google. Việc tự động bung form OTP tạo cảm giác tài khoản đang bị lỗi hoặc bắt buộc phải tạo mật khẩu. | Hiển thị Card bảo mật Google trang trọng: Huy hiệu *"Đã bảo mật với Google"*. Bổ sung nút bấm *"Thiết lập thêm mật khẩu cá nhân"* nếu người dùng thực sự có nhu cầu mở form. |
| **8** | **Tab 1 (Hồ sơ)** | Địa chỉ giao hàng mặc định fallback: `"123 Nguyễn Huệ, Quận 1, TP.HCM"` | Hardcode trong `useState(user?.address || "123 Nguyễn Huệ...")` khiến tài khoản mới ở Hà Nội cũng bị gán địa chỉ TP.HCM ảo. | Để trống `user?.address || ""` và dùng placeholder hướng dẫn người dùng nhập đúng địa chỉ để tính cước GHN chính xác. |

---

## 2. User Review Required

> [!IMPORTANT]
> 1. **Loại bỏ khái niệm Ví hoàn tiền**: Chúng tôi sẽ xóa hoàn toàn thẻ "Ví hoàn tiền: 500.000 đ" và từ ngữ "ví" trên trang Hồ sơ. Bạn có đồng ý thay thế widget bên trái bằng **Thẻ tóm tắt hoạt động** (Ngày tham gia, Email xác thực, liên kết nhanh tới "Đơn hàng của tôi") không?
> 2. **Chuyển Tab 2 thành "Lịch sử thanh toán & Hoàn tiền"**: Khách hàng chỉ xem lịch sử các lần thanh toán đơn sách (MoMo/COD) và tiền hoàn khiếu nại (MoMo) thực tế từ API `/api/user/GetMyTransactions`.
> 3. **Tài khoản Google**: Giữ lại tính năng thiết lập mật khẩu qua OTP email nhưng ẩn form mặc định, chỉ mở ra khi người dùng chủ động bấm *"Tạo thêm mật khẩu riêng"*.

---

## 3. Proposed Changes

### Component: Frontend Customer Profile & AuthService

#### [MODIFY] [ProfilePage.tsx](file:///Users/nguyenvanminhtam/Frontend/src/pages/customer/ProfilePage.tsx)
- **Sidebar trái**:
  - Xóa bỏ thẻ mini widget `Ví hoàn tiền 500.000 đ`.
  - Thay bằng thẻ **"Thông tin thành viên & Đơn hàng"**: Hiển thị ngày tham gia, vai trò, trạng thái tài khoản, và nút tắt dẫn nhanh sang trang *Đơn hàng của tôi*.
  - Đổi tên tab thứ hai từ *"Biến động dòng tiền / Ví hoàn tiền & giao dịch"* thành *"Lịch sử thanh toán"* / *"Lịch sử thanh toán & Hoàn tiền"*.
- **Tab 1 (Hồ sơ cá nhân)**:
  - Bỏ fallback địa chỉ ảo `"123 Nguyễn Huệ, Quận 1, TP.HCM"`, trả về giá trị thực từ `user?.address`.
- **Tab 2 (Lịch sử thanh toán & Hoàn tiền)**:
  - Đổi tiêu đề và mô tả: *"Lịch sử thanh toán & Hoàn tiền - Theo dõi các giao dịch thanh toán đơn hàng MoMo/COD và tiền bồi hoàn khiếu nại"*.
  - 3 Thẻ thống kê: *Tổng tiền thanh toán đơn hàng*, *Tổng tiền hoàn khiếu nại*, *Số giao dịch phát sinh*.
  - Không có số dư ví ảo.
- **Tab 3 (Mật khẩu & Bảo mật)**:
  - Khắc phục lỗi hiển thị thông báo tiếng Anh `Request processed successfully`, hiển thị tiếng Việt chuẩn.
  - Với tài khoản Google: Hiển thị card trạng thái *"Tài khoản liên kết Google OAuth an toàn"*. Chỉ khi người dùng bấm *"Tạo thêm mật khẩu Email & Mật khẩu"* thì mới bung form OTP nhập 6 số.

#### [MODIFY] [authService.ts](file:///Users/nguyenvanminhtam/Frontend/src/services/authService.ts)
- Sửa hàm `getUserTransactions()`:
  - Bỏ hoàn toàn fallback `INITIAL_TRANSACTIONS`. Nếu lỗi hoặc không có dữ liệu, trả về mảng rỗng `[]`.
  - Chuẩn hóa phân loại `isRefund`: Chỉ xem là hoàn tiền khi `tx.referenceType === "REFUND"`. `tx.referenceType === "ORDER_PAYMENT"` là thanh toán đơn hàng.
- Sửa hàm `sendPasswordOtp`:
  - Ưu tiên hiển thị tiếng Việt: nếu `res.data?.message` là `"Request processed successfully."`, lấy nội dung chi tiết trong `res.data?.data` hoặc chuỗi tiếng Việt rõ ràng.

---

## 4. Verification Plan

### Automated Tests
- Kiểm tra toàn bộ codebase bằng linter:
  ```bash
  npm run lint
  ```
- Kiểm tra biên dịch TypeScript và đóng gói Vite:
  ```bash
  npm run build
  ```

### Manual Verification
1. **Kiểm tra Sidebar**:
   - Xác nhận thẻ "Ví hoàn tiền 500.000 đ" đã biến mất hoàn toàn.
   - Thẻ thông tin tài khoản hiển thị ngày tham gia và nút liên kết tới *Đơn hàng của tôi*.
2. **Kiểm tra Tab Lịch sử thanh toán**:
   - Nếu tài khoản chưa có giao dịch: Hiển thị Empty State trung thực, không còn giao dịch ảo 199k của `INITIAL_TRANSACTIONS`.
   - Các chỉ số thống kê phản ánh đúng số liệu đơn hàng và hoàn tiền thực.
3. **Kiểm tra Tab Mật khẩu**:
   - Với tài khoản Google: Giao diện gọn gàng, không còn ép bung form OTP và không còn chữ tiếng Anh `Request processed successfully`.
4. **Kiểm tra Tab Hồ sơ**:
   - Địa chỉ không còn bị gán cứng ảo `"123 Nguyễn Huệ..."`.
