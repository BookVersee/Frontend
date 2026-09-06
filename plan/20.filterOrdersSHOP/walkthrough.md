# Walkthrough: Triển khai Bộ lọc, Tabs Trạng thái & Tìm kiếm Đơn hàng cho Kênh Người Bán

## 1. Mục tiêu đã thực hiện

Trước đây, tại tab **Quản lý đơn hàng** của Cửa hàng ([ShopDashboardPage.tsx](file:///Users/nguyenvanminhtam/Frontend/src/pages/shop/ShopDashboardPage.tsx)), toàn bộ đơn hàng (cả đơn đã giao, đang giao, đã hủy...) bị liệt kê chung thành một danh sách dài vô tận, không có công cụ tìm kiếm và lọc trạng thái.

Chúng tôi đã nâng cấp toàn diện giao diện Quản lý đơn hàng theo chuẩn sàn Thương mại Điện tử (Shopee / Tiki Seller Center).

---

## 2. Các tính năng & Cải tiến đã bổ sung

### 🔹 A. Thanh Tab phân loại trạng thái đơn hàng (Lifecycle Status Tabs)
Thanh tab ngang bo góc tinh tế với badge đếm số lượng thời gian thực cho từng trạng thái:
- **Tất cả**: Hiển thị toàn bộ đơn hàng của shop (`{orders.length}`).
- **Chờ xác nhận**: Đơn mới cần shop bấm *"Xác nhận đóng gói"* (`PENDING`) — có badge cam nổi bật khi có đơn cần xử lý.
- **Đang đóng gói**: Đơn shop đang chuẩn bị sách để bấm *"Bàn giao shipper GHN"* (`PROCESSING`).
- **Đang giao GHN**: Gom các đơn đã có mã vận đơn GHN và đang vận chuyển (`SHIPPING`, `DELIVERING`).
- **Đã giao**: Đơn hoàn tất giao thành công đến tay khách hàng (`DELIVERED`).
- **Đã hủy / Hoàn**: Đơn đã hủy, giao thất bại hoặc hoàn hàng (`CANCELLED`, `FAILED`, `RETURNED`).

### 🔹 B. Thanh công cụ tìm kiếm tức thì đa năng (Omni Search Bar)
- Tích hợp ô tìm kiếm tức thì theo thời gian thực (không cần bấm enter):
  - Tìm theo **Mã đơn hàng** (hỗ trợ cả UUID hoặc mã hiển thị `#4813352D`).
  - Tìm theo **Tên khách hàng**.
  - Tìm theo **Số điện thoại nhận hàng**.
  - Tìm theo **Địa chỉ giao hàng**.
  - Tìm theo **Mã vận đơn GHN** (VD: `LQK...`).
  - Tìm theo **Tên tựa sách** nằm trong đơn hàng.
- Nút bấm `X` xóa nhanh từ khóa tìm kiếm trong 1 click.

### 🔹 C. Bộ lọc bổ sung & Sắp xếp (Secondary Filters & Sorting)
- **Phương thức thanh toán**:
  - *Tất cả thanh toán*
  - *Thanh toán COD*
  - *Trực tuyến (VNPAY/MoMo)*
- **Tiêu chí sắp xếp**:
  - *Mới nhất trước* (Mặc định)
  - *Cũ nhất trước*
  - *Giá trị: Cao → Thấp*
  - *Giá trị: Thấp → Cao*

### 🔹 D. Tương tác mượt mà & Giao diện Trạng thái Trống (Empty State)
- Hiển thị số lượng đối ứng: `Hiển thị X / Y đơn hàng`.
- Nút **"Xóa bộ lọc"** (`RotateCcw`) xuất hiện khi có bất kỳ điều kiện lọc nào đang được kích hoạt để shop quay về danh sách mặc định chỉ với 1 thao tác.
- Giao diện **Empty State** lịch sự, rõ ràng khi không có kết quả phù hợp với điều kiện tìm kiếm.

---

## 3. Kết quả Kiểm thử (Verification)

- **Biên dịch Vite**:
  ```bash
  npm run build
  ```
  Kết quả: `✓ built in 825ms` — **0 lỗi, 0 cảnh báo TypeScript**.
- **Kiểm tra Lint**:
  ```bash
  npm run lint
  ```
  Kết quả: **Pass hoàn toàn 100%**.
- **Tuân thủ quy tắc dự án**: Không chỉnh sửa bất kỳ file nào trong thư mục `Backend/`.
