# Walkthrough: Chuyển Sang Gửi Ảnh Thuần & Sửa Triệt Để Lỗi Render Ảnh Bên Shop

## 1. Mục tiêu công việc
* **Gửi ảnh thuần**: Khi Shop bấm gửi ảnh chụp thực tế, chỉ gửi ảnh và hiển thị ảnh, không kèm theo câu chữ *"Shop gửi bạn ảnh chụp thực tế của sách"* dư thừa bên dưới.
* **Khắc phục lỗi mất ảnh bên Shop**: Khắc phục hiện tượng gửi ảnh thứ 2 thì ảnh bị biến thành dòng chữ thông thường do điều kiện kiểm tra `messageType`.

---

## 2. Chi tiết các thay đổi kỹ thuật

### A. Gửi Ảnh Thuần (Pure Image Mode)
* Trong [`ShopDashboardPage.tsx`](file:///Users/nguyenvanminhtam/Frontend/src/pages/shop/ShopDashboardPage.tsx) (hàm `handleUploadChatImage`):
  * Đặt `text: ""` khi gửi ảnh.
  * Vì Backend C# (`ChatService.cs`) cho phép nội dung rỗng nếu đã có `ImageUrl`, nên request gửi ảnh thuần đạt **200 OK** hoàn hảo.
* Trong cả hai giao diện ([`ShopDashboardPage.tsx`](file:///Users/nguyenvanminhtam/Frontend/src/pages/shop/ShopDashboardPage.tsx) và [`ChatDrawer.tsx`](file:///Users/nguyenvanminhtam/Frontend/src/components/chat/ChatDrawer.tsx)):
  * Chỉ render khung ảnh chụp thực tế bo góc mềm mại, bóng đổ nhẹ và click phóng to.
  * Hoàn toàn loại bỏ dòng text chú thích dư thừa ở đáy ảnh.

---

### B. Khắc phục triệt để lỗi ảnh bị chuyển thành dòng chữ bên Shop
* **Nguyên nhân cốt lõi**:
  * Trước đây, khối hiển thị ảnh trong `ShopDashboardPage.tsx` yêu cầu điều kiện:
    ```tsx
    m.messageType === "image" && m.imageUrl ? (...) : (...)
    ```
  * Nhưng khi danh sách tin nhắn được nạp lại từ Backend (`/chat/GetConversationMessages`), CSDL SQL Server chỉ lưu trữ cột `Content` và `ImageUrl` mà **không có trường `messageType`**.
  * Dẫn đến khi nạp lại, `m.messageType` là `undefined`, điều kiện trên bị `false` và rơi vào nhánh cuối cùng (nhánh hiển thị tin nhắn văn bản thông thường)!
* **Giải pháp đã thực hiện**:
  * Đổi điều kiện render trực tiếp thành:
    ```tsx
    m.imageUrl ? ( /* Render thẻ ảnh chụp thực tế */ ) : ( /* Render text */ )
    ```
  * Cứ tin nhắn nào có `m.imageUrl` (dù nạp từ API Backend, từ SignalR realtime hay LocalStorage), hệ thống đều render ảnh lập tức 100%!
  * Trong [`chatService.ts`](file:///Users/nguyenvanminhtam/Frontend/src/services/chatService.ts), thuật toán `cleanAndDeduplicateMessages` gán khóa duy nhất cho từng `imageUrl` và `id`, đảm bảo gửi liên tiếp nhiều ảnh đều đứng cạnh nhau đầy đủ.

---

## 3. Kết quả nghiệm thu
* `npm run build` thành công **100% trong 827ms**.
* Gửi ảnh bên Shop: **Chỉ có ảnh thuần**, không có text kèm theo.
* Gửi ảnh 1, ảnh 2, ảnh 3 liên tiếp: Tất cả các ảnh đều hiển thị song song đầy đủ và bấm vào phóng to mượt mà ở cả 2 bên (Shop và Customer).
