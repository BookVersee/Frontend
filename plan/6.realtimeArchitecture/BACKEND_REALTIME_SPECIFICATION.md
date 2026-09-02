# [RFC / SPEC] KẾ HOẠCH TRIỂN KHAI HẠ TẦNG REALTIME SIGNALR CHO TOÀN BỘ HỆ THỐNG BOOKVERSE

* **Tác giả**: Senior Frontend Engineer
* **Người nhận**: Backend Development Team (.NET Core / C#)
* **Ngày tạo**: Tháng 09/2026
* **Mục tiêu**: Chuẩn hóa và mở rộng hạ tầng Realtime Event-Driven bằng ASP.NET Core SignalR, phục vụ đầy đủ 4 đối tượng người dùng: **Khách hàng (Customer)**, **Chủ Shop (Shop)**, **Giao hàng (Shipper)** và **Quản trị viên (Admin)**.

---

## I. ĐÁNH GIÁ HIỆN TRẠNG HẠ TẦNG BACKEND HIỆN TẠI

Sau khi Senior Frontend rà soát toàn bộ source code Backend (`BookManagement.API` và `BookManagement.Service`), hiện trạng như sau:

| Tính năng nghiệp vụ | Hiện trạng Backend | Đánh giá | Vấn đề tồn đọng |
| :--- | :---: | :---: | :--- |
| **1. Chat trực tiếp trong phòng** | 🟡 Đã có 50% | Tạm ổn | Đã có `ChatHub.cs`, `ChatRealtimeNotifier.cs`. Nhắn tin trong 1 phòng `chat_{chatId}` đã chạy được. |
| **2. Chat: Nhận thông báo tin mới ngoài phòng** | ❌ Chưa có | Thiếu sót | Backend chỉ bắn tin nhắn vào `chat_{chatId}`, chưa bắn vào kênh cá nhân `user_{userId}` hay `shop_{shopId}`, nên người đang ở tab khác không nhận được badge. |
| **3. Xác thực JWT cho WebSocket** | ⚠️ Lỗi tiềm ẩn | Cần sửa ngay | `JwtExtensions.cs` thiếu `OnMessageReceived` để đọc `access_token` từ query string. Kết nối WebSocket thuần có thể bị lỗi 401 Unauthorized. |
| **4. Quả chuông Thông báo (Notification)** | ❌ 0% | Chưa có | `NotificationService.cs` chỉ đọc/ghi DB, không hề inject Hub để push realtime. |
| **5. Đơn hàng mới tiếp nhận (New Order for Shop)** | ❌ 0% | Rất cấp thiết | `OrderService.CreateOrderAsync` lưu DB xong không phát tín hiệu tới Shop. |
| **6. Cập nhật Trạng thái đơn & Vận chuyển** | ❌ 0% | Cần thiết | Hủy đơn, đổi trạng thái đóng gói, giao hàng thành công đều chưa push tới khách/shop. |
| **7. Xác nhận Thanh toán Online (MoMo/VNPay/QR)** | ❌ 0% | Cần thiết | Callback/Webhook thanh toán thành công chưa push realtime về phiên làm việc của user trên máy tính. |

---

## II. THIẾT KẾ KIẾN TRÚC HẠ TẦNG SIGNALR ĐỀ XUẤT

### 1. Kiến trúc Hub tập trung (Single Unified Hub)

Thay vì tạo nhiều Hub rời rạc (`ChatHub`, `NotificationHub`, `OrderHub`) khiến trình duyệt phải mở 3-4 kết nối WebSocket đồng thời (gây tốn RAM client và quá tải Connection Pool ở Server), **đề xuất gom thành 1 Hub trung tâm**:

* **Endpoint Hub**: `/hubs/bookverse` (hoặc mở rộng trực tiếp trên `/hubs/chat` hiện có).

```mermaid
graph TD
    Client[Frontend Client / Browser] <==> |WebSocket Connection: /hubs/bookverse| Hub[SignalR Central Hub]
    
    subgraph Backend Event Triggers
        ChatService --> |Push Message| Hub
        NotificationService --> |Push Notification| Hub
        OrderService --> |Push New Order / Status| Hub
        DeliveryService --> |Push Delivery Tracking| Hub
        PaymentService --> |Push Payment Result| Hub
    end

    subgraph Client Groups
        Hub -.-> |Group: chat_{chatId}| RoomSubscribers[Người trong phòng chat]
        Hub -.-> |Group: user_{userId}| PersonalUser[Khách hàng nhận thông báo/đơn]
        Hub -.-> |Group: shop_{shopId}| ShopOwner[Shop nhận đơn mới/tin nhắn mới]
        Hub -.-> |Group: role_shipper| Shippers[Shipper nhận chuyến giao]
    end
```

### 2. Quản lý Nhóm tự động (Automatic Group Mapping on Connect)

Khi Client kết nối vào Hub kèm JWT Token:
* Lấy `userId` và `role` từ `Context.User`.
* Tự động thêm Connection vào Group cá nhân:
  * Khách hàng: `user_{userId}`
  * Chủ shop: `shop_{shopId}` (với `shopId` lấy từ claim hoặc DB)
  * Shipper: `role_shipper` và `shipper_{userId}`
* Khi ngắt kết nối: SignalR tự động dọn dẹp connection khỏi các group.

---

## III. ĐẶC TẢ CHI TIẾT CÁC SỰ KIỆN REALTIME (EVENT CONTRACTS)

### 1. Sự kiện: Tin nhắn Chat & Badge tin nhắn mới
* **Tên Event**: `ReceiveMessage` (trong phòng chat) và `ReceiveNewChatBadge` (ngoài phòng chat).
* **Nơi kích hoạt**: `ChatService.SendMessageAsync`
* **Target Group**:
  * Group `chat_{chatId}`: Gửi toàn bộ `MessageDto`.
  * Group `user_{receiverId}` hoặc `shop_{shopId}`: Gửi object tóm tắt để nhảy badge chấm đỏ:
    ```json
    {
      "chatId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
      "senderId": "4fa85f64-5717-4562-b3fc-2c963f66afa7",
      "senderName": "Nguyễn Văn A",
      "snippet": "Shop ơi cuốn này còn bản bìa cứng không?",
      "createdAt": "2026-09-02T12:00:00Z"
    }
    ```

---

### 2. Sự kiện: Thông báo quả chuông (System Notification)
* **Tên Event**: `ReceiveNotification`
* **Nơi kích hoạt**: Khi thêm bản ghi mới vào bảng `Notifications` trong `NotificationService` (hoặc các Service tạo thông báo như đơn hàng, hoàn tiền).
* **Target Group**: Group `user_{userId}`
* **Payload**:
  ```json
  {
    "id": "7fa85f64-5717-4562-b3fc-2c963f66afa8",
    "title": "Đơn hàng #12345 đã được xác nhận",
    "content": "Shop Nhã Nam Books đã bắt đầu đóng gói đơn hàng của bạn.",
    "type": "ORDER",
    "link": "/orders/12345",
    "createdAt": "2026-09-02T12:05:00Z"
  }
  ```

---

### 3. Sự kiện: Đơn hàng mới tiếp nhận (New Order for Shop) — *Cực kỳ quan trọng*
* **Tên Event**: `NewOrderIncoming`
* **Nơi kích hoạt**: Cuối hàm `OrderService.CreateOrderAsync` (sau khi `SaveChangesAsync` thành công).
* **Target Group**: Group `shop_{shopId}` của Shop bán cuốn sách đó.
* **Payload**:
  ```json
  {
    "orderId": "8fa85f64-5717-4562-b3fc-2c963f66afa9",
    "customerName": "Lê Hoàng Mai",
    "totalAmount": 195000,
    "itemsCount": 2,
    "paymentMethod": "COD",
    "createdAt": "2026-09-02T12:10:00Z"
  }
  ```
* **Phản ứng Frontend**: Dashboard Shop phát âm thanh chuông báo *"Ting ting"*, thẻ "Đơn chờ xác nhận" tự động nhảy số +1, dòng đơn hàng mới tự động chèn vào đầu bảng.

---

### 4. Sự kiện: Cập nhật Trạng thái Đơn hàng & Vận chuyển (Order Status Updated)
* **Tên Event**: `OrderStatusChanged`
* **Nơi kích hoạt**:
  * `ShopService.UpdateOrderStatus`
  * `OrderService.CancelOrderAsync`
  * `DeliveryService.UpdateDeliveryStatusAsync`
* **Target Group**: Group `user_{customerId}` (Khách) và Group `shop_{shopId}` (Shop).
* **Payload**:
  ```json
  {
    "orderId": "8fa85f64-5717-4562-b3fc-2c963f66afa9",
    "oldStatus": "PENDING",
    "newStatus": "PROCESSING",
    "updatedAt": "2026-09-02T12:15:00Z",
    "notes": "Shop đã xác nhận đóng gói sản phẩm"
  }
  ```
* **Phản ứng Frontend**: Màn hình chi tiết đơn hàng của khách lập tức chuyển bước tiến trình sang màu xanh; nếu khách hủy đơn thì màn hình shop tự động hiển thị nhãn "Đã hủy".

---

### 5. Sự kiện: Xác nhận thanh toán Online (Payment QR / Webhook Success)
* **Tên Event**: `PaymentConfirmed`
* **Nơi kích hoạt**: `PaymentController.Callback` hoặc MoMo IPN Webhook Handler.
* **Target Group**: Group `user_{userId}` hoặc Group `order_{orderId}`.
* **Payload**:
  ```json
  {
    "orderId": "8fa85f64-5717-4562-b3fc-2c963f66afa9",
    "status": "SUCCESS",
    "transactionId": "MOMO_123456789",
    "amount": 195000,
    "message": "Thanh toán thành công qua MoMo"
  }
  ```
* **Phản ứng Frontend**: Màn hình quét mã QR của khách tự động đóng lại và điều hướng khách sang trang kết quả thanh toán thành công.

---

## IV. HƯỚNG DẪN KỸ THUẬT CHO BACKEND TEAM (C# .NET)

### Bước 1: Sửa file `JwtExtensions.cs` để nhận Token qua WebSocket
Trong `AddJwtBearer`, bổ sung sự kiện `OnMessageReceived`:

```csharp
options.Events = new JwtBearerEvents
{
    OnMessageReceived = context =>
    {
        // Trình duyệt gửi token qua query string khi bắt tay WebSocket SignalR
        var accessToken = context.Request.Query["access_token"];
        var path = context.HttpContext.Request.Path;
        if (!string.IsNullOrEmpty(accessToken) && path.StartsWithSegments("/hubs"))
        {
            context.Token = accessToken;
        }
        return Task.CompletedTask;
    },
    OnTokenValidated = async context =>
    {
        // Logic kiểm tra UserSession hiện tại giữ nguyên...
    }
};
```

---

### Bước 2: Nâng cấp `ChatHub.cs` hỗ trợ quản lý Group theo User và Shop

```csharp
[Authorize]
public class AppHub : Hub
{
    public override async Task OnConnectedAsync()
    {
        var userId = Context.User?.FindFirst(ClaimTypes.NameIdentifier)?.Value 
                     ?? Context.User?.FindFirst("sub")?.Value;
        var role = Context.User?.FindFirst(ClaimTypes.Role)?.Value;

        if (!string.IsNullOrEmpty(userId))
        {
            // Tự động gán vào group cá nhân
            await Groups.AddToGroupAsync(Context.ConnectionId, $"user_{userId}");

            // Nếu là Shop, gán vào group shop
            if (role == "SHOP")
            {
                await Groups.AddToGroupAsync(Context.ConnectionId, $"shop_{userId}");
            }
            else if (role == "SHIPPER" || role == "DELIVER")
            {
                await Groups.AddToGroupAsync(Context.ConnectionId, "role_shipper");
            }
        }

        await base.OnConnectedAsync();
    }

    public async Task JoinRoom(string roomName)
    {
        await Groups.AddToGroupAsync(Context.ConnectionId, roomName);
    }

    public async Task LeaveRoom(string roomName)
    {
        await Groups.RemoveFromGroupAsync(Context.ConnectionId, roomName);
    }
}
```

---

### Bước 3: Tạo Service Notifier chung (`IRealtimeNotificationService`)

Tạo interface và implementation để inject vào các Service nghiệp vụ:

```csharp
public interface IRealtimeNotificationService
{
    Task NotifyUserAsync(Guid userId, string eventName, object data);
    Task NotifyShopAsync(Guid shopId, string eventName, object data);
    Task NotifyRoomAsync(string roomName, string eventName, object data);
    Task NotifyAllShippersAsync(string eventName, object data);
}

public class RealtimeNotificationService : IRealtimeNotificationService
{
    private readonly IHubContext<AppHub> _hubContext;

    public RealtimeNotificationService(IHubContext<AppHub> hubContext)
    {
        _hubContext = hubContext;
    }

    public Task NotifyUserAsync(Guid userId, string eventName, object data) =>
        _hubContext.Clients.Group($"user_{userId}").SendAsync(eventName, data);

    public Task NotifyShopAsync(Guid shopId, string eventName, object data) =>
        _hubContext.Clients.Group($"shop_{shopId}").SendAsync(eventName, data);

    public Task NotifyRoomAsync(string roomName, string eventName, object data) =>
        _hubContext.Clients.Group(roomName).SendAsync(eventName, data);

    public Task NotifyAllShippersAsync(string eventName, object data) =>
        _hubContext.Clients.Group("role_shipper").SendAsync(eventName, data);
}
```

Đăng ký DI trong `Program.cs`:
```csharp
builder.Services.AddScoped<IRealtimeNotificationService, RealtimeNotificationService>();
```

---

### Bước 4: Gọi Notifier trong các Service tương ứng

1. **Trong `NotificationService.cs`:**
   ```csharp
   await _realtimeNotifier.NotifyUserAsync(userId, "ReceiveNotification", MapToResponse(notification));
   ```
2. **Trong `OrderService.CreateOrderAsync`:**
   ```csharp
   await _realtimeNotifier.NotifyShopAsync(order.ShopId, "NewOrderIncoming", new {
       orderId = order.Id,
       customerName = user.FullName,
       totalAmount = order.TotalAmount
   });
   ```
3. **Trong `ShopService.UpdateOrderStatus` / `DeliveryService`:**
   ```csharp
   await _realtimeNotifier.NotifyUserAsync(order.UserId, "OrderStatusChanged", new {
       orderId = order.Id,
       newStatus = status
   });
   ```

---

## V. TIÊU CHÍ NGHIỆM THU & KỊCH BẢN KIỂM THỬ (ACCEPTANCE CRITERIA)

1. **Test 1 - WebSocket Handshake:** Mở tab Network/WS trên DevTools, kết nối tới `/hubs/chat` (hoặc `/hubs/bookverse`) phản hồi mã `101 Switching Protocols` thành công, không bị 401.
2. **Test 2 - New Order:** Mở 2 trình duyệt:
   * Trình duyệt A: Đăng nhập tài khoản Shop, đứng tại trang Shop Dashboard.
   * Trình duyệt B: Đăng nhập tài khoản Khách hàng, bấm đặt đơn hàng của Shop A.
   * **Kỳ vọng:** Màn hình của Shop A ngay lập tức hiện đơn mới và thẻ "Đơn chờ xác nhận" tăng lên 1 mà không cần F5.
3. **Test 3 - Notification Badge:** Khi Admin hoặc hệ thống phát sinh thông báo cho User, quả chuông của User tự động nhảy số đỏ.
4. **Test 4 - Chat Notification:** Khi Shop đang ở tab "Đơn hàng", có khách nhắn tin tới, tab "Hộp thư tư vấn" tự động nhảy badge số tin nhắn chưa đọc.
