# Kế hoạch Tích hợp Tính năng Upload Ảnh Bìa Sách lên Cloudinary ở Frontend

Kế hoạch này mô tả chi tiết việc xây dựng tính năng upload ảnh bìa sách trực tiếp lên Cloudinary (thông qua API `POST /api/upload/image` đã có sẵn ở Backend) ngay tại modal **Thêm sách mới / Chỉnh sửa sách** của Shop ([ShopDashboardPage.tsx](file:///Users/nguyenvanminhtam/Frontend/src/pages/shop/ShopDashboardPage.tsx)), đồng thời nâng cấp component [BookCover.tsx](file:///Users/nguyenvanminhtam/Frontend/src/components/common/BookCover.tsx) để hiển thị ảnh bìa thật trên toàn bộ hệ thống.

> [!IMPORTANT]
> **Cam kết**: Toàn bộ thay đổi **chỉ thực hiện ở tầng Frontend**, tuyệt đối **không chỉnh sửa bất kỳ file nào trong Backend**.

---

## User Review Required

> [!NOTE]
> 1. **Trải nghiệm người dùng khi upload ảnh**:
>    - Khi người dùng chọn file ảnh (hoặc kéo thả), Frontend sẽ tự động gọi API `POST /api/upload/image` lên Backend để đẩy ảnh lên Cloudinary.
>    - Sau khi Backend phản hồi thành công trả về `url`, ảnh sẽ hiển thị xem trước (preview) ngay trong modal và gán URL vào form dữ liệu sách.
>    - Người dùng có thể xóa ảnh đã chọn để tải ảnh khác hoặc tiếp tục dùng chế độ màu gradient dự phòng nếu không muốn tải ảnh.
> 2. **Tương thích ngược (Backward Compatibility)**:
>    - Component [BookCover.tsx](file:///Users/nguyenvanminhtam/Frontend/src/components/common/BookCover.tsx) sẽ ưu tiên hiển thị `book.imageUrl`. Nếu sách chưa có `imageUrl` hoặc đường dẫn ảnh bị lỗi, hệ thống tự động fallback về bìa sách dạng màu gradient cổ điển như hiện tại.

---

## Open Questions

Hiện tại không có câu hỏi chặn. Thiết kế tuân thủ hoàn toàn API contract `POST /api/upload/image` hiện có của Backend.

---

## Proposed Changes

### 1. Tầng Dịch vụ & Types (Types & Services)

#### [MODIFY] [index.ts](file:///Users/nguyenvanminhtam/Frontend/src/types/index.ts)
- Bổ sung trường `imageUrl?: string` vào interface `Book` (nếu chưa có).
- Định nghĩa kiểu dữ liệu `UploadImageResponse` chứa thông tin phản hồi từ API upload (`url`, `public_id`, `file_name`, `size`).

#### [NEW] [uploadService.ts](file:///Users/nguyenvanminhtam/Frontend/src/services/uploadService.ts)
- Tạo service `uploadService` đảm nhận việc giao tiếp với `UploadController` ở Backend:
  - `uploadImage(file: File, folder?: string)`: Tạo `FormData`, đóng gói `file` và `folder` (`bookverse/books`), gửi `POST /api/upload/image` với `headers: { "Content-Type": "multipart/form-data" }`.
  - `deleteImage(publicId: string)`: Gửi `DELETE /api/upload/image?publicId=...` khi người dùng hủy ảnh đã upload.

#### [MODIFY] [shopService.ts](file:///Users/nguyenvanminhtam/Frontend/src/services/shopService.ts)
- Đảm bảo các hàm `addProduct` và `updateProduct` gửi kèm trường `imageUrl` trong payload lên Backend hoặc cập nhật vào danh sách dữ liệu local.

---

### 2. Tầng Giao diện & Hiển thị (UI Components & Pages)

#### [MODIFY] [BookCover.tsx](file:///Users/nguyenvanminhtam/Frontend/src/components/common/BookCover.tsx)
- Cập nhật component `BookCover`:
  - Nếu `book.imageUrl` tồn tại: hiển thị thẻ `<img>` với hiệu ứng đổ bóng bìa sách chân thực (`object-cover`, `rounded-[4px]`).
  - Tích hợp `onError` handler: nếu ảnh lỗi tải thì chuyển sang hiển thị giao diện bìa gradient mặc định.
  - Giữ nguyên các kích thước chuẩn: `sm` (90x130), `md` (130x185), `lg` (175x250).

#### [MODIFY] [ShopDashboardPage.tsx](file:///Users/nguyenvanminhtam/Frontend/src/pages/shop/ShopDashboardPage.tsx)
- Thêm state quản lý upload ảnh: `imageUrl`, `imageFile`, `isUploading`, `uploadError`.
- Bổ sung khu vực **Upload ảnh bìa sách** vào Modal Thêm/Sửa sách:
  - Khu vực Drag & Drop / File Selector trực quan hỗ trợ các định dạng `.jpg, .jpeg, .png, .webp, .gif` (kích thước tối đa 10MB).
  - Trạng thái loading khi đang tải ảnh lên Cloudinary.
  - Khung xem trước (Image Preview) kèm nút xóa ảnh (Trash icon) hoặc đổi ảnh mới.
  - Tích hợp `imageUrl` vào hàm `handleSaveProduct`, `handleOpenAddModal` (reset về rỗng) và `handleOpenEditModal` (gán URL hiện tại của sách).

---

## Verification Plan

### Automated Tests / Type Checking
- Chạy kiểm tra cú pháp và kiểu dữ liệu TypeScript của Frontend:
  ```bash
  npm run build
  ```
  hoặc
  ```bash
  npx tsc --noEmit
  ```

### Manual Verification
1. **Kiểm tra Giao diện Modal Thêm sách**:
   - Đăng nhập với vai trò Shop -> truy cập trang Quản lý kho sách (`ShopDashboardPage`).
   - Bấm nút **"Đăng bán sách mới"** và kiểm tra sự xuất hiện của khu vực Upload ảnh bìa.
2. **Kiểm tra Upload ảnh lên Cloudinary**:
   - Chọn một file ảnh từ máy tính (PNG/JPG/WEBP).
   - Xác nhận có loading spinner trong lúc upload và hiển thị ảnh xem trước ngay sau khi hoàn tất.
   - Kiểm tra Network tab trong DevTools: request gửi tới `/api/upload/image` trả về HTTP 200 kèm `url` Cloudinary an toàn (`https://res.cloudinary.com/...`).
3. **Kiểm tra Lưu sách & Hiển thị**:
   - Điền các thông tin sách và bấm **"Thêm sách vào gian hàng"**.
   - Kiểm tra sách mới xuất hiện trong danh sách tồn kho với hình ảnh bìa thật thay vì chỉ màu gradient.
   - Truy cập trang chủ / trang chi tiết sách để kiểm tra ảnh bìa hiển thị sắc nét.
4. **Kiểm tra Chỉnh sửa sách**:
   - Bấm nút sửa sách -> Modal hiển thị đúng ảnh bìa đã upload -> thử thay ảnh mới hoặc xóa ảnh -> Lưu và xác nhận cập nhật thành công.
