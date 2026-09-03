# Kế Hoạch Triển Khai Tính Năng Realtime (SignalR / WebSocket) Cho Frontend

Tài liệu này đánh giá hiện trạng mã nguồn Backend (.NET 8 SignalR) sau đợt cập nhật mới nhất và đề xuất kế hoạch triển khai chi tiết các tính năng tương ứng trên ứng dụng Frontend (React + TypeScript).

---

## 1. Kết Quả Kiểm Tra Mã Nguồn Backend Đối Với 7 Tính Năng Yêu Cầu

Qua kiểm tra toàn bộ mã nguồn Backend sau lệnh `git pull` (bao gồm `BookManagement.Api/Hubs/*`, `BookManagement.Api/Extensions/JwtExtensions.cs`, `BookManagement.Service/*`), **100% cả 7 tính năng đều ĐÃ ĐƯỢC BACKEND HỖ TRỢ VÀ TÍCH HỢP HOÀN CHỈNH**:

| STT | Tính Năng | Trạng Thái Backend | Chi Tiết Kỹ Thuật Ở Backend |
| :--- | :--- | :---: | :--- |
| **1** | **Chat trực tiếp trong phòng** | ✅ **Đã hỗ trợ đầy đủ** | `ChatHub` (`/hubs/chat`): phương thức `JoinRoom(roomName)` (quy ước: `chat_{chatId}`), `LeaveRoom(roomName)`, sự kiện `ReceiveMessage` bắn tới nhóm phòng khi có tin nhắn mới qua WebSocket hoặc REST API (`ChatRealtimeNotifier`). |
| **2** | **Chat: Nhận thông báo tin mới ngoài phòng** | ✅ **Đã hỗ trợ đầy đủ** | `ChatHub`: Khi khách nhắn hoặc shop nhắn, backend tự động tính `unreadCount`, trích xuất `messagePreview` và bắn sự kiện `ReceiveNewMessageNotification` tới `shop_{shopId}` hoặc `user_{userId}`. Client kết nối là tự động join group cá nhân nên nhận được ngay cả khi đang ở trang khác. |
| **3** | **Xác thực JWT cho WebSocket** | ✅ **Đã hỗ trợ đầy đủ** | `JwtExtensions.cs`: Cấu hình `OnMessageReceived` đọc `access_token` từ Query String (`/hubs/*?access_token=...`), kiểm tra tài khoản ACTIVE và phiên `UserSessions` hợp lệ. Cả 3 Hub (`ChatHub`, `NotificationHub`, `AppHub`) đều có `[Authorize]`. |
| **4** | **Quả chuông Thông báo (Notification)** | ✅ **Đã hỗ trợ đầy đủ** | `NotificationHub` (`/hubs/notifications`): `NotificationRealtimeNotifier` phát sự kiện `ReceiveNotification` tới `user_{userId}` mỗi khi `NotificationService.CreateAndSendNotificationAsync` được gọi. |
| **5** | **Đơn hàng mới tiếp nhận (New Order for Shop)** | ✅ **Đã hỗ trợ đầy đủ** | `AppHub` (`/hubs/app`): `OrderRealtimeNotifier.SendNewOrderAlertAsync` phát sự kiện `NewOrderAlert` kèm toàn bộ DTO đơn hàng tới nhóm `shop_{shopId}` ngay khi khách đặt hàng thành công trong `OrderService.CreateOrderAsync`. |
| **6** | **Cập nhật Trạng thái đơn & Vận chuyển** | ✅ **Đã hỗ trợ đầy đủ** | `AppHub`: `OrderRealtimeNotifier.SendOrderStatusChangedAsync` phát sự kiện `OrderStatusUpdated` tới `user_{userId}` và `order_{orderId}` khi đơn bị hủy, hoặc khi Webhook GHN (`ShippingService.ProcessGhnWebhookAsync`) báo trạng thái giao hàng `delivering`, `delivered`, `return`. |
| **7** | **Xác nhận Thanh toán Online (MoMo/VNPay/QR)** | ✅ **Đã hỗ trợ đầy đủ** | `AppHub`: `PaymentRealtimeNotifier.SendPaymentResultAsync` phát sự kiện `PaymentResult` vào kênh `order_{orderId}` ngay khi Webhook IPN của MoMo/QR xác nhận giao dịch thành công. Kèm theo cập nhật đơn `OrderStatusUpdated` sang `PAID`. |

---

## 2. User Review Required

> [!IMPORTANT]
> **Các Hub URL từ Backend:**
> - `ChatHub`: `/hubs/chat`
> - `NotificationHub`: `/hubs/notifications`
> - `AppHub`: `/hubs/app` (Quản lý Đơn hàng, Vận chuyển, Thanh toán)
>
> Tất cả các kết nối SignalR từ Frontend sẽ tự động đính kèm JWT token thông qua `accessTokenFactory: () => getStoredToken() || ""`.

