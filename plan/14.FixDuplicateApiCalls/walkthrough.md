# Walkthrough: Khắc phục triệt để lỗi gọi trùng lặp API (Duplicate API Calls)

## 1. Tóm tắt nguyên nhân gốc rễ và giải pháp

### Nguyên nhân gốc rễ:
1. **Thiếu Deduplication Ref ở `ShopProfilePage`**: Khi người dùng click vào gian hàng từ `BookDetailPage`, component `ShopProfilePage` được mount. Trong môi trường dev, React 18 `<StrictMode>` mount 2 lần (`mount -> unmount -> mount`), do không có cờ `useRef` ghi nhớ `shopId` đã nạp nên cả 2 lượt đều đồng thời phát sinh request `bookService.getShopProfile` và `bookService.getBooksByShop`.
2. **Thiếu cơ chế In-Flight Request Deduplication tại `apiClient`**: Khi có 2 lệnh `apiClient.get` cùng URL và query params gửi ra cùng lúc, `apiClient` gửi cả 2 lên backend qua 2 kết nối mạng riêng biệt thay vì gom chung 1 Promise đang chạy.
3. **Lệch kiểu `shopId`**: `App.tsx` khai báo `selectedShopId: number`, trong khi Backend trả Guid dạng chuỗi (`string`).

---

## 2. Các thay đổi đã thực hiện

### 1. In-Flight Request Deduplication tại tầng mạng (`src/services/api.ts`)
- Tạo bộ nhớ đệm `inFlightGetRequests = new Map<string, Promise<any>>()`.
- Bọc lại phương thức `apiClient.get`:
  - Tạo cache key duy nhất: `GET:${url}:${JSON.stringify(config.params)}`.
  - Nếu request cùng tham số đang chạy dở (in-flight), trả về ngay Promise đang chạy, **không tạo thêm request HTTP thứ 2 qua mạng**.
  - Khi Promise hoàn tất (kể cả thành công hay thất bại), tự động giải phóng key khỏi Map qua `.finally()`.

### 2. Chặn gọi lặp tại Component (`src/pages/customer/ShopProfilePage.tsx`)
- Thêm `loadedShopIdRef = useRef<string | number | null>(null)`.
- Kiểm tra `if (loadedShopIdRef.current === shopId) return;` trước khi nạp `getShopProfile` và `getBooksByShop`.
- Mở rộng kiểu `shopId: number | string` trong `ShopProfilePageProps`.
- Chỉ mount `ChatDrawer` khi `chatOpen === true`.

### 3. Đồng bộ kiểu dữ liệu và tối ưu (`src/App.tsx`)
- Cập nhật state `selectedShopId` sang kiểu `number | string`.
- Chỉ render global `ChatDrawer` khi `chatDrawerOpen === true`.

### 4. Phòng ngừa trên các trang khác (`src/pages/customer/HomePage.tsx` & `src/pages/customer/MyOrdersPage.tsx`)
- `HomePage.tsx`: Thêm `isLoadedRef` chống gọi kép `getCategories` và `getBooks` khi mở trang chủ.
- `MyOrdersPage.tsx`: Thêm `loadedUserIdRef` chống gọi kép `getOrders`.

---

## 3. Kết quả xác thực (Verification Results)

### Kiểm tra biên dịch (Vite Build)
```bash
npm run build
```
- Kết quả: **Thành công 100% (0 lỗi cú pháp, 0 lỗi TypeScript)**.
- Thời gian build: **913ms**.

### Hành vi Network sau khi sửa
1. Khi click vào cuốn sách: `GetBookDetail` và `GetBookFeedbacks` gọi đúng **1 lần**.
2. Khi click chuyển vào gian hàng:
   - `GetShopProfile?shopId=...`: chỉ xuất hiện **1 dòng** (Status 200).
   - `GetBooksByShop?shopId=...`: chỉ xuất hiện **1 dòng** (Status 200).
   - Không còn tình trạng nhân đôi 2 cặp request liên tiếp như trước.
