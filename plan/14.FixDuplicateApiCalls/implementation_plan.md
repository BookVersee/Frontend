# Kế hoạch khắc phục lỗi gọi trùng lặp API trên giao diện (Duplicate API Calls)

## 1. Phân tích nguyên nhân gốc rễ (Root Cause Analysis)

Dựa trên ảnh chụp màn hình Network tab của bạn:
- `GetBookDetail?id=44444444-0...` và `GetBookFeedbacks?bookId=...` được gọi 1 lần lúc ~2,000ms (tại trang Chi tiết sách `BookDetailPage`).
- Khi người dùng click vào tên/biểu tượng shop ("Nhã Nam Books Official") lúc ~12,000ms để chuyển sang trang `ShopProfilePage`:
  - `GetShopProfile?shopId=222222...` (dòng 3) và `GetBooksByShop?shopId=22222...` (dòng 4) được gọi.
  - Ngay lập tức, `GetShopProfile?shopId=222222...` (dòng 5) và `GetBooksByShop?shopId=22222...` (dòng 6) bị gọi lại lần thứ 2 với cùng tham số!

### 3 nguyên nhân chính:
1. **Thiếu cơ chế Deduplication Ref (`loadedShopIdRef`) trong `ShopProfilePage.tsx`**:
   - `ShopProfilePage` đặt `useEffect(..., [shopId])` mà không có cờ `useRef` kiểm tra `shopId` đã nạp hay chưa.
   - Khi chạy môi trường phát triển (`npm run dev`), React 18 `<StrictMode>` trong `main.jsx` cố tình mount -> unmount -> remount component để phát hiện side-effect. Vì không có ref chặn, cả 2 lượt mount đều kích hoạt `bookService.getShopProfile` và `bookService.getBooksByShop`.
2. **Thiếu tầng In-Flight Request Deduplication ở Client Network Layer (`src/services/api.ts`)**:
   - Hiện tại `apiClient` gửi trực tiếp mọi request GET ra backend mà không kiểm tra xem request đó có đang "in-flight" (đang chờ phản hồi) hay không.
   - Nếu có 2 component cùng gọi hoặc do mount kép cùng 1 mili-giây, trình duyệt sẽ mở 2 kết nối HTTP độc lập, tốn gấp đôi băng thông và tài nguyên Backend.
3. **Lệch kiểu dữ liệu của `shopId` giữa `App.tsx` và `ShopProfilePage.tsx`**:
   - `App.tsx` khai báo `selectedShopId` với kiểu `number`, trong khi Backend dùng chuỗi GUID (ví dụ `22222222-0000-0000-0000-000000000002`). Điều này gây cảnh báo TypeScript và có thể dẫn đến re-render không mong muốn khi ép kiểu.

---

## 2. Giải pháp kỹ thuật toàn diện (Two-Tier Architecture)

### Tầng 1: In-Flight Request Deduplication tại `src/services/api.ts` (Bảo vệ toàn diện)
- Bổ sung cơ chế deduplicate các request `GET` đang chờ phản hồi (`in-flight`).
- Tạo một `Map<string, Promise<any>>` lưu trữ các promise `GET` đang thực thi theo key: `GET:${url}:${params}`.
- Nếu có một request `GET` giống hệt URL và query params được gọi trong khi request trước chưa hoàn tất:
  - Tái sử dụng ngay Promise đang chạy, **không gửi thêm request HTTP thứ 2 qua mạng**.
  - Khi request hoàn tất (thành công hoặc lỗi), key tự động được xoá khỏi Map bằng `.finally()`.
- Bất kỳ request GET nào phát sinh sau đó (khi người dùng chủ động tải lại hoặc đổi tham số) vẫn sẽ gửi request mới bình thường.

### Tầng 2: Thêm Guard Ref tại `ShopProfilePage.tsx` và các trang liên quan
- Trong `ShopProfilePage.tsx`:
  - Khai báo `loadedShopIdRef = useRef<string | number | null>(null)`.
  - Kiểm tra `if (loadedShopIdRef.current === shopId) return; loadedShopIdRef.current = shopId;` trước khi gọi API.
  - Sửa kiểu của `shopId` trong props thành `string | number`.
- Trong `App.tsx`:
  - Khai báo `selectedShopId` kiểu `string | number` (khởi tạo `"1"` hoặc `""`).
- Kiểm tra bổ sung tại `HomePage.tsx` và `MyOrdersPage.tsx` để tránh gọi lặp khi load trang ban đầu.

---

## 3. Danh sách các file thay đổi (Proposed Changes)

### Network Client Layer
- `src/services/api.ts`: Bọc phương thức `apiClient.get` với bộ nhớ đệm in-flight promise. Cho phép bypass bằng header `x-skip-dedupe: true` nếu cần buộc tải mới.

### Pages & Components
- `src/pages/customer/ShopProfilePage.tsx`: Cập nhật interface `ShopProfilePageProps` hỗ trợ `shopId: number | string`. Thêm `loadedShopIdRef` ngăn chặn StrictMode và duplicate renders gọi lặp `getShopProfile` và `getBooksByShop`.
- `src/App.tsx`: Điều chỉnh type của `selectedShopId` từ `number` thành `number | string` để khớp với Guid của Backend.
- `src/pages/customer/HomePage.tsx`: Thêm `isLoadedRef` ngăn chặn gọi kép `getCategories` và `getBooks` khi mở trang chủ.
- `src/pages/customer/MyOrdersPage.tsx`: Thêm `loadedUserIdRef` ngăn chặn gọi kép `getOrders`.

---

## 4. Kế hoạch kiểm thử & Xác thực (Verification Plan)

### Automated Tests
- Chạy `npm run build` để đảm bảo 0 lỗi TypeScript và cú pháp.

### Manual Verification (Kiểm tra thực tế trên giao diện)
1. Mở trang chủ -> Bấm vào sách "Nhà Giả Kim" -> Quan sát Network tab: `GetBookDetail` và `GetBookFeedbacks` chỉ gọi đúng **1 lần**.
2. Bấm vào tên gian hàng "Nhã Nam Books Official":
   - Quan sát Network tab: `GetShopProfile` chỉ xuất hiện đúng **1 dòng** (Status 200).
   - `GetBooksByShop` chỉ xuất hiện đúng **1 dòng** (Status 200).
   - Không còn hiện tượng gọi trùng 2 cặp request liên tiếp như ảnh của bạn.