> [!NOTE]
> Để tăng trải nghiệm người dùng (UX), khi có thông báo đơn hàng mới (cho Shop) hoặc tin nhắn mới, Frontend có thể kích hoạt âm thanh thông báo nhẹ (Notification Chime) và hiệu ứng rung nhẹ (pulse/bounce) trên icon quả chuông / tin nhắn.

---

## 3. Đề Xuất Kế Hoạch Triển Khai Frontend

### Giai đoạn 1: Nâng cấp Dịch vụ SignalR & Type Definitions (`src/services/` & `src/types/`)

#### [MODIFY] [types/index.ts](file:///Users/nguyenvanminhtam/Frontend/src/types/index.ts)
- Bổ sung các interface cho dữ liệu sự kiện Realtime:
  - `NewMessageNotificationPayload`: `{ chatId, senderId, senderName, messagePreview, timestamp, unreadCount }`
  - `NewOrderAlertPayload`: tương thích `Order` / `OrderResponse`
  - `OrderStatusUpdatedPayload`: `{ orderId, newStatus, message, updatedAt }`
  - `PaymentResultPayload`: `{ orderId, isSuccess, message, transactionCode }`

#### [MODIFY] [services/signalRService.ts](file:///Users/nguyenvanminhtam/Frontend/src/services/signalRService.ts)
- Hiện tại `signalRService` chỉ kết nối đơn lẻ tới `/hubs/chat`. Nâng cấp thành **Multi-Hub Realtime Manager**:
  - `Chat Connection`: kết nối `/hubs/chat` (xử lý phòng chat `ReceiveMessage`, và ngoài phòng `ReceiveNewMessageNotification`).
  - `Notification Connection`: kết nối `/hubs/notifications` (xử lý quả chuông `ReceiveNotification`).
  - `App Connection`: kết nối `/hubs/app` (xử lý `NewOrderAlert`, `OrderStatusUpdated`, `PaymentResult`, `JoinOrder`, `LeaveOrder`, `JoinShop`).
  - Tự động quản lý vòng đời kết nối: Reconnect khi mạng ngắt, tự động khởi tạo khi user đăng nhập, dọn dẹp khi logout.
  - Vẫn giữ nguyên 100% các hàm cũ (`startConnection`, `joinChatRoom`, `leaveChatRoom`, `onReceiveMessage`) để tránh vỡ code hiện tại.

---

### Giai đoạn 2: Quả chuông Thông báo & Huy hiệu Tin nhắn ngoài phòng (`Header.tsx` & `NotificationDropdown.tsx`)

#### [MODIFY] [components/common/NotificationDropdown.tsx](file:///Users/nguyenvanminhtam/Frontend/src/components/common/NotificationDropdown.tsx)
- Đăng ký lắng nghe sự kiện `ReceiveNotification` từ SignalR (`NotificationHub`):
  - Khi có thông báo mới: Tự động tăng `unreadCount` (+1), thêm ngay thông báo mới vào đầu danh sách `notifications`.
  - Hiển thị hiệu ứng chấm đỏ nhấp nháy trên icon Quả Chuông để người dùng biết ngay mà không cần tải lại trang.

#### [MODIFY] [components/common/Header.tsx](file:///Users/nguyenvanminhtam/Frontend/src/components/common/Header.tsx)
- Đăng ký lắng nghe sự kiện `ReceiveNewMessageNotification` từ `ChatHub`:
  - Quản lý state tổng `unreadChatCount`.
  - Hiển thị badge đỏ trên icon `MessageSquare` (Tin nhắn) ở Header khi có tin nhắn từ Shop hoặc Khách hàng mà phòng chat chưa mở.

---

### Giai đoạn 3: Trải nghiệm Chat Realtime ngoài phòng & trong phòng (`ChatDrawer.tsx`)

#### [MODIFY] [components/chat/ChatDrawer.tsx](file:///Users/nguyenvanminhtam/Frontend/src/components/chat/ChatDrawer.tsx)
- Lắng nghe `ReceiveNewMessageNotification`:
  - Cập nhật số tin chưa đọc (`unreadCount`) và xem trước tin nhắn (`lastMessage`) trên danh sách các hội thoại (Thread list) theo thời gian thực.
  - Tự động đẩy hội thoại có tin nhắn mới nhất lên vị trí đầu tiên của danh sách.
  - Khi người dùng bấm vào xem đúng cuộc trò chuyện đó, gửi API/Hub đánh dấu đã đọc và reset badge.

---

### Giai đoạn 4: Đơn Hàng Mới Cho Shop & Quản Lý Đơn Realtime (`ShopDashboardPage.tsx`)

