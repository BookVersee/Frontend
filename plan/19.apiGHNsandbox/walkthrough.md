# Walkthrough: Sửa lỗi 400 Bad Request và Triển khai Giao diện Bàn giao GHN & Từ chối đơn hàng

## 1. Tổng quan & Nguyên nhân gốc rễ (Root Cause)

1. **Lỗi HTTP 400 Bad Request (`Invalid order status: SHIPPED`)**:
   - Trong enum `OrderStatus.cs` của Backend C#, trạng thái đơn hàng bao gồm:
     `PENDING`, `PAID`, `PROCESSING`, `SHIPPING`, `DELIVERING`, `DELIVERED`, `CANCELLED`, `FAILED`, `APPROVED`.
   - Backend **không có** giá trị `"SHIPPED"` mà dùng `"SHIPPING"`.
   - Frontend trước đây gửi chuỗi `"SHIPPED"`, dẫn đến `Enum.TryParse<OrderStatus>` tại Backend thất bại và ném lỗi 400.
2. **Thiếu Modal Bàn giao GHN & Nhập dữ liệu giao vận**:
   - Trước đây nút *"Bàn giao shipper GHN"* gọi trực tiếp `updateOrderStatus(order.id, "SHIPPED")` thay vì gọi đúng API tích hợp GHN của hệ thống: `POST /api/shipping/CreateGhnOrder`.
   - Giao diện thiếu hoàn toàn form nhập **Cân nặng đơn hàng (Weight)**, **Lưu ý xem hàng GHN (`requiredNote`)**, và **Ghi chú giao hàng (`notes`)**.
3. **Thiếu Modal Từ chối / Hủy đơn hàng**:
   - Nút *"Từ chối"* trước đây chuyển thẳng sang `CANCELLED` mà không có giao diện chọn lý do (`reason`) hoặc ghi chú thông báo cho khách hàng.

---

## 2. Các thay đổi đã thực hiện

### A. Tích hợp API GHN & Dịch vụ (Services & Types)
- [src/types/index.ts](file:///Users/nguyenvanminhtam/Frontend/src/types/index.ts):
  - Mở rộng `OrderStatus`: Bổ sung `"SHIPPING"`, `"DELIVERING"`, `"APPROVED"`, `"FAILED"`.
- [src/services/shippingService.ts](file:///Users/nguyenvanminhtam/Frontend/src/services/shippingService.ts) *(Mới)*:
  - Triển khai `shippingService.createGhnOrder(orderId, requiredNote)` gọi đúng endpoint `POST /api/shipping/CreateGhnOrder`.
- [src/services/shopService.ts](file:///Users/nguyenvanminhtam/Frontend/src/services/shopService.ts):
  - Nâng cấp hàm `updateOrderStatus(orderId, status, notes, weight?, reason?)`:
    - Tự động chuẩn hóa `"SHIPPED"` $\rightarrow$ `"SHIPPING"`.
    - Truyền `weight`, `note`, `reason` lên Backend DTO.
    - Bắt và trích xuất thông điệp lỗi chi tiết từ Backend phản hồi.

### B. Nâng cấp Component Modal & Tiện ích trạng thái
- [src/components/common/Modal.tsx](file:///Users/nguyenvanminhtam/Frontend/src/components/common/Modal.tsx):
  - Hỗ trợ prop `footer?: React.ReactNode` để hiển thị các nút hành động đồng bộ và chuyên nghiệp.
  - Thiết lập `isOpen = true` làm mặc định an toàn khi modal được render theo điều kiện.
- [src/utils/status.tsx](file:///Users/nguyenvanminhtam/Frontend/src/utils/status.tsx):
  - Thêm mapping trạng thái `SHIPPING`, `DELIVERING`, `APPROVED`, `FAILED` vào `orderStatusInfo` với nhãn tiếng Việt và icon trực quan.

### C. Giao diện Cửa hàng: Modal Bàn giao GHN & Modal Từ chối đơn
- [src/pages/shop/ShopDashboardPage.tsx](file:///Users/nguyenvanminhtam/Frontend/src/pages/shop/ShopDashboardPage.tsx):
  - **Modal Bàn giao GHN Express**:
    - Hiển thị tóm tắt thông tin đơn hàng, khách hàng, số lượng sách và địa chỉ nhận hàng.
    - Cho phép nhập **Cân nặng đơn hàng (Gram)** với các phím bấm gợi ý nhanh: `300g (1 cuốn)`, `500g (chuẩn)`, `1000g (2-3 cuốn)`, `2000g (bộ sách)`.
    - Lựa chọn quy định kiểm tra hàng GHN: `CHOXEMHANGKHONGTHU` (Cho xem hàng không cho thử - khuyên dùng), `CHOTHOIGIAN` (Cho thử hàng), `KHONGCHOXEMHANG` (Không cho xem hàng).
    - Ô nhập ghi chú đóng gói / giao hàng cho shipper GHN.
    - Gọi tuần tự: cập nhật thông số đơn hàng $\rightarrow$ kích hoạt tạo đơn vận GHN Sandbox.
    - Hiển thị kết quả thành công với **Mã vận đơn GHN** và nút sao chép nhanh (Copy tracking code).
  - **Modal Từ chối / Hủy đơn hàng**:
    - Cảnh báo xác nhận từ chối đơn hàng.
    - Danh mục lý do từ chối chuẩn: *Hết hàng trong kho, Sách bị hư hỏng / lỗi in ấn, Không liên lạc được với khách hàng, Địa chỉ ngoài vùng phục vụ, Khách yêu cầu hủy...*
    - Ô nhập giải thích chi tiết gửi đến khách hàng.
  - **Cập nhật danh sách đơn hàng**:
    - Đơn `PROCESSING`: Nút *"Bàn giao shipper GHN"* mở Modal GHN, nút *"Hủy đơn"* mở Modal Từ chối.
    - Đơn `SHIPPING` hoặc `SHIPPED`: Hiển thị badge vận chuyển kèm **Mã vận đơn GHN** rõ ràng.

### D. Đồng bộ hiển thị Customer & Admin
- [src/pages/customer/MyOrdersPage.tsx](file:///Users/nguyenvanminhtam/Frontend/src/pages/customer/MyOrdersPage.tsx): Tab "Đang giao" hiển thị đầy đủ các đơn ở trạng thái `SHIPPING`, `SHIPPED`, `DELIVERING`.
- [src/pages/admin/AdminDashboardPage.tsx](file:///Users/nguyenvanminhtam/Frontend/src/pages/admin/AdminDashboardPage.tsx): Bộ lọc và biểu đồ phân bổ trạng thái gom đúng `SHIPPING` vào nhóm "Đang giao".

---

## 3. Kết quả Kiểm thử & Xác minh

- **Kiểm tra biên dịch dự án**:
  ```bash
  npm run build
  ```
  Kết quả: **Thành công 100%** (1922 modules transformed, built in 1.52s, 0 TypeScript / Lint errors).
- **Tuân thủ QUY TẮC DỰ ÁN**:
  - Toàn bộ thư mục `Backend/` giữ nguyên vẹn 100%, không chỉnh sửa bất kỳ file C# nào.
  - Frontend bám sát API Contract hiện có của Backend (`ShippingController`, `ShopController`, `OrderStatus`).
