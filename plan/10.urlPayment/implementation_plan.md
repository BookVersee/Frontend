# Phân Tích Nguyên Nhân Gốc Rễ & Kế Hoạch Điều Chỉnh Luồng Đặt Hàng & Thanh Toán

Tài liệu này giải thích chi tiết cơ chế tại sao giao diện Đặt hàng lại gọi API `AddToCart`, nguyên nhân gây ra lỗi HTTP `400 Bad Request` cho cả `AddToCart` và `CreatePaymentUrl`, đồng thời đề xuất kế hoạch điều chỉnh toàn diện trên Frontend nhằm đảm bảo tính tương thích và mượt mà cho trải nghiệm người dùng.

---

## 1. Nguyên nhân gốc rễ (Root Cause Analysis)

### 1.1. Tại sao giao diện Đặt hàng lại gọi API `AddToCart`?
- **Kiến trúc đồng bộ Giỏ hàng**: Frontend lưu trữ trạng thái giỏ hàng tạm thời trong `localStorage` (`CartContext`) để tối ưu tốc độ phản hồi giao diện và cho phép khách duyệt sách tiện lợi.
- **Nghiệp vụ Backend**: Endpoint tạo đơn hàng của Backend (`POST /orders/CreateOrder`) không nhận trực tiếp danh sách sách từ body request mà **lấy trực tiếp các mặt hàng đang có trong Giỏ hàng Database của User** (`_db.Carts.Include(c => c.CartBookDetails)...`).
- **Luồng xử lý tại [`orderService.ts`](file:///Users/nguyenvanminhtam/Frontend/src/services/orderService.ts#L131-L146)**:
  Trước khi chốt đơn, Frontend bắt buộc phải đồng bộ giỏ hàng từ `localStorage` lên Database:
  1. Gọi `DELETE /api/cart/ClearCart` để xóa các món cũ tồn đọng trên DB (trả về `200 OK`).
  2. Lặp qua từng sản phẩm trong giỏ và gọi `POST /api/cart/AddToCart` với payload:
     `{ bookId: item.book.id, quantity: item.quantity }`.
  3. Sau khi giỏ hàng DB đã đầy đủ, gọi `POST /api/orders/CreateOrder` để Backend tạo đơn hàng thật.

### 1.2. Tại sao `AddToCart` bị lỗi 400 Bad Request?
- **Backend Contract**: Trong Backend DTO ([`CartRequest.cs`](file:///Users/nguyenvanminhtam/Frontend/Backend/BookManagement.Service/Cart/CartRequest.cs#L7)), trường sách được định nghĩa là:
  ```csharp
  public class AddItemRequest {
      public Guid BookId { get; set; }
      public int Quantity { get; set; } = 1;
  }
  ```
  .NET `System.Text.Json` yêu cầu `BookId` bắt buộc phải là một chuỗi GUID hợp lệ (ví dụ: `44444444-0000-0000-0000-000000000001`).
- **Dữ liệu thực tế gửi lên**: Cuốn sách trong giỏ hàng hiện tại được thêm từ dữ liệu mock trước đây (khi chưa bật Backend), có ID là số nguyên:
  ```json
  { "bookId": 1, "quantity": 1 }
  ```
- **Kết quả**: .NET ném lỗi xác thực:
  > *"The JSON value could not be converted to System.Guid. Path: $.bookId"* ➔ **HTTP 400**.

### 1.3. Tại sao `CreatePaymentUrl` tiếp tục bị lỗi 400 Bad Request (Hệ quả dây chuyền)?
1. Khi `AddToCart` bị lỗi 400, hàm `orderService.createOrder` rơi vào khối `catch` dự phòng (fallback).
2. Trong khối fallback ([`orderService.ts:L194`](file:///Users/nguyenvanminhtam/Frontend/src/services/orderService.ts#L194)), hệ thống tự sinh mã đơn hàng giả kiểu số:
   ```typescript
   let baseId = 1000 + Math.floor(Math.random() * 8000); // Sinh ra 4858 (Đơn hàng #4858 trong ảnh)
   ```
3. Sau đó, [`CheckoutPage.tsx`](file:///Users/nguyenvanminhtam/Frontend/src/pages/customer/CheckoutPage.tsx#L145) nhận `orderId = 4858` và gọi tiếp `paymentService.createMomoUrl({ orderId: 4858 })`.
4. Endpoint `POST /api/Payment/CreatePaymentUrl` của Backend nhận payload `{ orderId: 4858 }`. Trong khi đó, DTO của Backend là `public Guid OrderId { get; set; }`.
5. .NET tiếp tục ném lỗi xác thực:
   > *"The JSON value could not be converted to System.Guid. Path: $.orderId"* ➔ **HTTP 400**.

---

## User Review Required

> [!IMPORTANT]
> Toàn bộ cơ sở dữ liệu Backend (`Books`, `Orders`, `Carts`, `Users`, `Shops`) đều sử dụng khóa chính dạng **UUID / GUID** (`UNIQUEIDENTIFIER`).
> Do đó, Frontend cần chuẩn hóa 100% các ID sách và đơn hàng sang GUID hợp lệ để loại bỏ hoàn toàn các lỗi ép kiểu JSON tại cổng API của Backend.

---

## Proposed Changes

### 1. Chuẩn hóa ID sách trong Mock Data thành GUID thật của Database
#### [MODIFY] [mockData.ts](file:///Users/nguyenvanminhtam/Frontend/src/services/mockData.ts)
- Cập nhật toàn bộ `id` và `shopId` trong `INITIAL_BOOKS` từ số (`1`, `2`, `3`...) sang các GUID tương ứng đã được seed trong Database:
  - Sách 1: `44444444-0000-0000-0000-000000000001` (Nhà Giả Kim)
  - Sách 2: `44444444-0000-0000-0000-000000000002` (Cây Cam Ngọt Của Tôi)
  - Sách 3: `44444444-0000-0000-0000-000000000003` (Hoàng Tử Bé)
  - Sách 4: `44444444-0000-0000-0000-000000000004` (Bố Già)
  - v.v.
- Điều này đảm bảo ngay cả khi người dùng duyệt sách ở chế độ fallback hoặc offline, sản phẩm thêm vào giỏ vẫn luôn mang GUID hợp lệ.

---

### 2. Tự động kiểm tra và chuẩn hóa GUID trong `orderService.ts`
#### [MODIFY] [orderService.ts](file:///Users/nguyenvanminhtam/Frontend/src/services/orderService.ts)
- Thêm tiện ích xác thực / chuyển đổi GUID an toàn: nếu phát hiện `item.book.id` là số nguyên cũ (ví dụ `1`), tự động map sang GUID tương ứng `44444444-0000-0000-0000-000000000001` trước khi gửi tới API `AddToCart`.
- Nếu rơi vào nhánh fallback tạo đơn hàng ngẫu nhiên khi Backend có sự cố, sử dụng `crypto.randomUUID()` thay cho số nguyên ngẫu nhiên `baseId = 1000 + ...`, giúp `orderId` luôn là một GUID chuẩn RFC 4122.

---

### 3. Tự động dọn dẹp mặt hàng cũ không hợp lệ trong Giỏ hàng
#### [MODIFY] [CartContext.tsx](file:///Users/nguyenvanminhtam/Frontend/src/contexts/CartContext.tsx)
- Bổ sung cơ chế tự động chuyển đổi các mặt hàng lưu trong `localStorage` có ID kiểu số cũ sang GUID hợp lệ của Database.
- Khi người dùng vào trang giỏ hàng, nếu có item không thể map sang GUID thì thông báo nhẹ hoặc làm mới sản phẩm để tránh gửi dữ liệu rác lên Backend.

---

### 4. Kiểm tra GUID trước khi gọi `paymentService.createMomoUrl`
#### [MODIFY] [paymentService.ts](file:///Users/nguyenvanminhtam/Frontend/src/services/paymentService.ts)
- Bổ sung kiểm tra định dạng `orderId`: chỉ gửi request API tới Backend nếu `orderId` là một chuỗi GUID hợp lệ. Nếu không phải GUID, lập tức kích hoạt fallback MoMo QR mà không làm phát sinh lỗi HTTP 400 trên Network tab.

---

## Verification Plan

### Automated / Manual Verification
1. **Dọn giỏ hàng & chọn sách mới**:
   - Thêm cuốn sách "Nhà Giả Kim" hoặc bất kỳ sách nào từ trang chủ vào giỏ hàng.
   - Kiểm tra `book.id` trong giỏ hàng đảm bảo là GUID `44444444-...`.
2. **Kiểm tra luồng đặt hàng (AddToCart & CreateOrder)**:
   - Vào Giỏ hàng ➔ Tiến hành Đặt hàng.
   - Mở Network tab:
     - `DELETE /api/cart/ClearCart` ➔ `200 OK`
     - `POST /api/cart/AddToCart` ➔ `200 OK` (với payload GUID)
     - `POST /api/orders/CreateOrder` ➔ `200 OK`
3. **Kiểm tra tạo liên kết MoMo Sandbox (CreatePaymentUrl)**:
   - `POST /api/Payment/CreatePaymentUrl` gửi `orderId` (GUID thật của Order vừa tạo) ➔ `200 OK`.
   - Trình duyệt tự động chuyển hướng sang cổng thanh toán Web MoMo Sandbox (`https://test-payment.momo.vn/...`).
