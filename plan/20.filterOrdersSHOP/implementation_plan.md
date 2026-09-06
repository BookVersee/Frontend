# Kế Hoạch Triển Khai Bộ Lọc & Tìm Kiếm Đơn Hàng Cho Kênh Người Bán (Shop Dashboard)

Hiện tại, tại tab Quản lý đơn hàng của Cửa hàng (`tab === "orders"` trong [ShopDashboardPage.tsx](file:///Users/nguyenvanminhtam/Frontend/src/pages/shop/ShopDashboardPage.tsx)), toàn bộ đơn hàng (bao gồm đơn chờ duyệt, đơn đang giao, đơn đã hủy và đơn đã giao xong) đang bị liệt kê chung trong một danh sách dài vô tận. Điều này gây khó khăn lớn cho chủ shop khi cần tìm kiếm, kiểm soát tiến độ xử lý và bàn giao đơn hàng.

Kế hoạch này sẽ bổ sung hệ thống **Tabs trạng thái chuẩn sàn TMĐT (Shopee/Tiki Seller)**, **Thanh tìm kiếm tức thì đa năng**, cùng **Bộ lọc phương thức thanh toán và sắp xếp** giúp shop quản lý đơn hàng một cách trực quan, khoa học và nhanh chóng.

---

## User Review Required

> [!IMPORTANT]
> **Phân nhóm trạng thái đơn hàng (Lifecycle Status Tabs)**:
> Hệ thống sẽ phân chia danh sách đơn hàng thành 6 tabs chính có badge đếm số lượng thời gian thực:
> 1. **Tất cả**: Toàn bộ đơn hàng của shop (`ALL`).
> 2. **Chờ xác nhận**: Đơn mới khách vừa đặt cần shop xác nhận đóng gói (`PENDING`).
> 3. **Đang đóng gói**: Đơn đã nhận, đang chuẩn bị sách để bàn giao shipper GHN (`PROCESSING`).
> 4. **Đang giao**: Đơn đã xuất mã GHN và shipper đang vận chuyển (`SHIPPING`, `DELIVERING`).
> 5. **Đã giao**: Đơn giao thành công đến tay khách hàng (`DELIVERED`).
> 6. **Đã hủy / Thất bại**: Đơn shop từ chối, khách hủy hoặc giao thất bại (`CANCELLED`, `FAILED`, `RETURNED`).

---

## Proposed Changes

### Phân hệ Kênh Người Bán (Shop Dashboard)

#### [MODIFY] [ShopDashboardPage.tsx](file:///Users/nguyenvanminhtam/Frontend/src/pages/shop/ShopDashboardPage.tsx)

1. **Bổ sung State quản lý Tìm kiếm & Bộ lọc**:
   - `orderSearch`: Chuỗi tìm kiếm (Mã đơn hàng, Tên khách hàng, SĐT nhận hàng, Mã vận đơn GHN, Tựa sách).
   - `orderStatusFilter`: Tab trạng thái đang chọn (`"ALL" | "PENDING" | "PROCESSING" | "SHIPPING" | "DELIVERED" | "CANCELLED"`). Mặc định là `"ALL"`.
   - `orderPaymentFilter`: Bộ lọc thanh toán (`"ALL" | "COD" | "ONLINE"`).
   - `orderSortBy`: Tiêu chí sắp xếp (`"NEWEST" | "OLDEST" | "AMOUNT_DESC" | "AMOUNT_ASC"`).

2. **Xây dựng `filteredOrders` với `useMemo`**:
   - Tính toán số lượng đơn cho từng tab trạng thái:
     - `pendingCount`: Số đơn `PENDING` (hiển thị badge cam nổi bật cảnh báo shop cần xử lý).
     - `processingCount`: Số đơn `PROCESSING`.
     - `shippingCount`: Số đơn `SHIPPING` hoặc `DELIVERING`.
     - `deliveredCount`: Số đơn `DELIVERED`.
     - `cancelledCount`: Số đơn `CANCELLED` hoặc `FAILED` hoặc `RETURNED`.
   - Lọc đơn hàng theo tab trạng thái đang active.
   - Lọc theo từ khóa tìm kiếm (so khớp không phân biệt hoa thường với ID đơn, format code `#4813352D`, tên khách, SĐT, mã tracking GHN, tên sách trong giỏ).
   - Lọc theo phương thức thanh toán (`COD` vs `ONLINE`).
   - Sắp xếp theo ngày tạo hoặc tổng giá trị đơn hàng.

3. **Cải tiến giao diện Header của Card Đơn hàng**:
   - **Hàng 1: Tiêu đề & Công cụ tìm kiếm / Sắp xếp**:
     - Tiêu đề: *Quản lý đơn hàng ({filteredOrders.length} / {orders.length})*.
     - Ô input tìm kiếm có icon kính lúp `Search` và nút bấm `X` xóa nhanh từ khóa.
     - Dropdown chọn Phương thức thanh toán (`Tất cả`, `Khi nhận hàng (COD)`, `Trực tuyến (VNPAY/MoMo)`).
     - Dropdown sắp xếp (`Mới nhất`, `Cũ nhất`, `Giá trị: Cao đến thấp`, `Giá trị: Thấp đến cao`).
   - **Hàng 2: Thanh Tab Trạng thái (Scrollable Horizontal Tabs)**:
     - Thiết kế bo góc mềm mại, hiển thị số lượng đơn trong ngoặc của từng tab.
     - Tab active có nền màu sắc đồng bộ, hiệu ứng shadow tinh tế.
     - Nếu có bộ lọc đang áp dụng, hiển thị nút bấm *"Xóa bộ lọc"* để đưa về mặc định trong 1 click.

4. **Trạng thái Trống (Empty State)**:
   - Nếu tìm kiếm hoặc lọc không có kết quả: Hiển thị giao diện thông báo thân thiện *"Không tìm thấy đơn hàng nào phù hợp với bộ lọc"* kèm nút *"Xem tất cả đơn hàng"*.

---

## Verification Plan

### Automated Tests
- Kiểm tra tính tương thích Typescript và cú pháp Vite:
  ```bash
  npm run build
  ```
- Kiểm tra định dạng lint:
  ```bash
  npm run lint
  ```

### Manual Verification
1. **Kiểm tra chuyển Tab trạng thái**:
   - Nhấn vào tab **"Đang giao"**: Danh sách chỉ hiển thị các đơn đang giao qua GHN (như đơn `#4813352D`).
   - Nhấn vào tab **"Đã hủy"**: Chỉ hiển thị các đơn mang trạng thái Đã hủy.
   - Nhấn vào tab **"Chờ xác nhận"**: Kiểm tra các đơn mới đặt.
2. **Kiểm tra Tìm kiếm tức thì (Search)**:
   - Nhập mã đơn `#4813352D` hoặc `4813` $\rightarrow$ Đơn hàng tương ứng hiển thị ngay lập tức.
   - Nhập tên khách hàng `Nguyễn Văn An` hoặc tựa sách `Tuổi trẻ đáng giá bao nhiêu` $\rightarrow$ Kết quả lọc chính xác.
3. **Kiểm tra Bộ lọc Thanh toán & Sắp xếp**:
   - Lọc theo `COD` $\rightarrow$ Chỉ hiển thị đơn COD.
   - Sắp xếp theo `Giá trị: Cao đến thấp` $\rightarrow$ Đơn hàng có tổng tiền lớn nhất đứng đầu.
