# Kế hoạch sửa lỗi 404 và nâng cấp hiển thị Lịch sử giao dịch cá nhân (Transaction History)

## 1. Phân tích nguyên nhân lỗi 404 (Root Cause)

- **Nguyên nhân chính**: File Frontend [authService.ts](file:///Users/nguyenvanminhtam/Frontend/src/services/authService.ts) đang gọi URL:
  `GET /api/user/GetTransactions`
- **Thực tế Backend**: Controller [UserController.cs](file:///Users/nguyenvanminhtam/Frontend/Backend/BookManagement.Api/Controllers/UserController.cs#L88) định nghĩa endpoint là:
  ```csharp
  [Authorize]
  [HttpGet("GetMyTransactions")]
  public async Task<IActionResult> GetMyTransactions()
  ```
  Route của `UserController` là `[Route("api/user")]`. Do đó URL chính xác 100% của Backend là:
  `GET /api/user/GetMyTransactions` (kèm JWT Bearer Token).
- Do gọi sai tên action (`GetTransactions` thay vì `GetMyTransactions`), Backend Kestrel trả về **404 Not Found**. Khi gặp 404, hàm `getUserTransactions` rơi vào `catch` và fallback về danh sách mock rỗng, dẫn đến giao diện luôn hiện *"Chưa có giao dịch nào phát sinh"*.

---

## 2. Thông tin chi tiết API Backend cung cấp

Theo DTO `TransactionResponse` ([UserResponse.cs](file:///Users/nguyenvanminhtam/Frontend/Backend/BookManagement.Service/User/UserResponse.cs#L19)) và Entity `TransactionHistory`:

| Trường dữ liệu | Kiểu dữ liệu | Ý nghĩa nghiệp vụ |
| :--- | :--- | :--- |
| `id` | `Guid` (string) | Mã định danh duy nhất của bản ghi giao dịch trong CSDL. |
| `userId` | `Guid` (string) | Mã tài khoản người dùng sở hữu giao dịch. |
| `referenceType` | `Enum` (string) | Loại nghiệp vụ phát sinh: <br>• `ORDER_PAYMENT`: Thanh toán đơn hàng sách.<br>• `REFUND`: Hoàn tiền do trả hàng / hủy đơn.<br>• `SHIPPING_FEE`: Cước vận chuyển.<br>• `SHOP_REVENUE`: Doanh thu bán sách của shop.<br>• `WITHDRAWAL`: Rút tiền ví. |
| `referenceId` | `Guid?` (string) | Mã ID tham chiếu liên quan (chính là `OrderId` của đơn hàng được thanh toán hoặc hoàn tiền). |
| `transactionType` | `Enum` (string) | Chiều biến động dòng tiền: <br>• `IN`: Tiền cộng vào ví/tài khoản (ví dụ tiền hoàn `+`, nhận doanh thu).<br>• `OUT`: Tiền trừ đi (ví dụ thanh toán đơn hàng `-`). |
| `amount` | `decimal` (number) | Giá trị tiền phát sinh của giao dịch (ví dụ: `155000` VNĐ). |
| `transactionCode` | `string?` | Mã giao dịch đối soát thực tế từ cổng thanh toán (ví dụ: mã giao dịch MoMo `289381923`, mã VNPAY, mã đơn giao nhận GHN `COD_...`). |
| `description` | `string?` | Nội dung mô tả chi tiết giao dịch (ví dụ: *"Thanh toán thành công đơn hàng qua MoMo"*, *"Hoàn tiền khiếu nại đơn hàng"*). |
| `createdAt` | `DateTimeOffset` | Mốc thời gian chính xác phát sinh giao dịch (ISO date). |

---

## 3. Kế hoạch trình bày thông tin lên màn hình (UI/UX Design Plan)

Giao diện mục "Lịch sử biến động dòng tiền" tại [ProfilePage.tsx](file:///Users/nguyenvanminhtam/Frontend/src/pages/customer/ProfilePage.tsx) sẽ được nâng cấp toàn diện và hiện đại:

### A. Thẻ tóm tắt chỉ số tài chính cá nhân (Summary Stat Cards)
Đặt ngay trên đầu phần lịch sử giao dịch:
1. **Tổng tiền đã thanh toán (Dòng tiền OUT)**: Tính tổng số tiền các giao dịch thanh toán đơn hàng.
2. **Tổng tiền đã hoàn lại (Dòng tiền IN / REFUND)**: Tổng số tiền khách hàng được hoàn từ các đơn hủy hoặc khiếu nại.
3. **Tổng số giao dịch**: Số lượt giao dịch đã thực hiện trên sàn.

### B. Thanh công cụ lọc & Tìm kiếm (Filter & Search Bar)
- **Bộ lọc loại giao dịch (Tabs)**:
  - `Tất cả`
  - `Thanh toán mua hàng` (`OUT` / `ORDER_PAYMENT`)
  - `Tiền hoàn khiếu nại` (`IN` / `REFUND`)
- **Ô tìm kiếm nhanh**: Tìm theo Mã giao dịch (`transactionCode`) hoặc Mã đơn hàng (`referenceId`).

### C. Danh sách giao dịch chi tiết (Transaction Feed Item)
Mỗi dòng giao dịch hiển thị trực quan:
- **Icon phân biệt màu sắc**:
  - `OUT` / `ORDER_PAYMENT`: Icon giỏ hàng / thẻ tín dụng (màu xanh navy / đỏ cam, dấu `-`).
  - `IN` / `REFUND`: Icon hoàn tiền / mũi tên xanh (màu emerald, dấu `+`).
- **Nội dung chính**:
  - Tiêu đề & badge phân loại: `Thanh toán đơn hàng` hoặc `Hoàn tiền`.
  - Mô tả chi tiết (`description`).
  - Mốc thời gian chuẩn hoá tiếng Việt: `14:30 - 05/09/2026`.
- **Mã đối soát & Liên kết**:
  - Hiển thị `Mã GD: #MOMO123...` kèm nút **Copy nhanh** để khách hàng tiện tra soát khi có vấn đề.
  - Hiển thị `Mã đơn: #...`, bấm vào có thể xem thông tin đơn hàng.
- **Biến động số tiền**:
  - Số tiền định dạng VND rõ nét: `- 155.000 đ` hoặc `+ 85.000 đ`.
  - Badge trạng thái `Thành công` (Emerald) sắc nét.

### D. Modal xem chi tiết hóa đơn điện tử (Transaction Detail Modal)
- Khi bấm vào một giao dịch bất kỳ, mở một Modal hiển thị dạng **Biên lai điện tử (E-Receipt)**:
  - Mã biên lai hệ thống (`id`)
  - Mã đối soát cổng thanh toán (`transactionCode`)
  - Chiều dòng tiền & Loại nghiệp vụ
  - Đơn hàng tham chiếu (`referenceId`)
  - Số tiền giao dịch & Thời gian giao dịch
  - Trạng thái ghi nhận

---

## 4. Danh sách các file thay đổi (Proposed Changes)

### Services & Types
- `src/types/index.ts`: Bổ sung `BackendTransactionResponse` và cập nhật `Transaction` interface chuẩn hóa theo đúng DTO của Backend.
- `src/services/authService.ts`: Đổi URL API từ `/user/GetTransactions` thành `/user/GetMyTransactions`, map chuẩn xác trường dữ liệu.

### UI Components & Pages
- `src/pages/customer/ProfilePage.tsx`: Thiết kế lại khối "Lịch sử biến động dòng tiền", bổ sung Stat Cards, Tab filter, Search, Copy mã GD, và Modal chi tiết biên lai.

---

## 5. Kế hoạch kiểm thử & Xác thực (Verification Plan)

### Automated Tests
- Chạy `npm run build` đảm bảo 0 lỗi TypeScript và biên dịch hoàn hảo.

### Manual Verification
1. Mở trang Hồ sơ cá nhân (`/profile` hoặc click tab "Hồ sơ cá nhân"):
   - Quan sát Network tab: Request `GET /api/user/GetMyTransactions` trả về **Status 200 OK** (không còn bị 404).
2. Kiểm tra giao diện hiển thị:
   - Danh sách giao dịch hiển thị đúng các khoản thanh toán / hoàn tiền từ Backend.
   - Thử bấm lọc tab "Thanh toán", "Hoàn tiền".
   - Bấm vào một giao dịch để xem Modal biên lai chi tiết và thử copy mã giao dịch.
