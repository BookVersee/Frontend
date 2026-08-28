# Kế hoạch Thực hiện: Nâng cấp Phân hệ Chat Real-time Tư vấn Sách (Customer - Shop)

Tài liệu này xác định kế hoạch chi tiết để hoàn thiện giao diện Frontend và kết nối thời gian thực (Real-time SignalR) cho tính năng Chat tư vấn giữa Khách hàng (Customer) và Chủ Gian hàng (Shop) dựa trên API contract hiện có của Backend.

---

## 1. Mục tiêu Cần Đạt

1. **Kết nối Real-time 2 chiều bằng SignalR WebSocket**: Khách hàng và Shop nhận được tin nhắn của nhau ngay lập tức mà không cần tải lại trang.
2. **Sửa triệt để lỗi Contract & Routing**: Chuẩn hóa việc truyền `shopId`, `userId`, `chatId` giữa UI và Backend REST API.
3. **Ghim Thẻ Sản phẩm (Book Context) khi Chat**: Khi khách bấm chat từ [BookDetailPage.tsx](file:///Users/nguyenvanminhtam/Frontend/src/pages/customer/BookDetailPage.tsx), khung chat hiển thị ảnh bìa, tên sách, giá và các câu hỏi mẫu nhanh.
4. **Bổ sung Tab Hộp thư tư vấn trên Shop Dashboard**: Cung cấp giao diện 2 cột chuyên nghiệp cho Chủ shop xem danh sách khách và trả lời tin nhắn trực tiếp trong [ShopDashboardPage.tsx](file:///Users/nguyenvanminhtam/Frontend/src/pages/shop/ShopDashboardPage.tsx).

---

## 2. Kế hoạch Thay đổi Chi tiết (Proposed Changes)

### A. Thư viện & Dịch vụ Real-time (Services Layer)

#### [NEW] [src/services/signalRService.ts](file:///Users/nguyenvanminhtam/Frontend/src/services/signalRService.ts)
- Quản lý vòng đời kết nối `HubConnection` tới WebSocket `/hubs/chat`.
- Cấu hình `withUrl("/hubs/chat", { accessTokenFactory: () => token })` và `withAutomaticReconnect()`.
- Cung cấp các hàm:
  - `startConnection()`: Khởi tạo kết nối khi user đăng nhập.
  - `joinChatRoom(chatId)`: Tham gia group `chat_{chatId}`.
  - `leaveChatRoom(chatId)`: Rời group khi đóng chat.
  - `onReceiveMessage(callback)`: Đăng ký lắng nghe sự kiện `ReceiveMessage` từ server.

#### [MODIFY] [src/services/chatService.ts](file:///Users/nguyenvanminhtam/Frontend/src/services/chatService.ts)
- Sửa hàm `getMessages(shopId, userId, chatId)`:
  - Tự động lấy danh sách `GetUserConversations` để tìm `chatId` hợp lệ giữa khách và shop trước khi gọi `GetConversationMessages`.
  - Khắc phục lỗi truyền nhầm `shopId` vào `chatId`.
- Hàm `sendMessage`: Gửi đúng DTO `{ shopId, userId, chatId, content, imageUrl }` lên `POST /api/chat/SendMessage`.

---

### B. Giao diện Phía Khách hàng (Customer Chat UI)

#### [MODIFY] [src/components/chat/ChatDrawer.tsx](file:///Users/nguyenvanminhtam/Frontend/src/components/chat/ChatDrawer.tsx)
- Bổ sung prop `book?: Book` để nhận ngữ cảnh cuốn sách đang xem.
- **Thẻ tóm tắt sách ghim ở đầu khung chat**:
  - Bìa sách, tên sách, giá bán niêm yết, tình trạng tồn kho.
  - Các nút câu hỏi mẫu gửi nhanh (Quick Prompts):
    - 💬 *"Shop ơi, cuốn sách này còn hàng không?"*
    - 🎁 *"Sách này có kèm quà tặng / bookmark không shop?"*
    - 📷 *"Cho mình xin thêm hình ảnh thật của sách với ạ"*
- Tích hợp `signalRService`: Tự động kết nối và lắng nghe tin nhắn phản hồi từ Shop theo thời gian thực.
- Hiển thị trạng thái tin nhắn (Thời gian gửi, trạng thái đang gửi, đã gửi).

#### [MODIFY] [src/pages/customer/BookDetailPage.tsx](file:///Users/nguyenvanminhtam/Frontend/src/pages/customer/BookDetailPage.tsx)
- Truyền đối tượng `book={book}` vào component `<ChatDrawer />` khi người dùng bấm nút "Chat với Shop".

---

### C. Giao diện Phía Chủ Gian Hàng (Shop Dashboard UI)

#### [MODIFY] [src/pages/shop/ShopDashboardPage.tsx](file:///Users/nguyenvanminhtam/Frontend/src/pages/shop/ShopDashboardPage.tsx)
- Bổ sung Tab **"Hộp thư tư vấn"** trên thanh menu điều hướng của Shop:
  - Icon `MessageSquare` kèm Badge hiển thị tổng số tin nhắn chưa đọc.
- **Thiết kế giao diện 2 cột tiêu chuẩn**:
  - **Cột trái (Danh sách cuộc trò chuyện):**
    - Gọi API `GET /api/chat/GetShopConversations`.
    - Hiển thị avatar khách hàng, tên khách, đoạn trích tin nhắn cuối cùng, thời gian và số tin chưa đọc (`unreadCount`).
  - **Cột phải (Cửa sổ hội thoại trực tiếp):**
    - Hiển thị toàn bộ lịch sử tin nhắn của khách hàng được chọn qua `GetConversationMessages`.
    - Khung nhập tin nhắn trả lời khách hàng + nút gửi ảnh/đính kèm.
    - Lắng nghe SignalR để tự động cập nhật khi khách hàng gửi tin nhắn mới.

---

### D. Thông báo & Header (Global UI)

#### [MODIFY] [src/components/common/Header.tsx](file:///Users/nguyenvanminhtam/Frontend/src/components/common/Header.tsx)
- Bổ sung chấm đỏ hiển thị số lượng tin nhắn chưa đọc trên icon Chat ở Header khi có phản hồi mới từ Shop.

---

## 3. Kế hoạch Kiểm tra & Xác minh (Verification Plan)

### Kiểm tra Thủ công (Manual Verification)
1. **Kiểm tra luồng Khách hàng hỏi về sách:**
   - Đăng nhập tài khoản Customer -> Mở chi tiết 1 cuốn sách bất kỳ.
   - Bấm nút **"Chat với Shop"** -> Kiểm tra thẻ thông tin sách xuất hiện ở đầu Drawer.
   - Bấm câu hỏi mẫu nhanh -> Kiểm tra tin nhắn được gửi lên Backend và hiển thị ngay trên khung chat.
2. **Kiểm tra luồng Shop tiếp nhận và trả lời:**
   - Mở cửa sổ ẩn danh hoặc trình duyệt khác, đăng nhập tài khoản Shop của cuốn sách đó.
   - Vào `ShopDashboardPage` -> Chọn Tab **"Hộp thư tư vấn"**.
   - Kiểm tra thấy tin nhắn của khách hàng vừa gửi xuất hiện lập tức theo thời gian thực (Real-time).
   - Shop gõ tin nhắn trả lời -> Kiểm tra bên trình duyệt của Khách hàng nhận được tin nhắn ngay lập tức mà không cần F5/tải lại trang.
