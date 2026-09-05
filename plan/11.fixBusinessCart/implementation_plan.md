# Kế Hoạch Điều Chỉnh: Sửa Lỗi Hiển Thị Ảnh Bìa Sách & Nghiệp Vụ Chọn Sản Phẩm Thanh Toán Trong Giỏ Hàng

Tài liệu này phân tích chi tiết nguyên nhân gốc rễ và đề xuất kế hoạch điều chỉnh cho 2 vấn đề:
1. **Lỗi hiển thị avatar / ảnh bìa sách trong giỏ hàng**: Ảnh bìa bị tràn khung và đè lên chữ tiêu đề, tên shop và đơn giá.
2. **Lỗi nghiệp vụ đặt hàng**: Hiện tại hệ thống tự động thanh toán toàn bộ sản phẩm trong giỏ; cần bổ sung tính năng cho phép người dùng tick chọn (checkbox) từng món hoặc chọn tất cả sản phẩm muốn thanh toán, và chỉ trừ các món đã mua khỏi giỏ hàng.

---

## 1. Phân tích nguyên nhân gốc rễ (Root Cause Analysis)

### 1.1. Lỗi hiển thị avatar / ảnh bìa sách trong Cart
- **Vị trí**: [`CartPage.tsx:L59-L61`](file:///Users/nguyenvanminhtam/Frontend/src/pages/customer/CartPage.tsx#L59-L61)
- **Nguyên nhân**:
  - Container bao bọc ảnh bìa được đặt kích thước cố định là `className="w-14 shrink-0"` (tương đương **56px**).
  - Tuy nhiên, component con [`BookCover.tsx`](file:///Users/nguyenvanminhtam/Frontend/src/components/common/BookCover.tsx#L11) với `size="sm"` có kích thước nội tại là **`width: 90px, height: 130px`** cùng inline style cố định.
  - Do `width: 90px` lớn hơn khung chứa `56px` đến 34px và không có `overflow-hidden` ở cấp hàng, ảnh bìa bị tràn ngang (overflow) và **đè trực tiếp lên khối văn bản** (`flex-1 min-w-0`) chứa tên Shop và tiêu đề sách.

### 1.2. Lỗi nghiệp vụ thanh toán toàn bộ giỏ hàng
- **Vị trí**: [`CartPage.tsx`](file:///Users/nguyenvanminhtam/Frontend/src/pages/customer/CartPage.tsx), [`CartContext.tsx`](file:///Users/nguyenvanminhtam/Frontend/src/contexts/CartContext.tsx) và [`CheckoutPage.tsx`](file:///Users/nguyenvanminhtam/Frontend/src/pages/customer/CheckoutPage.tsx)
- **Nguyên nhân**:
  - `CartPage.tsx` chưa thiết kế trạng thái chọn (`selectedItemIds` / checkboxes). Nút *"Tiến hành đặt hàng"* mặc định chuyển toàn bộ mảng `cart` sang trang checkout.
  - `CheckoutPage.tsx` lấy `const { cart, clearCart } = useCart();` để tính tiền và tạo đơn cho tất cả sách có trong giỏ, sau đó gọi `clearCart()` làm sạch toàn bộ giỏ hàng.
  - **Nghiệp vụ thực tế (Shopee, Tiki, Lazada)**: Khách hàng thường lưu nhiều sách vào giỏ để dành, khi thanh toán chỉ chọn một vài cuốn ưng ý nhất. Sau khi thanh toán thành công, hệ thống **chỉ được xóa những món đã đặt mua**, các món chưa chọn mua phải được giữ nguyên trong giỏ hàng.
  - **Backend đã sẵn sàng**: Backend DTO `CreateOrderRequest` ([`OrderRequest.cs:L17`](file:///Users/nguyenvanminhtam/Frontend/Backend/BookManagement.Service/Order/OrderRequest.cs#L17)) đã hỗ trợ trường `SelectedCartItemIds` và trong [`OrderService.cs:L210-L214`](file:///Users/nguyenvanminhtam/Frontend/Backend/BookManagement.Service/Order/OrderService.cs#L210-L214) Backend chỉ xóa (`IsDeleted = true`) các món nằm trong danh sách đã chọn!

---

## User Review Required

> [!IMPORTANT]
> **Quy tắc trải nghiệm người dùng (UX) cho tính năng chọn món trong giỏ hàng:**
> 1. Khi vừa mở giỏ hàng: Mặc định tất cả các món đang có trong giỏ sẽ được **chọn sẵn (checked)** để thuận tiện cho khách muốn mua nhanh.
> 2. Có checkbox **"Chọn tất cả"** ở đầu danh sách.
> 3. Từng sản phẩm có checkbox riêng: Bỏ tick món nào thì món đó mờ nhẹ và tiền của món đó sẽ lập tức được trừ khỏi mục **"Tóm tắt thanh toán"**.
> 4. Nút *"Tiến hành đặt hàng"* sẽ hiển thị kèm số lượng món đã chọn: ví dụ **"Tiến hành đặt hàng (1)"**, và sẽ bị disable nếu chưa chọn món nào.
> 5. Khi đặt hàng thành công (COD hoặc MoMo), **chỉ xóa các sản phẩm đã được thanh toán**, các món chưa chọn vẫn nằm nguyên trong giỏ hàng.

---

## Proposed Changes

### Component 1: Cải thiện kích thước BookCover & sửa lỗi đè chữ
#### [MODIFY] [BookCover.tsx](file:///Users/nguyenvanminhtam/Frontend/src/components/common/BookCover.tsx)
- Bổ sung kích thước `size="xs"` chuyên dụng cho giỏ hàng và danh sách thu nhỏ:
  ```typescript
  const DIMS = {
    xs: { w: 60, h: 84 },
    sm: { w: 80, h: 112 },
    md: { w: 130, h: 185 },
    lg: { w: 175, h: 250 },
  };
  ```

#### [MODIFY] [CartPage.tsx](file:///Users/nguyenvanminhtam/Frontend/src/pages/customer/CartPage.tsx)
- Đổi wrapper thumbnail sách sang kích thước vừa vặn `w-16 h-22 sm:w-18 shrink-0 relative overflow-hidden rounded-xl`, sử dụng `<BookCover book={item.book} size="xs" />`.
- Đảm bảo ảnh bìa sách và khối tiêu đề cách nhau một khoảng `gap-3.5` rõ ràng, không bao giờ bị đè chữ.

---

### Component 2: Quản lý trạng thái chọn món (Selection State) trong CartContext
#### [MODIFY] [CartContext.tsx](file:///Users/nguyenvanminhtam/Frontend/src/contexts/CartContext.tsx)
- Bổ sung state và methods:
  - `selectedBookIds: string[]`: Danh sách ID các sách đang được tick chọn.
  - `toggleSelectItem(bookId)`: Đảo trạng thái chọn của một sản phẩm.
  - `selectAllItems()` / `deselectAllItems()`: Chọn hoặc bỏ chọn toàn bộ.
  - `isAllSelected: boolean`: Cờ kiểm tra tất cả đã được chọn hay chưa.
  - `selectedItems: CartItem[]`: Mảng các mặt hàng được chọn (computed từ `cart`).
  - `selectedSubtotal`, `selectedShippingFee`, `selectedTotal`: Tiền hàng, phí ship và tổng tiền chỉ tính trên các món được chọn.
  - `removePurchasedItems(purchasedIds: (string | number)[])`: Xóa các món đã mua thành công, bảo lưu các món chưa mua trong giỏ.

---

### Component 3: Giao diện Giỏ hàng (CartPage) với Checkbox & Tóm tắt linh hoạt
#### [MODIFY] [CartPage.tsx](file:///Users/nguyenvanminhtam/Frontend/src/pages/customer/CartPage.tsx)
- Thêm thanh công cụ đầu giỏ hàng:
  - Checkbox **"Chọn tất cả (X sản phẩm)"**.
  - Nút **"Xóa các mục đã chọn"** (hiển thị khi có ít nhất 1 mục được tick).
- Mỗi Card sản phẩm:
  - Thêm Checkbox tròn/bo góc hiện đại ở phía bên trái ảnh bìa.
  - Trạng thái chưa chọn: làm mờ nhẹ (`opacity-70`), đổi viền thẻ để người dùng dễ phân biệt.
- Khối Tóm tắt thanh toán:
  - Hiển thị tiền theo `selectedSubtotal` và `selectedTotal`.
  - Phí vận chuyển: nếu chưa chọn món nào thì `0 đ`, nếu có chọn thì `30.000 đ`.
  - Nút bấm: *"Tiến hành đặt hàng ({selectedCount} sản phẩm)"*. Disable nếu `selectedCount === 0`.

---

### Component 4: Trang Thanh toán (CheckoutPage) chỉ chốt các món đã chọn
#### [MODIFY] [CheckoutPage.tsx](file:///Users/nguyenvanminhtam/Frontend/src/pages/customer/CheckoutPage.tsx)
- Thay vì lấy toàn bộ `cart`, chuyển sang sử dụng `selectedItems` (các món khách đã tick chọn trong Cart):
  - Hiển thị đúng danh sách các món được chọn trong phần *"Tóm tắt sản phẩm"*.
  - Gửi đúng `cart: selectedItems` vào hàm `orderService.createOrder`.
- Sau khi đặt hàng thành công (qua MoMo hoặc COD):
  - Thay thế lệnh `clearCart()` bằng `removePurchasedItems(selectedItems.map(i => i.book.id))`.
  - Các món khách hàng không tick chọn vẫn được lưu lại nguyên vẹn trong giỏ hàng.

---

## Verification Plan

### Manual Verification
1. **Kiểm tra giao diện ảnh bìa trong giỏ hàng**:
   - Mở trang Giỏ hàng [http://localhost:5173/](http://localhost:5173/).
   - Quan sát 2 cuốn sách: Ảnh bìa hiển thị gọn gàng, sắc nét trong khung, cách biệt hoàn toàn với tên Nhà sách và tên sách (không còn tình trạng đè chữ).
2. **Kiểm tra chọn / bỏ chọn sản phẩm (Selection UX)**:
   - Thêm 2-3 cuốn sách vào giỏ hàng.
   - Bấm tick / bỏ tick từng sản phẩm: Số tiền tạm tính và tổng tiền phải nhảy tương ứng theo thời gian thực.
   - Bấm nút "Chọn tất cả" ➔ Kiểm tra tất cả các món được tick/bỏ tick đồng loạt.
   - Bỏ tick tất cả ➔ Nút "Tiến hành đặt hàng" phải bị disable.
3. **Kiểm tra luồng đặt hàng thực tế**:
   - Trong giỏ hàng có 2 cuốn sách: Tick chọn 1 cuốn, bỏ chọn 1 cuốn.
   - Bấm "Tiến hành đặt hàng (1)".
   - Tại trang xác nhận đơn hàng: Chỉ hiển thị 1 cuốn sách đã chọn với đúng số tiền của cuốn đó.
   - Hoàn tất thanh toán (COD hoặc MoMo) ➔ Quay lại giỏ hàng: Cuốn sách đã mua biến mất, cuốn sách chưa chọn vẫn còn nguyên trong giỏ hàng!
