# Báo Cáo Nghiệm Thu: Điều Chỉnh Thời Điểm Gọi API AddToCart & Chuẩn Hóa Vòng Đời Giỏ Hàng

Toàn bộ luồng giỏ hàng đã được điều chỉnh về đúng chuẩn thời điểm và nghiệp vụ của sàn Thương mại Điện tử, chấm dứt hoàn toàn việc hoãn gọi `AddToCart` đến lúc bấm Thanh toán.

---

## 1. Tóm tắt các thay đổi đã thực hiện

### 1.1. Tạo mới dịch vụ [`cartService.ts`](file:///Users/nguyenvanminhtam/Frontend/src/services/cartService.ts) [NEW]
Kết nối trực tiếp 100% với `CartController` của Backend .NET:
- `addToCart(bookId, quantity)`: Gửi `POST /api/cart/AddToCart` ngay khi người dùng chọn sách.
- `getCart()`: Gửi `GET /api/cart/GetCart` lấy thông tin giỏ hàng từ máy chủ.
- `updateCartItem(cartDetailId, quantity)`: Gửi `PUT /api/cart/UpdateCartItem?cartDetailId=...` khi người dùng tăng giảm số lượng (+/-).
- `removeFromCart(cartDetailId)`: Gửi `DELETE /api/cart/RemoveFromCart?cartDetailId=...` khi xóa sản phẩm.
- `clearCart()`: Gửi `DELETE /api/cart/ClearCart` khi cần xóa toàn bộ giỏ hàng.

### 1.2. Mở rộng kiểu dữ liệu [`index.ts`](file:///Users/nguyenvanminhtam/Frontend/src/types/index.ts) [MODIFY]
- Bổ sung `cartDetailId?: string` vào `CartItem` để lưu GUID của dòng giỏ hàng trong cơ sở dữ liệu.
- Khai báo các DTO tương thích với Backend: `BackendCartResponse`, `BackendShopGroupResponse`, `BackendCartItemResponse`.
- Bổ sung `orderDetailId?: string` vào `OrderItem`.

### 1.3. Cải tiến [`CartContext.tsx`](file:///Users/nguyenvanminhtam/Frontend/src/contexts/CartContext.tsx) [MODIFY]
- **`addToCart(book, quantity)`**:
  - Giao diện phản hồi tức thì (Optimistic UI: tăng badge giỏ hàng ngay lập tức).
  - **Gọi ngay lập tức API `POST /api/cart/AddToCart`** lên máy chủ.
  - Tự động gắn `cartDetailId` nhận được từ Backend vào sản phẩm trong state giỏ hàng.
- **`updateQuantity(bookId, quantity)`**:
  - Tự động gọi API `PUT /api/cart/UpdateCartItem` nếu người dùng đã đăng nhập và item có `cartDetailId`.
- **`removeFromCart(bookId)`**:
  - Tự động gọi API `DELETE /api/cart/RemoveFromCart`.
- **Đồng bộ tự động (`refreshCart`)**:
  - Khi người dùng đăng nhập hoặc tải lại trang, hệ thống tự động gọi `cartService.getCart()` để đồng bộ giỏ hàng từ máy chủ về máy khách.

### 1.4. Loại bỏ đoạn mã hack tại [`orderService.ts`](file:///Users/nguyenvanminhtam/Frontend/src/services/orderService.ts) [MODIFY]
- **Xóa bỏ hoàn toàn**: Lệnh `ClearCart` và 2 vòng lặp gọi lại `AddToCart` dồn dập lúc bấm Thanh toán.
- **Tận dụng tính năng chuẩn của Backend**:
  - Hàm `createOrder` chỉ cần gửi 1 request duy nhất: `POST /api/orders/CreateOrder` kèm danh sách `selectedCartItemIds`.
  - Backend tự động xóa các sản phẩm được chọn và giữ nguyên các sản phẩm chưa mua trong giỏ hàng DB một cách tự nhiên.

---

## 2. Kết quả kiểm thử thực tế

### 2.1. Kiểm thử Biên dịch & TypeScript
```bash
npm run build
```
- **Kết quả**: Biên dịch thành công với Vite v8.2.1, **0 lỗi TypeScript, 0 cảnh báo cú pháp** (Hoàn thành trong 815ms).

### 2.2. Kiểm thử trực tiếp API Backend (`localhost:5226`)

| Thao tác | API Endpoint | Payload kiểm thử | Kết quả | Trạng thái |
| :--- | :--- | :--- | :--- | :--- |
| **1. Thêm vào giỏ hàng** | `POST /api/cart/AddToCart` | `{"bookId":"44444444-...","quantity":1}` | Trả về `cartId`, `cartDetailId`, `quantity: 3`, `grandTotal: 267000` | **200 OK** |
| **2. Xem giỏ hàng DB** | `GET /api/cart/GetCart` | Header: `Bearer Token` | Trả về nhóm Shop và danh sách các cuốn sách đang có trong giỏ | **200 OK** |
| **3. Sửa số lượng** | `PUT /api/cart/UpdateCartItem` | Query: `cartDetailId=...`, Body: `{"quantity":2}` | Cập nhật số lượng còn 2, `grandTotal: 178000` | **200 OK** |
| **4. Xóa sản phẩm** | `DELETE /api/cart/RemoveFromCart` | Query: `cartDetailId=...` | Xóa thành công, `grandTotal: 0`, `shopGroups: []` | **200 OK** |
