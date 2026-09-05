# Kế Hoạch Điều Chỉnh: Đồng Bộ API Giỏ Hàng Chuẩn Thời Điểm (Cart API Lifecycle)

## 1. Nguyên Nhân Gốc Rễ (Root Cause Analysis)

### 1.1. Tại sao trước đây lại gọi `AddToCart` lúc bấm Thanh Toán?
1. **Kiến trúc ban đầu là Offline / Local-first**:
   - `CartContext.tsx` ban đầu chỉ quản lý mảng giỏ hàng lưu cục bộ trong trình duyệt qua `localStorage`.
   - Tại các nơi người dùng bấm nút:
     - Trang chi tiết sách [`BookDetailPage.tsx`](file:///Users/nguyenvanminhtam/Frontend/src/pages/customer/BookDetailPage.tsx#L82)
     - Khung tư vấn Chat [`ChatDrawer.tsx`](file:///Users/nguyenvanminhtam/Frontend/src/components/chat/ChatDrawer.tsx#L236)
     Hàm `addToCart` chỉ cập nhật state trong React và ghi vào `localStorage`, **hoàn toàn KHÔNG gửi request nào lên Backend**.
2. **Backend .NET thiết kế tạo đơn hàng dựa trên Database Cart**:
   - Khi gọi `POST /api/orders/CreateOrder`, Backend kiểm tra bảng giỏ hàng trên DB (`_context.Carts` và `_context.CartBookDetails`). Nếu DB trống, Backend sẽ ném lỗi: `"Giỏ hàng của bạn đang trống. Vui lòng thêm sản phẩm trước khi thanh toán."`.
3. **Giải pháp tình thế (Workaround Hack) phát sinh trong `orderService.ts`**:
   - Vì lúc bấm "Thêm vào giỏ hàng" không đồng bộ lên DB, nên khi người dùng chuyển sang trang Thanh toán (`CheckoutPage`), giỏ hàng trên DB vẫn là rỗng.
   - Để lách qua lỗi này, người viết code trước đây đã tạo một đoạn mã tạm bợ trong hàm `createOrder` ([`orderService.ts:133-164`](file:///Users/nguyenvanminhtam/Frontend/src/services/orderService.ts#L133-L164)):
     - Bước 1: Xóa sạch giỏ hàng trên DB (`DELETE /cart/ClearCart`).
     - Bước 2: Chạy vòng lặp `for (const item of cart)` gọi `POST /cart/AddToCart` cho từng cuốn sách được chọn.
     - Bước 3: Gọi `POST /orders/CreateOrder`.
     - Bước 4: Chạy thêm 1 vòng lặp `POST /cart/AddToCart` nữa để nạp lại các cuốn sách chưa mua vào giỏ hàng DB!

### 1.2. Hậu quả của cách làm sai thời điểm:
- **Sai hoàn toàn luồng nghiệp vụ**: Người dùng thêm sách vào giỏ nhưng Backend không hề biết. Khi người dùng đăng nhập trên điện thoại hoặc trình duyệt khác, giỏ hàng biến mất.
- **Nút "Thanh toán" bị lag/chậm bất thường**: Phải thực hiện liên tiếp 5-10 request HTTP (ClearCart -> AddToCart 1 -> AddToCart 2 -> CreateOrder -> AddToCart lại món dư) chỉ trong 1 cú click.
- **Bỏ phí tính năng có sẵn của Backend**: Backend .NET vốn đã hỗ trợ thuộc tính `SelectedCartItemIds` trong `CreateOrderRequest` để tự động chỉ trừ các món được tick chọn và giữ nguyên các món còn lại trong giỏ hàng.

---

## 2. Thiết Kế & Giải Pháp Chuẩn Hóa

Hệ thống sẽ được tái cấu trúc theo đúng vòng đời chuẩn của sàn Thương mại Điện tử:

```
[Người dùng bấm "Thêm vào giỏ"]
       │
       ▼
GỌI NGAY API: POST /api/cart/AddToCart { bookId, quantity }
       │
       ▼
Backend lưu vào CartBookDetails (gán CartDetailId) & trả về CartResponse
       │
       ▼
Frontend cập nhật giỏ hàng Realtime (kèm CartDetailId)
       │
       ▼
[Trang Giỏ Hàng - CartPage]
- Đổi số lượng (+/-): GỌI PUT /api/cart/UpdateCartItem?cartDetailId=... { quantity }
- Xóa sản phẩm:       GỌI DELETE /api/cart/RemoveFromCart?cartDetailId=...
- Tải giỏ khi vào web: GỌI GET /api/cart/GetCart
       │
       ▼
[Bấm Đặt Hàng - CheckoutPage]
Chỉ gửi 1 request duy nhất: POST /api/orders/CreateOrder { selectedCartItemIds: [...] }
(Backend tự động xóa đúng các món đã mua, giữ nguyên các món chưa mua, KHÔNG gọi AddToCart nữa!)
```

---

## 3. Các Thay Đổi Cụ Thể (Proposed Changes)

### 3.1. Tạo Dịch Vụ Giỏ Hàng [`cartService.ts`](file:///Users/nguyenvanminhtam/Frontend/src/services/cartService.ts) [NEW]
Xây dựng đầy đủ các hàm giao tiếp trực tiếp với `CartController` của Backend:
- `getCart()`: Gọi `GET /api/cart/GetCart` lấy toàn bộ giỏ hàng từ máy chủ.
- `addToCart(bookId, quantity)`: Gọi `POST /api/cart/AddToCart` ngay khi người dùng chọn sách.
- `updateCartItem(cartDetailId, quantity)`: Gọi `PUT /api/cart/UpdateCartItem?cartDetailId=...`.
- `removeFromCart(cartDetailId)`: Gọi `DELETE /api/cart/RemoveFromCart?cartDetailId=...`.
- `clearCart()`: Gọi `DELETE /api/cart/ClearCart`.

### 3.2. Cập Nhật Kiểu Dữ Liệu [`src/types/index.ts`](file:///Users/nguyenvanminhtam/Frontend/src/types/index.ts) [MODIFY]
- Cập nhật `CartItem` bổ sung trường `cartDetailId?: string` (GUID của chi tiết giỏ hàng trên DB).
- Khai báo các DTO tương ứng với Backend: `CartResponse`, `CartItemResponse`, `ShopGroupResponse`.

### 3.3. Tái Cấu Trúc [`src/contexts/CartContext.tsx`](file:///Users/nguyenvanminhtam/Frontend/src/contexts/CartContext.tsx) [MODIFY]
- **Hàm `addToCart`**:
  - Khi người dùng bấm thêm sách: Gửi ngay request `cartService.addToCart(book.id, quantity)`.
  - Cập nhật giỏ hàng hiển thị ngay lập tức (Optimistic UI) và gán `cartDetailId` từ response của Backend.
  - Bắt lỗi khi sách hết hàng / vượt số lượng trong kho (Backend ném message cụ thể: *"Sản phẩm chỉ còn X cuốn trong kho"*).
- **Hàm `updateQuantity`**:
  - Gửi `cartService.updateCartItem(cartDetailId, quantity)`.
- **Hàm `removeFromCart`**:
  - Gửi `cartService.removeFromCart(cartDetailId)`.
- **Khởi tạo (Initialization)**:
  - Khi người dùng đăng nhập hoặc F5 trang: Tự động gọi `cartService.getCart()` để đồng bộ giỏ hàng mới nhất từ database về máy.

### 3.4. Dọn Dẹp Sạch Sẽ [`src/services/orderService.ts`](file:///Users/nguyenvanminhtam/Frontend/src/services/orderService.ts) [MODIFY]
- **Xóa bỏ hoàn toàn** đoạn code gọi `ClearCart` và các vòng lặp `AddToCart` trong `createOrder`.
- Truyền danh sách `selectedCartItemIds` (danh sách `cartDetailId` của các món được tick chọn) vào payload gửi tới `POST /api/orders/CreateOrder`.

### 3.5. Đồng Bộ [`src/pages/customer/CheckoutPage.tsx`](file:///Users/nguyenvanminhtam/Frontend/src/pages/customer/CheckoutPage.tsx) [MODIFY]
- Truyền trực tiếp danh sách `selectedItems` với `cartDetailId` vào hàm `createOrder`.
- Sau khi đặt hàng thành công, giỏ hàng tự động phản ánh đúng danh sách sản phẩm còn lại mà không cần hack nạp lại.

---

## 4. Kế Hoạch Kiểm Thử & Nghiệm Thu (Verification Plan)

### 4.1. Kiểm thử Biên dịch & TypeScript
```bash
npm run build
```

### 4.2. Kiểm thử Thực tế trên Trình duyệt (DevTools Network Tab)
1. **Kiểm tra khi bấm "Thêm vào giỏ hàng" tại `BookDetailPage`**:
   - Mở Network tab.
   - Bấm nút "Thêm vào giỏ hàng" với số lượng 2.
   - **Xác nhận**: Xuất hiện ngay lập tức request `POST /api/cart/AddToCart` với payload `{"bookId":"...","quantity":2}` và status **200 OK**.
2. **Kiểm tra thay đổi số lượng tại `CartPage`**:
   - Bấm nút tăng `+` hoặc giảm `-`.
   - **Xác nhận**: Xuất hiện request `PUT /api/cart/UpdateCartItem` và cập nhật tức thì.
3. **Kiểm tra xóa sản phẩm tại `CartPage`**:
   - Bấm nút thùng rác xóa sản phẩm.
   - **Xác nhận**: Xuất hiện request `DELETE /api/cart/RemoveFromCart` và sản phẩm biến mất khỏi DB.
4. **Kiểm tra luồng Đặt hàng tại `CheckoutPage`**:
   - Chọn mua 1 trong 2 cuốn sách trong giỏ hàng.
   - Bấm "Xác nhận đặt hàng".
   - **Xác nhận**:
     - **KHÔNG CÒN** request `ClearCart` hay `AddToCart` nào xuất hiện lúc thanh toán.
     - Chỉ có 1 request duy nhất `POST /api/orders/CreateOrder` với `selectedCartItemIds`.
     - Sau khi đặt hàng, cuốn sách còn lại vẫn nằm nguyên vẹn trong giỏ hàng.
