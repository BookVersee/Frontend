# Kế Hoạch Tái Cấu Trúc Giao Diện Hồ Sơ Cá Nhân (Profile Dashboard)

Tài liệu này đề xuất phương án tái cấu trúc giao diện trang [ProfilePage.tsx](file:///Users/nguyenvanminhtam/Frontend/src/pages/customer/ProfilePage.tsx) từ dạng cuộn dọc dồn dập (3 khối lớn xếp chồng lên nhau) sang mô hình **Dashboard Quản Trị Tài Khoản Hiện Đại** với 3 phân hệ trang riêng biệt.

---

## 1. Mục Tiêu & Vấn Đề Cần Giải Quyết

### Vấn đề hiện tại
- Hiện tại toàn bộ:
  1. *Thông tin cá nhân & Địa chỉ nhận hàng*
  2. *Đổi mật khẩu tài khoản (truyền thống + OTP)*
  3. *Lịch sử biến động dòng tiền & ví hoàn tiền*
  đều bị xếp chồng trên cùng một màn hình bên phải.
- Giao diện quá dài, nhiều form và nút bấm cạnh tranh sự chú ý, người dùng bị ngợp thông tin và khó nhận diện mục tiêu chính.

### Mục tiêu thiết kế
Tổ chức lại trang Hồ sơ cá nhân theo mô hình **Dashboard với Thanh Điều Hướng (Sidebar Navigation Tab)** chuyên nghiệp:
- **Tab 1: Hồ sơ cá nhân (`profile`)**: Tập trung cập nhật Họ tên, Số điện thoại, Email, Địa chỉ nhận hàng GHN và quy trình Đăng ký mở gian hàng (dành cho Customer).
- **Tab 2: Ví & Biến động dòng tiền (`transactions`)**: Tập trung quản lý số dư ví hoàn tiền, thống kê chi tiêu/tiền hoàn, bộ lọc và danh sách lịch sử giao dịch.
- **Tab 3: Mật khẩu & Bảo mật (`security`)**: Tập trung vào tính năng đổi mật khẩu (nhớ mật khẩu cũ hoặc xác thực OTP email), bảo mật tài khoản Google, và khu vực nguy hiểm (hủy/xóa tài khoản).

---

## 2. Thiết Kế Kiến Trúc Giao Diện Mới (UI/UX Architecture)

### 📌 Cột Trái: Sidebar Dashboard Menu
- **User Mini Profile**: Avatar lớn, Họ tên, Email, Badge phân quyền (`CUSTOMER` / `SHOP` / `ADMIN` / `DELIVER`).
- **Navigation Menu Tabs** (Có active state highlight, icon sinh động, badge thông báo):
  1. 👤 **Hồ sơ cá nhân** (*Thông tin tài khoản & địa chỉ nhận hàng*)
  2. 💳 **Biến động dòng tiền** (*Số dư ví, lịch sử thanh toán & hoàn tiền*)
  3. 🛡️ **Mật khẩu & Bảo mật** (*Đổi mật khẩu qua OTP & quản lý tài khoản*)
- **Quick Stat Mini-Widget**: Hiển thị nhanh số dư ví hoàn tiền hiện tại kèm nút tắt dẫn nhanh sang Tab 2.
- **Nút hành động nhanh**: Nút quay lại Mua sắm (Trang chủ) / Đăng xuất.

---

### 📌 Cột Phải: Nội Dung Độc Lập Theo Từng Tab

```
+-----------------------------------------------------------------------------------+
|  [Sidebar Trái]                     |  [Khu Vực Nội Dung Chính - Cột Phải]        |
|  - Avatar & Tên người dùng          |                                             |
|  - Menu:                            |  Tiêu đề phân hệ & Mô tả hướng dẫn ngắn gọn |
|    [👤 Hồ sơ cá nhân]       (Active)|  -----------------------------------------  |
|    [💳 Biến động dòng tiền]         |                                             |
|    [🛡️ Mật khẩu & Bảo mật]          |  (Chỉ hiển thị DUY NHẤT nội dung của Tab    |
|                                     |   đang chọn, giao diện thoáng đãng, tập     |
|  - Widget: Số dư ví hoàn tiền       |   trung tối đa vào tác vụ người dùng)       |
+-----------------------------------------------------------------------------------+
```

#### Chi tiết từng phân hệ Tab:
1. **Phân hệ 1: Hồ sơ cá nhân (`profile`)**:
   - Header: *Thông tin cá nhân & Địa chỉ giao nhận*.
   - Form chỉnh sửa: Họ và tên, Email, Số điện thoại, Địa chỉ giao hàng mặc định (tự động tính cước GHN).
   - Nút *"Lưu thay đổi hồ sơ"*.
   - Khối *"Trở thành Nhà Bán Hàng"* (Đăng ký mở gian hàng Shop) chỉ hiển thị gọn gàng tại đây.

2. **Phân hệ 2: Ví & Biến động dòng tiền (`transactions`)**:
   - Header: *Ví thanh toán & Lịch sử dòng tiền*.
   - 3 Thẻ thống kê số liệu trực quan:
     - 💳 **Số dư ví hoàn tiền**: Số tiền hiện có, nút nạp/rút hoặc cập nhật.
     - ↗️ **Tổng chi tiêu mua hàng**: Tổng số tiền đã thanh toán trực tuyến/COD.
     - ↙️ **Tổng tiền hoàn khiếu nại**: Số tiền đã được bồi hoàn thành công.
   - Thanh công cụ: Bộ lọc trạng thái (`Tất cả`, `Thanh toán`, `Hoàn tiền`) + Ô tìm kiếm mã giao dịch / mã đơn hàng + Nút làm mới.
   - Danh sách chi tiết các giao dịch (Badge trạng thái, thời gian, số tiền, chi tiết hóa đơn).

3. **Phân hệ 3: Mật khẩu & Bảo mật (`security`)**:
   - Header: *Trung tâm Bảo mật & Mật khẩu*.
   - Card Đổi mật khẩu tài khoản:
     - Chế độ 1: *Đổi bằng mật khẩu cũ* (với thước đo độ mạnh mật khẩu).
     - Chế độ 2: *Quên mật khẩu cũ? (Xác thực qua OTP Email)* với bộ đếm ngược 60s và mã 6 số.
     - Luồng thiết lập mật khẩu cho tài khoản Google qua OTP Email.
   - Card Khu vực nguy hiểm (Danger Zone):
     - Yêu cầu hủy / xóa tài khoản vĩnh viễn (kèm modal xác nhận gõ chữ).

---

## User Review Required

> [!IMPORTANT]
> - Thiết kế này giữ nguyên 100% logic và các API backend hiện có (không làm mất bất kỳ dữ liệu nào), chỉ sắp xếp lại luồng hiển thị thành 3 trang con (tabs) giúp màn hình cực kỳ thoáng, trực quan và chuyên nghiệp như các sàn TMĐT lớn.
> - Mặc định khi vào Hồ sơ thì chọn luôn tab **"Hồ sơ cá nhân"**, đồng thời có nút bấm nhanh xem ví để chuyển thẳng sang tab dòng tiền.

---

## Proposed Changes

### Frontend Customer Profile Component

#### [MODIFY] [ProfilePage.tsx](file:///Users/nguyenvanminhtam/Frontend/src/pages/customer/ProfilePage.tsx)
- Thêm state `dashboardTab: "profile" | "transactions" | "security"` (mặc định: `"profile"`).
- Tái cấu trúc thanh Sidebar bên trái với menu tab bấm chuyển mượt mà.
- Phân tách 3 khối nội dung tương ứng vào từng tab riêng biệt, loại bỏ tình trạng nhồi nhét cuộn dọc vô tận.
- Bổ sung hiệu ứng chuyển tab mượt mà (`transition-all`, `animate-in fade-in-50`).

---

## Verification Plan

### Manual Verification
1. Mở trang Hồ sơ cá nhân: Kiểm tra xem giao diện đã chia thành Sidebar bên trái và nội dung tương ứng bên phải.
2. Kiểm tra click chuyển đổi giữa 3 tabs:
   - Tab 1: Chỉ hiện form thông tin cá nhân & form đăng ký Shop.
   - Tab 2: Chỉ hiện thống kê ví & bảng lịch sử dòng tiền.
   - Tab 3: Chỉ hiện phần đổi mật khẩu qua OTP/mật khẩu cũ & hủy tài khoản.
3. Kiểm tra các chức năng: Lưu thông tin cá nhân, Đổi mật khẩu qua OTP, Tìm kiếm/Lọc dòng tiền vẫn hoạt động chính xác 100%.
