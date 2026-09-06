# Kế Hoạch Xử Lý Lỗi 400 "Invalid order status: SHIPPED" & Bàn Giao Đơn Hàng GHN Sandbox

Phân tích chi tiết các trường dữ liệu Backend tiếp nhận, cấu trúc payload gửi sang Sandbox Giao Hàng Nhanh (GHN), nguyên nhân gốc rễ của lỗi HTTP 400 và kế hoạch điều chỉnh toàn diện phía Frontend.

---

## 1. Dữ Liệu Backend Tiếp Nhận & Payload Gửi Sang GHN Sandbox

### 1.1. Dữ liệu Backend tiếp nhận khi Shop thao tác đơn hàng
Trên Backend (.NET 8), có **2 API riêng biệt** phục vụ việc cập nhật đơn và bàn giao đơn vị vận chuyển:

#### 🔹 API 1: Bàn giao đơn vị vận chuyển GHN chuyên dụng (`POST /api/shipping/CreateGhnOrder`)
- **Controller**: [`ShippingController.cs`](file:///Users/nguyenvanminhtam/Frontend/Backend/BookManagement.Api/Controllers/ShippingController.cs)
- **Quyền hạn**: `[Authorize(Roles = "SHOP,ADMIN,SUPER_ADMIN")]`
- **Request Body DTO** ([`CreateGhnOrderDto`](file:///Users/nguyenvanminhtam/Frontend/Backend/BookManagement.Service/Delivery/DeliveryRequest.cs)):
  ```json
  {
    "orderId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "requiredNote": "CHOXEMHANGKHONGTHU" // hoặc null
  }
  ```
- **Xử lý nghiệp vụ tại Backend**:
  1. Tự động kiểm tra quyền sở hữu đơn hàng của Shop.
  2. Bốc thông tin người gửi từ bảng `Shops` và người nhận từ đơn hàng `Orders`.
  3. Gửi thông tin sang API GHN Sandbox để sinh mã vận đơn.
  4. Lưu bản ghi vào bảng `Deliveries` (với `TrackingNumber = mã GHN`, `CarrierName = "GHN"`, `ShipFee = phí GHN`).
  5. **Tự động chuyển trạng thái đơn hàng sang `OrderStatus.SHIPPING`** và gửi thông báo SignalR Realtime đến khách hàng.

---

#### 🔹 API 2: Cập nhật trạng thái đơn hàng thủ công (`POST /api/shop/UpdateOrderStatus?orderId={Guid}`)
- **Controller**: [`ShopController.cs`](file:///Users/nguyenvanminhtam/Frontend/Backend/BookManagement.Api/Controllers/ShopController.cs)
- **Quyền hạn**: `[Authorize(Roles = "SHOP")]`
- **Query Parameter**: `orderId` (GUID)
- **Request Body DTO** ([`UpdateOrderStatusDto`](file:///Users/nguyenvanminhtam/Frontend/Backend/BookManagement.Service/Order/OrderRequest.cs)):
  ```json
  {
    "orderStatus": "SHIPPING",  // hoặc newStatus
    "weight": 500,              // Trọng lượng gói hàng (gram hoặc kg, optional)
    "note": "Đã đóng gói xong",  // Ghi chú (optional)
    "reason": null              // Lý do nếu từ chối đơn
  }
  ```
- **RÀNG BUỘC NGHIÊM NGẶT CỦA BACKEND**:
  Backend sử dụng `Enum.TryParse<OrderStatus>(rawStatus, true, out var targetStatus)`. Các giá trị hợp lệ duy nhất trong enum [`OrderStatus.cs`](file:///Users/nguyenvanminhtam/Frontend/Backend/BookManagement.Repository/Entities/Enums/OrderStatus.cs) gồm:
  - `PENDING` (Chờ xử lý)
  - `PAID` (Đã thanh toán)
  - `PROCESSING` (Đang chuẩn bị hàng)
  - **`SHIPPING`** (Đang vận chuyển giao hàng - **Dạng V-ing, KHÔNG PHẢI `SHIPPED`**)
  - `DELIVERING` (Đang phát hàng)
  - `DELIVERED` (Đã giao thành công)
  - `CANCELLED` (Đã hủy)
  - `FAILED` (Thất bại)
  - `APPROVED` (Đã duyệt)

---

### 1.2. Các trường dữ liệu khi gửi sang Sandbox GHN
Backend tích hợp trực tiếp với API GHN Sandbox qua Service [`GhnService.cs`](file:///Users/nguyenvanminhtam/Frontend/Backend/BookManagement.Service/Shipping/GhnService.cs):
- **Endpoint**: `POST https://dev-online-gateway.ghn.vn/shiip/public-api/v2/shipping-order/create`
- **Headers**:
  - `Token`: Token GHN Sandbox (lấy từ cấu hình `appsettings.json`, ví dụ: `e1dfd899-a4a0-11f1-a973-aee5264794df`)
  - `ShopId`: Shop ID GHN (ví dụ: `216436`)
  - `Content-Type`: `application/json`
- **Cấu trúc Payload gửi sang GHN Sandbox**:
  ```json
  {
    "payment_type_id": 2,                 // 1: Shop trả cước, 2: Người mua trả cước (mặc định 2)
    "note": "Đơn hàng BookVerse",
    "required_note": "CHOXEMHANGKHONGTHU",// Ghi chú bắt buộc của GHN (Cho xem hàng không cho thử)

    // THÔNG TIN NGƯỜI GỬI (SHOP BÁN SÁCH)
    "from_name": "Tên cửa hàng",
    "from_phone": "Số điện thoại shop",
    "from_address": "Địa chỉ kho hàng shop",
    "from_ward_name": "Phường/Xã",
    "from_district_name": "Quận/Huyện",
    "from_province_name": "Tỉnh/Thành phố",

    // THÔNG TIN NGƯỜI NHẬN (KHÁCH HÀNG MUA SÁCH)
    "to_name": "Nguyễn Văn An",
    "to_phone": "0987654321",
    "to_address": "123 Nguyễn Huệ, Phường Bến Nghé, Quận 1, TP.HCM",
    "to_ward_code": "20311",              // Mã Phường/Xã theo danh mục GHN
    "to_district_id": 1444,               // Mã Quận/Huyện theo danh mục GHN

    // THÔNG TIN KIỆN HÀNG ĐÓNG GÓI
    "weight": 500,                        // Trọng lượng gói hàng (gram)
    "length": 20,                         // Chiều dài (cm)
    "width": 15,                          // Chiều rộng (cm)
    "height": 5,                          // Chiều cao (cm)
    "service_id": 53320,                  // Gói dịch vụ vận chuyển chuẩn
    "service_type_id": 2,                 // Dịch vụ giao hàng E-commerce

    // DANH MỤC SẢN PHẨM TRONG GÓI HÀNG
    "items": [
      {
        "name": "Cây Cam Ngọt Của Tôi",
        "quantity": 1,
        "price": 110000,
        "weight": 200
      }
    ]
  }
  ```
- **GHN Sandbox phản hồi**:
  - Mã vận đơn thực tế (ví dụ: `order_code: "GHNA1B2C3"`).
  - Phí cước thực tế (ví dụ: `total_fee: 30000`).

---

## 2. Nguyên Nhân Gốc Rễ Của Lỗi (Root Cause)

1. **Lệch Enum giữa Frontend và Backend**:
   - Khi bấm nút *"Bàn giao shipper GHN"*, file [`ShopDashboardPage.tsx`](file:///Users/nguyenvanminhtam/Frontend/src/pages/shop/ShopDashboardPage.tsx#L1563) đang gọi:
     ```tsx
     onClick={() => handleUpdateStatus(order.id, "SHIPPED")}
     ```
   - Chuỗi gửi lên là `"SHIPPED"` (quá khứ).
   - Backend chỉ định nghĩa enum là **`SHIPPING`** (hiện tại tiếp diễn, đang vận chuyển). Khi Backend parse `Enum.TryParse<OrderStatus>("SHIPPED")` bị thất bại, ném ra lỗi:
     ```
     Invalid order status: SHIPPED
     ```
2. **Gọi sai endpoint nghiệp vụ**:
   - Nút bấm là *"Bàn giao shipper GHN"*, nhưng code hiện tại lại gọi API cập nhật status thông thường `UpdateOrderStatus` thay vì gọi API tạo vận đơn GHN thực tế (`/api/shipping/CreateGhnOrder`).
   - Kết quả: Kể cả nếu đổi thành `SHIPPING`, đơn hàng vẫn chỉ đổi trạng thái "chay" mà không tạo được mã vận đơn trên hệ thống GHN.

---

## User Review Required

> [!IMPORTANT]
> **Đồng bộ hóa Enum `OrderStatus`**:
> Cần chuẩn hóa kiểu dữ liệu `OrderStatus` ở Frontend để bao gồm cả `SHIPPING` (chuẩn Backend) và `SHIPPED` (tương thích ngược cho UI/Mock), và đảm bảo khi gửi request lên Backend luôn luôn gửi `SHIPPING`.

> [!TIP]
> **Tạo vận đơn GHN thực sự**:
> Khi Shop bấm *"Bàn giao shipper GHN"*, ưu tiên gọi API tạo vận đơn GHN [`POST /api/shipping/CreateGhnOrder`](file:///Users/nguyenvanminhtam/Frontend/Backend/BookManagement.Api/Controllers/ShippingController.cs#L27). Backend sẽ tự gọi GHN Sandbox, sinh mã vận đơn `GHN...` và chuyển trạng thái đơn hàng sang `SHIPPING` hoàn chỉnh.

---

## Proposed Changes

### Component 1: Type Definitions (`src/types/index.ts`)

#### [MODIFY] [src/types/index.ts](file:///Users/nguyenvanminhtam/Frontend/src/types/index.ts)
- Bổ sung `"SHIPPING"` vào union type `OrderStatus`:
  ```typescript
  export type OrderStatus =
    | "PENDING"
    | "PAID"
    | "PROCESSING"
    | "SHIPPING"
    | "SHIPPED"
    | "DELIVERING"
    | "DELIVERED"
    | "CANCELLED"
    | "RETURNED";
  ```

---

### Component 2: Service Vận Chuyển (`src/services/shippingService.ts`)

#### [NEW] [src/services/shippingService.ts](file:///Users/nguyenvanminhtam/Frontend/src/services/shippingService.ts)
- Tạo service chuyên trách gọi API vận chuyển của Backend:
  ```typescript
  export const shippingService = {
    async createGhnOrder(orderId: string | number, requiredNote = "CHOXEMHANGKHONGTHU") {
      const res = await apiClient.post("/shipping/CreateGhnOrder", {
        orderId,
        requiredNote,
      });
      return res.data?.data;
    }
  };
  ```

#### [MODIFY] [src/services/shopService.ts](file:///Users/nguyenvanminhtam/Frontend/src/services/shopService.ts)
- Trong hàm `updateOrderStatus`: Chuẩn hóa giá trị `status` trước khi gửi lên API Backend:
  ```typescript
  const backendStatus = status === "SHIPPED" ? "SHIPPING" : status;
  await apiClient.post("/shop/UpdateOrderStatus", {
    newStatus: backendStatus,
    orderStatus: backendStatus,
    notes: notes || `Cập nhật trạng thái sang ${backendStatus}`
  }, { params: { orderId } });
  ```

---

### Component 3: Giao Diện Quản Lý Shop (`ShopDashboardPage.tsx`)

#### [MODIFY] [src/pages/shop/ShopDashboardPage.tsx](file:///Users/nguyenvanminhtam/Frontend/src/pages/shop/ShopDashboardPage.tsx)
1. Cập nhật hàm xử lý khi Shop bấm *"Bàn giao shipper GHN"*:
   - Gọi `shippingService.createGhnOrder(order.id)`.
   - Nếu gọi thành công: Cập nhật trạng thái đơn thành `SHIPPING`, lưu mã vận đơn GHN và hiển thị thông báo thành công: *"Đã tạo vận đơn GHN thành công (Mã vận đơn: GHN...)"*.
   - Nếu có lỗi phát sinh: Fallback gọi `handleUpdateStatus(order.id, "SHIPPING")` để đơn vẫn được chuyển sang trạng thái đang giao.
2. Hiển thị nhãn và badge: Cả `SHIPPING` và `SHIPPED` đều hiển thị huy hiệu xanh/tím: `"Đang giao"`.

---

## Verification Plan

### Automated Verification
- `npm run lint`: Xác minh không có lỗi linter.
- `npm run build`: Kiểm tra biên dịch toàn bộ bundle thành công.

### Manual Verification
1. Mở trang Quản lý đơn hàng của Shop (`/shop`).
2. Chọn một đơn hàng đang ở trạng thái "Đang xử lý" (`PROCESSING`).
3. Bấm nút **"Bàn giao shipper GHN"**.
4. Quan sát tab Network:
   - Request gửi đi nhận được **HTTP 200 OK** (thay vì 400).
   - Trạng thái đơn hàng chuyển ngay sang **"Đang giao" (`SHIPPING`)**.
   - Khách hàng nhận được thông báo vận chuyển qua SignalR.
