# Walkthrough: Tích hợp tính năng Hủy đơn hàng (Cancel Order)

## 1. Tóm tắt giải pháp & Kết quả triển khai

### Backend API Contract:
- **Endpoint**: `POST /api/orders/CancelOrder?id={orderId}`
- **Quy tắc trạng thái**: Khách hàng chỉ có thể tự hủy các đơn hàng đang ở trạng thái **`PENDING` ("Chờ xác nhận")**.
- **Khi đơn `PROCESSING` ("Đang xử lý")**: Shop đã tiếp nhận và bắt đầu đóng gói, Backend từ chối hủy tự động. Do đó, Frontend cung cấp giải pháp hỗ trợ kết nối trực tiếp với Người bán qua tính năng Chat.

---

## 2. Các thay đổi mã nguồn đã thực hiện

### 1. Nâng cấp API Service (`src/services/orderService.ts`)
- Cập nhật hàm `cancelOrder(orderId, reason)` để gửi đúng query param `id={orderId}` lên `POST /api/orders/CancelOrder`.
- Bắt lỗi chi tiết từ Backend (khi mã lỗi HTTP 400 hoặc 403) để thông báo lý do chính xác cho người dùng.

### 2. Thêm nút "Hủy đơn" trên trang Danh sách (`src/pages/customer/MyOrdersPage.tsx`)
- **Đơn hàng `PENDING` ("Chờ xác nhận")**:
  - Xuất hiện nút **"Hủy đơn"** (màu đỏ viền) ngay cạnh nút "Xem chi tiết".
  - Bấm vào mở **Modal Hủy đơn hàng**:
    - Cung cấp danh sách lý do hủy mẫu tiện lợi.
    - Cảnh báo rõ ràng về việc hoàn trả tồn kho sách.
    - Khi bấm "Xác nhận hủy đơn", hệ thống gọi API và cập nhật trạng thái đơn sang `CANCELLED` theo thời gian thực (không cần tải lại trang).
    - Hiển thị Toast thông báo thành công.
- **Đơn hàng `PROCESSING` ("Đang xử lý")**:
  - Xuất hiện nút **"Yêu cầu hủy"** (màu xám nhạt).
  - Bấm vào mở **Modal hướng dẫn**: Giải thích đơn đang đóng gói kèm nút **"Nhắn tin cho Shop ngay"** để mở khung chat trực tiếp với người bán.

### 3. Đồng bộ trên trang Chi tiết đơn hàng (`src/pages/customer/OrderDetailPage.tsx`)
- Bổ sung nút **"Yêu cầu hủy"** cho đơn `PROCESSING` để mở modal hướng dẫn nhắn tin với Shop.
- Hiển thị thông báo lỗi chi tiết trong modal nếu việc hủy gặp sự cố.

### 4. Kết nối mở khung chat từ đơn hàng (`src/App.tsx`)
- Truyền callback `onOpenChat` vào `MyOrdersPage` và `OrderDetailPage` để kích hoạt ChatDrawer với shop của đơn hàng tương ứng.

---

## 3. Kết quả xác thực (Verification Results)

### Kiểm tra biên dịch (Vite Build)
```bash
npm run build
```
- Kết quả: **Thành công 100% (0 lỗi cú pháp, 0 lỗi TypeScript)**.
- Thời gian build: **924ms**.

### Kịch bản trải nghiệm người dùng:
1. **Đơn hàng Chờ xác nhận (`PENDING`)**:
   - Khách hàng bấm **"Hủy đơn"** -> Chọn lý do -> Bấm xác nhận -> Đơn hàng chuyển sang tab **"Đã hủy"** ngay lập tức.
2. **Đơn hàng Đang xử lý (`PROCESSING`)**:
   - Khách hàng bấm **"Yêu cầu hủy"** -> Xem hướng dẫn -> Bấm **"Nhắn tin cho Shop ngay"** -> Mở khung chat trực tiếp với Shop để người bán giữ lại hàng.
