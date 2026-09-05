# Walkthrough: Sửa lỗi 404 API GetTransactions & Nâng cấp Giao diện Lịch sử biến động dòng tiền

## 1. Tóm tắt nguyên nhân và giải pháp

### Nguyên nhân lỗi 404
- Mã nguồn Frontend trước đây gọi URL: `GET /api/user/GetTransactions`.
- Backend C# [UserController.cs](file:///Users/nguyenvanminhtam/Frontend/Backend/BookManagement.Api/Controllers/UserController.cs#L88) định nghĩa action chính xác là:
  `[HttpGet("GetMyTransactions")]` thuộc route `[Route("api/user")]`.
- Do sai tên action, máy chủ Backend trả về mã lỗi `404 Not Found`.

### Giải pháp đã thực hiện
1. **Sửa route API và Map DTO chuẩn hóa (`src/services/authService.ts`)**:
   - Đổi URL sang `/user/GetMyTransactions`.
   - Ánh xạ đầy đủ các trường từ Backend `TransactionResponse`: `id`, `userId`, `referenceType`, `referenceId`, `transactionType`, `amount`, `transactionCode`, `description`, `createdAt`.
2. **Cập nhật Interface Model (`src/types/index.ts`)**:
   - Khai báo `BackendTransactionResponse` và bổ sung các trường nghiệp vụ vào `Transaction`.
3. **Nâng cấp UI/UX toàn diện (`src/pages/customer/ProfilePage.tsx`)**:
   - **Thẻ tóm tắt chỉ số**: Tổng tiền thanh toán (Dòng tiền `OUT`), Tổng tiền đã hoàn (Dòng tiền `IN`), Tổng số giao dịch.
   - **Thanh lọc & Tìm kiếm**: Tabs lọc `Tất cả` / `Thanh toán` / `Hoàn tiền` kết hợp ô tìm kiếm theo Mã giao dịch (`transactionCode`), Mã đơn hàng (`referenceId`), hoặc nội dung mô tả.
   - **Card giao dịch hiện đại**: Phân biệt màu sắc & icon (`+` màu xanh lá emerald, `-` màu xanh dương/slate), hiển thị Badge nghiệp vụ, thời gian chuẩn hóa tiếng Việt `HH:mm · DD/MM/YYYY`.
   - **Nút sao chép mã giao dịch đối soát**: Click để copy mã GD tiện lợi cho việc tra soát ngân hàng/ví.
   - **Modal Biên lai điện tử (E-Receipt)**: Bấm "Biên lai" để mở modal hiển thị đầy đủ thông tin chi tiết của một giao dịch.

---

## 2. Kết quả kiểm tra (Verification Results)

### Kiểm tra biên dịch (Vite Build)
```bash
npm run build
```
- Kết quả: **Thành công 100% (0 lỗi cú pháp, 0 lỗi TypeScript)**.
- Thời gian build: **780ms**.

### Kiểm tra API Backend qua Curl
- Gọi endpoint cũ: `curl -i http://localhost:5226/api/user/GetTransactions` -> `HTTP/1.1 404 Not Found`.
- Gọi endpoint mới: `curl -i http://localhost:5226/api/user/GetMyTransactions` -> `HTTP/1.1 401 Unauthorized` (yêu cầu Bearer Token hợp lệ, endpoint đã khớp 100%).

### Kiểm tra hành vi giao diện người dùng
- Khi người dùng đăng nhập mở tab "Hồ sơ cá nhân", API `/api/user/GetMyTransactions` được gọi với Bearer token và trả về `Status 200 OK`.
- Dữ liệu lịch sử giao dịch được phân loại rõ ràng (Thanh toán đơn hàng / Hoàn tiền khiếu nại).
- Nút "Biên lai" mở modal hiển thị chi tiết mã giao dịch hệ thống, mã cổng thanh toán, mã đơn hàng, ngày giờ và mô tả.
