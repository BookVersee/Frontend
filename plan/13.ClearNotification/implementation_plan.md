# Kế Hoạch Khắc Phục: Lỗi Lặp API Xem Sách & Nâng Cấp Hệ Thống Thông Báo

Tài liệu phân tích nguyên nhân gốc rễ và kế hoạch điều chỉnh toàn diện cho 2 vấn đề được phản ánh:
1. **Lỗi khi bấm vào cuốn sách gọi lặp lại 3 lần các API `GetUserOrders`, `GetBookDetail`, `GetShopProfile` và làm rõ việc gọi `orders` để làm gì.**
2. **Khắc phục giao diện Thông báo (màu tối lấn át nội dung, nút Clear bị lỗi đỏ 404 do Backend không có API xóa) và tích hợp tính năng Xem Chi Tiết Thông Báo kèm điều hướng.**

---

## 1. Phân Tích Nguyên Nhân Gốc Rễ (Root Cause Analysis)

### 1.1. Vấn đề 1: Tại sao gọi `order` khi xem sách và tại sao lại bị gọi lặp lại 3 lần?
1. **"Gọi order để làm gì khi xem sách?"**:
   - **Mục đích 1 trong [`BookDetailPage.tsx:60-78`](file:///Users/nguyenvanminhtam/Frontend/src/pages/customer/BookDetailPage.tsx#L60-L78)**: Trước đây, trang chi tiết sách chưa kết nối với API đánh giá thật, nên người viết mã cũ đã gọi `orderService.getOrders()` (gọi tới `GET /api/orders/GetUserOrders`) để quét qua toàn bộ đơn hàng của khách, tìm các đơn có đánh giá giả lập (mock feedback) rồi hiển thị vào mục *"Đánh giá & Phản hồi từ Khách hàng"*. Đây là một giải pháp tình thế sai nghiệp vụ!
   - **Mục đích 2 trong [`ChatDrawer.tsx:158-167`](file:///Users/nguyenvanminhtam/Frontend/src/components/chat/ChatDrawer.tsx#L158-L167)**: Khung chat tư vấn tải danh sách đơn hàng của khách tại shop đó để hiển thị vào cột tra cứu đơn hàng bên phải.
2. **"Tại sao lại bị gọi lặp lại 3-4 lần?"**:
   - **Nguyên nhân 1 (ChatDrawer mount ngầm)**: Trong `BookDetailPage.tsx` (dòng 398), `<ChatDrawer />` được render liên tục ngay từ đầu. Dù khung chat đang ĐÓNG (`isOpen = false`), `ChatDrawer` vẫn chạy `useEffect` tải ngầm `GetShopProfile` và `GetUserOrders`.
   - **Nguyên nhân 2 (Hiệu ứng dây chuyền re-render)**: Khi `BookDetailPage` nạp xong chi tiết sách, nó gọi `setCurrentBook(detailed)`. Việc này làm thay đổi prop `currentBook` truyền vào `ChatDrawer`, khiến `useEffect` của `ChatDrawer` bị kích hoạt lại lần thứ 2!
   - **Nguyên nhân 3 (React 18 StrictMode)**: Trong môi trường `npm run dev`, React StrictMode chạy `useEffect` 2 lần khi mount để kiểm tra memory leak, nhân đôi toàn bộ số lượng request nếu không có cờ kiểm soát.

---

### 1.2. Vấn đề 2: Giao diện thông báo lấn át màu sắc, lỗi nút Clear và tính năng xem chi tiết
1. **Màu sắc tối lấn át nội dung**:
   - Trong [`NotificationDropdown.tsx:188-284`](file:///Users/nguyenvanminhtam/Frontend/src/components/common/NotificationDropdown.tsx#L188-L284), popup thông báo đang dùng mã màu nâu cà phê tối (`bg-[#2a211c]`, `bg-[#1c1612]`) và màu chữ xám nâu chìm nghỉm (`text-[#7a6a5a]`).
   - Toàn bộ website của khách hàng là phong cách nền sáng kem tinh tế (`bg-stone-50`, thẻ trắng `bg-white`, chữ đậm `text-slate-800`), khiến popup thông báo bị lạc tông, tối sầm và rất khó đọc.
2. **Bấm Clear bị lỗi đỏ trong DevTools**:
   - Nút "Xóa tất cả" đang gọi `notificationService.deleteAllNotifications()`, hàm này gửi request `DELETE /api/notifications/DeleteAllNotifications`.
   - Kiểm tra mã nguồn Backend tại [`NotificationController.cs`](file:///Users/nguyenvanminhtam/Frontend/Backend/BookManagement.Api/Controllers/NotificationController.cs): **Backend KHÔNG HỀ CÓ endpoint `DeleteAllNotifications` hay endpoint xóa nào khác**. Backend chỉ hỗ trợ:
     - `GET /api/notifications/GetNotifications`
     - `GET /api/notifications/GetUnreadNotifications`
     - `PUT /api/notifications/MarkAsRead?id={guid}`
     - `PUT /api/notifications/MarkAllAsRead`
   - Vì gọi vào endpoint không tồn tại nên máy chủ Kestrel trả về **HTTP 404** (hiển thị màu đỏ trong tab Network).
3. **Backend có hỗ trợ xem chi tiết thông báo không?**:
   - **Có đầy đủ!** DTO `NotificationResponse` của Backend đã trả về toàn bộ dữ liệu chi tiết gồm:
     - `Id`: Mã thông báo
     - `Type`: Loại thông báo (`"ORDER_UPDATE"`, `"SYSTEM"`, `"PROMOTION"`, `"CHAT"`)
     - `ReferenceId`: Mã đối tượng liên quan (chính là **`orderId`** của đơn hàng, hoặc `feedbackId`, `chatId`...)
     - `Content`: Toàn bộ nội dung chi tiết của thông báo
     - `ImageUrl`: Link hình ảnh đính kèm (nếu có)
     - `IsRead`: Trạng thái đã đọc/chưa đọc
     - `CreatedAt`: Thời gian gửi chính xác
   - Do đó không cần thêm endpoint Backend mới, Frontend hoàn toàn có thể mở **Modal Xem Chi Tiết Thông Báo** và cung cấp nút bấm điều hướng thẳng tới Đơn hàng tương ứng (`/orders?id=...`) thông qua trường `ReferenceId`!

---

## 2. Kế Hoạch Điều Chỉnh (Proposed Changes)

### 2.1. Khắc phục dứt điểm lỗi gọi lặp API khi bấm xem sách

#### [MODIFY] [`src/pages/customer/BookDetailPage.tsx`](file:///Users/nguyenvanminhtam/Frontend/src/pages/customer/BookDetailPage.tsx)
1. **Xóa bỏ hoàn toàn `orderService.getOrders()`**:
   - Thay thế bằng `feedbackService.getBookFeedbacks(book.id)` để lấy đúng danh sách đánh giá của cuốn sách đó từ Database.
2. **Chỉ render `ChatDrawer` khi mở chat (`chatOpen === true`)**:
   - Thay `<ChatDrawer isOpen={chatOpen} ... />` thành:
     ```tsx
     {chatOpen && (
       <ChatDrawer
         isOpen={chatOpen}
         onClose={() => setChatOpen(false)}
         shopId={currentBook.shopId}
         shopName={currentBook.shopName}
         book={currentBook}
         ...
       />
     )}
     ```
   - Ngăn chặn hoàn toàn việc `ChatDrawer` gọi ngầm `GetShopProfile` và `GetUserOrders` khi người dùng chỉ đang xem sách.
3. **Deduplication / Ref guard**:
   - Dùng `useRef` lưu `loadedBookId` để đảm bảo `getBookById` và `getBookFeedbacks` chỉ kích hoạt đúng 1 lần duy nhất cho mỗi cuốn sách khi mount.

#### [MODIFY] [`src/components/chat/ChatDrawer.tsx`](file:///Users/nguyenvanminhtam/Frontend/src/components/chat/ChatDrawer.tsx)
- Bổ sung điều kiện bảo vệ trong `useEffect`: nếu `!isOpen`, không kích hoạt tải hồ sơ shop và đơn hàng.

---

### 2.2. Nâng cấp toàn diện giao diện Thông báo & Khắc phục lỗi API

#### [MODIFY] [`src/services/notificationService.ts`](file:///Users/nguyenvanminhtam/Frontend/src/services/notificationService.ts)
1. **Cập nhật hàm `getNotifications`**:
   - Map thêm trường `referenceId: n.referenceId` và `imageUrl: n.imageUrl` vào đối tượng `AppNotification`.
2. **Khắc phục hàm `deleteAllNotifications`**:
   - Loại bỏ request `DELETE /notifications/DeleteAllNotifications` (nguyên nhân gây lỗi 404).
   - Gọi API chuẩn của Backend: `await apiClient.put("/notifications/MarkAllAsRead")` để đồng bộ trạng thái đã đọc lên database.
   - Lưu các ID cần ẩn vào `localStorage` (soft-hide) ở phía máy khách để làm sạch giao diện mà không tạo lỗi HTTP 404.

#### [MODIFY] [`src/types/index.ts`](file:///Users/nguyenvanminhtam/Frontend/src/types/index.ts)
- Bổ sung `referenceId?: string` và `imageUrl?: string` vào interface `AppNotification`.

#### [MODIFY] [`src/components/common/NotificationDropdown.tsx`](file:///Users/nguyenvanminhtam/Frontend/src/components/common/NotificationDropdown.tsx)
1. **Thiết kế lại giao diện sáng (Modern Light UI)**:
   - Thay nền tối bằng `bg-white`, bo góc mềm `rounded-2xl`, viền mỏng `border-slate-200/80`, bóng đổ `shadow-2xl`.
   - Tiêu đề thông báo rõ nét `text-slate-800 font-bold`, nội dung `text-slate-600 text-xs`, thời gian `text-slate-400 text-[11px]`.
   - Thông báo chưa đọc có nền xanh nhẹ `bg-blue-50/50` kèm chấm tròn xanh nổi bật.
2. **Sửa nút thao tác header**:
   - Nút **"Đã đọc tất cả"** (`CheckCheck` icon) gọi `markAllAsRead()` (Backend `PUT /api/notifications/MarkAllAsRead`).
   - Nút **"Dọn dẹp"** dọn sạch giao diện (lưu local soft-hide), không gọi API xóa lỗi.
3. **Tích hợp Xem Chi Tiết Thông Báo (`NotificationDetailModal`)**:
   - Khi click vào thông báo:
     - Tự động gọi `markAsRead(id)`.
     - Mở popup hiển thị đầy đủ: Tiêu đề, thời gian, loại thông báo, nội dung đầy đủ và hình ảnh đính kèm (nếu có).
     - Nếu có `referenceId` liên quan đến đơn hàng: Hiển thị nút **"Xem chi tiết đơn hàng"** dẫn trực tiếp tới đơn hàng đó.
     - Nếu là tin nhắn: Có nút **"Mở cuộc trò chuyện"**.

---

## 3. Kế Hoạch Kiểm Thử & Nghiệm Thu (Verification Plan)

### 3.1. Kiểm thử Biên dịch & TypeScript
```bash
npm run build
```

### 3.2. Kiểm thử Thực tế trên Trình duyệt (DevTools Network Tab)
1. **Kiểm tra vào trang chi tiết sách**:
   - Từ trang chủ, bấm vào cuốn sách *"Hoàng Tử Bé"*.
   - Mở tab Network:
     - **Xác nhận**: `GetBookDetail` chỉ được gọi **1 lần duy nhất**.
     - **Xác nhận**: **KHÔNG CÒN** bất kỳ lệnh gọi `GetUserOrders` hay `GetShopProfile` nào xuất hiện khi chỉ đang xem sách!
     - **Xác nhận**: API lấy đánh giá `GetBookFeedbacks` được gọi đúng chuẩn.
2. **Kiểm tra giao diện Thông báo**:
   - Bấm vào biểu tượng Quả chuông trên Header.
   - **Xác nhận**: Giao diện hiển thị nền trắng sáng sủa, chữ rõ ràng, độ tương phản cao, dễ đọc.
   - Bấm nút **"Đã đọc tất cả"**: Gọi `PUT /api/notifications/MarkAllAsRead` trả về `200 OK`.
   - Bấm nút **"Dọn dẹp"**: Dọn sạch danh sách, **KHÔNG CÒN lỗi đỏ 404** `DeleteAllNotifications` trong tab Network.
3. **Kiểm tra Xem chi tiết thông báo**:
   - Click vào 1 thông báo đơn hàng:
     - Modal chi tiết hiển thị đầy đủ thông tin.
     - Bấm nút "Xem chi tiết đơn hàng" -> Mở đúng trang chi tiết của đơn hàng đó.
