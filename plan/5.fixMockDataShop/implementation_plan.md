# Kế hoạch Khắc Phục Lỗi Chạy Backend & Kết Nối Dữ Liệu Thật Cho Giao Diện Shop (Loại bỏ Mock Data)

Tài liệu này phân tích nguyên nhân gốc rễ dẫn đến lỗi Backend không thể khởi chạy (Exit code 134), lỗi 404 khi Upload ảnh, và lý do màn hình Shop Dashboard đang bị hiển thị Mock Data; đồng thời đề xuất kế hoạch giải quyết dứt điểm.

---

## 1. Phân Tích Nguyên Nhân Gốc Rễ

Qua kiểm tra hệ thống thực tế trên máy của bạn:

1. **Xung đột cổng 5226 (Lỗi `Address already in use` - Exit code 134)**:
   - Một tiến trình Backend .NET cũ (**PID 54000**) đang chạy ngầm từ trước và chiếm dụng cổng `5226`.
   - Khi bạn chạy `dotnet run`, Kestrel không thể bind vào cổng 5226 nên báo lỗi và dừng lại.

2. **Lý do Upload ảnh bị lỗi 404 (`Request failed with status code 404`)**:
   - Khi Frontend gửi request `POST /api/upload/image`, yêu cầu được chuyển tới tiến trình Backend cũ (PID 54000) đang chạy trên cổng 5226.
   - Tiến trình cũ này được build trước khi git pull nên **chưa có `UploadController`**, dẫn đến trả về **404 Not Found**.

3. **Lý do Shop Dashboard bị rơi vào Mock Data**:
   - Do tiến trình Backend cũ không có đầy đủ API hoặc kết nối DB bị lỗi, các hàm trong [shopService.ts](file:///Users/nguyenvanminhtam/Frontend/src/services/shopService.ts) gặp lỗi Network/404 và tự động nhảy vào khối `catch` để hiển thị Mock Data dự phòng.
   - Hàm `getShopOrders` trong `shopService.ts` đang gọi endpoint `/shop/orders` thay vì endpoint chuẩn của Backend là `/orders/GetUserOrders`.

4. **Cấu hình Database trên macOS**:
   - CSDL `BookManagementDb` với đầy đủ 18 bảng và 24 cuốn sách thực tế đang nằm trong container Docker `edusphere_sqlserver` (Port `1433`, mật khẩu `EduSphere@2026StrongPass!`).
   - File [appsettings.Development.json](file:///Users/nguyenvanminhtam/Frontend/Backend/BookManagement.Api/appsettings.Development.json) cần bổ sung chuỗi kết nối chính xác tới container này để Backend kết nối thành công.

---

## 2. User Review Required

> [!IMPORTANT]
> - Cần giải phóng tiến trình cũ đang chiếm cổng 5226 bằng lệnh `kill -9 54000` (hoặc `kill -9 $(lsof -ti:5226)`).
> - Cập nhật chuỗi kết nối trong `appsettings.Development.json` trỏ tới Docker SQL Server `localhost,1433`.
> - Sửa endpoint `getShopOrders` trong `src/services/shopService.ts` sang `/orders/GetUserOrders`.

---

## 3. Proposed Changes

### Tầng Cấu hình Backend (Database Connection)

#### [MODIFY] [appsettings.Development.json](file:///Users/nguyenvanminhtam/Frontend/Backend/BookManagement.Api/appsettings.Development.json)
- Bổ sung cấu hình `ConnectionStrings.DefaultConnection` trỏ tới Docker SQL Server:
  ```json
  "ConnectionStrings": {
    "DefaultConnection": "Server=localhost,1433;Database=BookManagementDb;User Id=sa;Password=EduSphere@2026StrongPass!;TrustServerCertificate=True;"
  }
  ```

---

### Tầng Dịch vụ Frontend (Service Layer)

#### [MODIFY] [shopService.ts](file:///Users/nguyenvanminhtam/Frontend/src/services/shopService.ts)
- Chỉnh sửa hàm `getShopOrders`:
  ```ts
  // Đổi từ:
  const res = await apiClient.get<ApiResponse<any[]>>("/shop/orders");
  // Thành:
  const res = await apiClient.get<ApiResponse<any[]>>("/orders/GetUserOrders");
  ```

---

## 4. Verification Plan

### Bước 1: Giải phóng cổng 5226 và khởi chạy Backend mới
```bash
# 1. Tắt tiến trình cũ
kill -9 $(lsof -ti:5226)

# 2. Khởi chạy Backend mới
cd /Users/nguyenvanminhtam/Frontend/Backend
dotnet run --project BookManagement.Api
```

### Bước 2: Kiểm tra kết nối API & Swagger
- Mở trình duyệt truy cập: `http://localhost:5226/swagger`.
- Xác nhận có xuất hiện nhóm API `/api/upload` (`POST /api/upload/image`) và `/api/shop`.

### Bước 3: Kiểm tra Giao diện Shop & Upload ảnh
- Tải lại trang Shop Dashboard (`http://localhost:5173`).
- Mở Network tab trong DevTools:
  - Các API `GetShopInventory`, `GetUserOrders`, `GetShopFeedbacks` trả về HTTP 200 với dữ liệu thực từ SQL Server (24 đầu sách thực tế, không còn mock data).
  - Thử chọn ảnh bìa sách trong Modal Thêm sách mới: request `POST /api/upload/image` trả về HTTP 200 với `url` Cloudinary thành công.