#### [MODIFY] [pages/shop/ShopDashboardPage.tsx](file:///Users/nguyenvanminhtam/Frontend/src/pages/shop/ShopDashboardPage.tsx)
- Kết nối `AppHub` và lắng nghe `NewOrderAlert`:
  - Khi khách đặt hàng thành công, đơn hàng lập tức được chèn vào đầu bảng `orders` của Shop với trạng thái `PENDING`.
  - Cập nhật bộ đếm thống kê đơn chờ xử lý (badge trên tab "Đơn hàng").
  - Hiển thị thông báo Toast / Banner nổi bật: *"🎉 Bạn vừa có 1 đơn hàng mới #XXX trị giá YYY đ!"*.
  - Lắng nghe `ReceiveNewMessageNotification` để cập nhật badge số tin nhắn chưa đọc ở tab "Tin nhắn".

---

### Giai đoạn 5: Xác Nhận Thanh Toán Online Tự Động & Trạng Thái Vận Chuyển Realtime

#### [MODIFY] [pages/customer/CheckoutPage.tsx](file:///Users/nguyenvanminhtam/Frontend/src/pages/customer/CheckoutPage.tsx)
- Khi mở Modal thanh toán quét mã QR MoMo / Sandbox:
  - Tự động gọi `signalRService.joinOrder(orderId)` trên `AppHub`.
  - Lắng nghe sự kiện `PaymentResult`:
    - Nếu `isSuccess === true`: Modal tự động chuyển sang hiệu ứng thành công (tick xanh animation), thông báo thanh toán thành công và tự động điều hướng sang `PaymentResultPage` hoặc hoàn tất đơn hàng mà người dùng không cần bấm nút "Tôi đã thanh toán" thủ công!
    - Nếu `isSuccess === false`: Hiển thị cảnh báo lỗi thanh toán để khách thử lại.
  - Dọn dẹp gọi `signalRService.leaveOrder(orderId)` khi đóng modal.

#### [MODIFY] [pages/customer/OrderDetailPage.tsx](file:///Users/nguyenvanminhtam/Frontend/src/pages/customer/OrderDetailPage.tsx) & [OrdersPage.tsx](file:///Users/nguyenvanminhtam/Frontend/src/pages/customer/OrdersPage.tsx)
- Lắng nghe sự kiện `OrderStatusUpdated` từ `AppHub`:
  - Khi GHN webhook cập nhật trạng thái vận đơn (Đang giao hàng `DELIVERING`, Đã giao hàng `DELIVERED`, Hoàn trả `CANCELLED`) hoặc đơn chuyển sang `PAID`:
  - Tự động cập nhật trực quan Stepper / Badge trạng thái đơn hàng trên giao diện mà khách hàng không cần F5.

---

## 4. Verification Plan

### Kiểm tra tích hợp và xây dựng (Automated Build Check)
- Chạy lệnh build kiểm tra TypeScript:
  ```bash
  npm run build
  ```
  Đảm bảo không có bất kỳ lỗi cú pháp, typing hay import nào.

### Kiểm tra thủ công (Manual Verification Flow)
1. **Kiểm tra JWT & Kết nối**:
   - Đăng nhập tài khoản -> Mở DevTools Network tab (WS filter) -> Kiểm tra kết nối tới `/hubs/chat`, `/hubs/notifications`, `/hubs/app` có đính kèm query parameter `?access_token=...` và trả về HTTP 101 Switching Protocols.
2. **Kiểm tra Chat trong phòng & ngoài phòng**:
   - Mở 2 cửa sổ trình duyệt (1 Khách hàng, 1 Shop):
     - Gửi tin nhắn khi đang mở phòng chat -> Cả hai nhận ngay lập tức qua `ReceiveMessage`.
     - Đóng Chat Drawer của Khách hàng, Shop gửi tin nhắn -> Kiểm tra icon Chat trên Header của Khách hàng xuất hiện badge đỏ và popup tin nhắn preview qua `ReceiveNewMessageNotification`.
3. **Kiểm tra Quả Chuông Thông Báo**:
   - Khi có hành động phát sinh thông báo từ hệ thống -> Quả chuông tự động cập nhật số đếm đỏ và hiển thị mục thông báo mới mà không cần F5.
4. **Kiểm tra Đơn hàng mới (Shop Alert)**:
   - Khách hàng thực hiện đặt đơn hàng -> Màn hình Shop Dashboard tự động xuất hiện dòng đơn hàng mới trên đầu bảng và hiện toast thông báo.
5. **Kiểm tra Thanh toán MoMo / QR Realtime**:
   - Mở modal quét mã MoMo QR tại Checkout -> Giả lập hoặc trigger webhook IPN -> Trình duyệt tự nhận sự kiện `PaymentResult` và chuyển hướng thành công.
