# Kế hoạch kiểm tra và tích hợp tính năng Hủy đơn hàng (Cancel Order)

## 1. Kết quả kiểm tra Backend về API Hủy đơn hàng

### Backend ĐÃ HỖ TRỢ API Hủy đơn hàng:
- **Controller**: [OrderController.cs](file:///Users/nguyenvanminhtam/Frontend/Backend/BookManagement.Api/Controllers/OrderController.cs#L57)
- **Endpoint**: `POST /api/orders/CancelOrder?id={orderId}`
- **Quyền truy cập**: `[Authorize(Roles = "CUSTOMER,SHOP")]` (yêu cầu Bearer Token).
- **Service xử lý**: [OrderService.cs](file:///Users/nguyenvanminhtam/Frontend/Backend/BookManagement.Service/Order/OrderService.cs#L275) `CancelOrderAsync(Guid userId, Guid orderId)`.

### Ràng buộc nghiệp vụ trạng thái đơn hàng được phép hủy:
> [!IMPORTANT]
> Backend quy định chặt chẽ: **Chỉ cho phép khách hàng tự hủy các đơn hàng đang ở trạng thái `PENDING` ("Chờ xác nhận")**.
> ```csharp
> if (order.OrderStatus != OrderStatus.PENDING) 
>     throw new InvalidOperationException("Only PENDING orders can be cancelled.");
> ```
> - Nếu đơn hàng ở trạng thái `PROCESSING` ("Đang xử lý"), `PAID` ("Đã thanh toán"), `SHIPPING`/`DELIVERING` ("Đang giao"), Backend sẽ ném ra ngoại lệ và từ chối hủy tự động (trả về lỗi HTTP 400).
> - Khi đơn `PENDING` được hủy thành công:
>   - Trạng thái đơn chuyển thành `CANCELLED`.
>   - Tồn kho sách (`StockQuantity`) tự động được hoàn trả lại cho Shop.
>   - Tạo một Notification hệ thống cho khách hàng và gửi sự kiện Realtime qua SignalR.

---

## 2. Tại sao trên giao diện hiện tại không tìm thấy nút Hủy đơn?

1. **Trên trang danh sách [MyOrdersPage.tsx](file:///Users/nguyenvanminhtam/Frontend/src/pages/customer/MyOrdersPage.tsx)**:
   - Các card đơn hàng hiện tại chỉ có nút *"Xem chi tiết"*, chưa được bố trí nút bấm *"Hủy đơn"* trực tiếp.
2. **Trên trang chi tiết [OrderDetailPage.tsx](file:///Users/nguyenvanminhtam/Frontend/src/pages/customer/OrderDetailPage.tsx#L205)**:
   - Đã có nút *"Hủy đơn hàng"*, nhưng code đặt điều kiện ẩn: `{order.orderStatus === "PENDING" && <Btn>...}`.
   - Trong ảnh chụp của bạn, bạn đang mở tab **"Đang xử lý" (3 đơn)** và tab "Chờ xác nhận" có **0 đơn**, nên nút hủy không được render ra màn hình.

---

## 3. Kế hoạch giải pháp & Trình bày giao diện (UI/UX Implementation Plan)

### A. Nút "Hủy đơn" trực tiếp trên trang Danh sách đơn hàng (`MyOrdersPage.tsx`)
1. **Đối với đơn hàng `PENDING` ("Chờ xác nhận")**:
   - Hiển thị nút **"Hủy đơn"** (màu đỏ viền/outline) nổi bật ngay cạnh nút "Xem chi tiết".
   - Bấm vào sẽ mở **Modal xác nhận hủy đơn**:
     - Cung cấp danh sách lý do hủy mẫu (Đổi ý không mua nữa, Muốn đổi địa chỉ nhận hàng, Muốn đặt lại thêm sách khác, Lý do khác...).
     - Nút xác nhận gọi `orderService.cancelOrder(order.id)`.
     - Cập nhật state realtime: Đơn chuyển sang tab "Đã hủy" ngay lập tức mà không cần reload trang.
2. **Đối với đơn hàng `PROCESSING` ("Đang xử lý")**:
   - Vì Backend không cho phép tự hủy khi Shop đã bắt đầu đóng gói, ta hiển thị nút **"Yêu cầu hủy"** (màu xám nhạt).
   - Khi bấm vào, hiển thị hướng dẫn khách hàng thân thiện:
     - *"Đơn hàng đã được người bán tiếp nhận và đang đóng gói. Bạn vui lòng nhắn tin trực tiếp với Shop để Shop hỗ trợ hủy đơn trước khi giao cho đơn vị vận chuyển."*
     - Kèm nút bấm **"Nhắn tin cho Shop ngay"** (mở khung chat với shop của đơn hàng đó).

### B. Hoàn thiện trang Chi tiết đơn hàng (`OrderDetailPage.tsx`)
- Giữ nút hủy cho đơn `PENDING` kèm popup chọn lý do.
- Bổ sung banner hướng dẫn và nút mở chat với Shop đối với các đơn `PROCESSING` muốn hủy.

---

## 4. Danh sách các file thay đổi (Proposed Changes)

### Services & API
- `src/services/orderService.ts`: Đảm bảo `cancelOrder` gửi đúng request `POST /api/orders/CancelOrder?id={orderId}` và trả về thông báo lỗi chi tiết từ Backend nếu có.

### Pages & Components
- `src/pages/customer/MyOrdersPage.tsx`: Bổ sung nút Hủy đơn cho đơn `PENDING`, nút Hỗ trợ hủy cho đơn `PROCESSING`, và Modal xác nhận hủy đơn.
- `src/pages/customer/OrderDetailPage.tsx`: Hoàn thiện Modal hủy đơn và banner hỗ trợ chat với Shop.

---

## 5. Kế hoạch kiểm thử & Xác thực (Verification Plan)

### Automated Tests
- Chạy `npm run build` đảm bảo 0 lỗi cú pháp hoặc TypeScript.

### Manual Verification
1. Mở trang "Đơn hàng của tôi":
   - Thử đặt 1 đơn mới ở trang chủ để có đơn `PENDING` ("Chờ xác nhận").
   - Kiểm tra tab "Chờ xác nhận": Thấy xuất hiện nút **"Hủy đơn"**.
   - Bấm "Hủy đơn" -> Chọn lý do -> Xác nhận hủy -> Kiểm tra đơn hàng lập tức chuyển sang tab "Đã hủy".
2. Kiểm tra tab "Đang xử lý":
   - Bấm "Yêu cầu hủy" -> Kiểm tra popup hướng dẫn liên hệ Shop xuất hiện trực quan.
