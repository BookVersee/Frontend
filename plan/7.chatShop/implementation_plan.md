# Kế hoạch điều tra & Khắc phục lỗi Gửi ảnh trong Phân hệ Chat

Tài liệu này phân tích chi tiết nguyên nhân kỹ thuật và đề xuất giải pháp xử lý theo đúng yêu cầu:
1. Vì sao gửi ảnh thứ 2 thì ảnh thứ 1 bị biến mất trên giao diện Shop?
2. Vì sao bên giao diện Customer hoàn toàn không nhìn thấy ảnh do Shop gửi?
3. Các API hiện tại đã hoạt động như thế nào, và Backend đã lưu `ImageUrl` xuống Database chưa?

---

## I. KẾT QUẢ ĐIỀU TRA KỸ THUẬT (AUDIT REPORT)

### 1. Backend đã xử lý và lưu `ImageUrl` xuống DB chưa?
* **Cơ sở dữ liệu (Database)**:
  * Thực thể `Message.cs` ([`Backend/BookManagement.Repository/Entities/Message.cs`](file:///Users/nguyenvanminhtam/Frontend/Backend/BookManagement.Repository/Entities/Message.cs#L11)) đã có sẵn cột:
    ```csharp
    public string? ImageUrl { get; set; }
    ```
* **Logic lưu trữ của Backend (`ChatService.cs`)**:
  * Khi gọi API `/api/chat/SendMessage` ([`Backend/BookManagement.Service/Chat/ChatService.cs`](file:///Users/nguyenvanminhtam/Frontend/Backend/BookManagement.Service/Chat/ChatService.cs#L213-L221)):
    ```csharp
    var message = new Message
    {
        Id = Guid.NewGuid(),
        ChatId = chat.Id,
        SenderId = senderId,
        Content = dto.Content?.Trim(),
        ImageUrl = dto.ImageUrl?.Trim(), // Đã gán link ảnh
        CreatedAt = DateTimeOffset.UtcNow
    };
    _db.Messages.Add(message);
    await _db.SaveChangesAsync(); // ĐÃ LƯU XUỐNG DATABASE SQL SERVER
    ```
  * Khi lấy lịch sử tin nhắn (`GetChatMessagesAsync`), Backend cũng select đầy đủ `ImageUrl = m.ImageUrl`.
* **Kết luận về Backend**:
  * **Backend ĐÃ lưu `ImageUrl` xuống Database thành công 100%** (Trong ảnh chụp Network của bạn, request `SendMessage` cuối cùng đã đạt **HTTP 200 OK** màu đen, không còn lỗi 400).

---

### 2. Tại sao gửi ảnh thứ 2 thì ảnh thứ 1 bị biến mất?
* **Vị trí lỗi**: Hàm `cleanAndDeduplicateMessages` trong [`src/services/chatService.ts`](file:///Users/nguyenvanminhtam/Frontend/src/services/chatService.ts#L29-L49).
* **Nguyên nhân gốc rễ**:
  * Hàm khử trùng lặp tin nhắn đang tạo khóa nhận diện (`contentKey`) như sau:
    ```ts
    const contentKey = `${String(m.senderId)}_${m.text.trim()}_${m.createdAt || ""}`;
    ```
  * Khi Shop gửi 2 bức ảnh liên tiếp trong cùng một khoảng thời gian:
    * Cả 2 tin nhắn đều có `text = "Shop gửi bạn ảnh chụp thực tế của sách"`.
    * Cả 2 tin nhắn đều có cùng `senderId` và cùng phút gửi (ví dụ: `15:13`).
    * Trong khi `contentKey` **hoàn toàn KHÔNG đưa `m.imageUrl` vào chuỗi nhận diện**.
  * Hậu quả: Khi gửi ảnh thứ 2, hệ thống thấy `contentKey` trùng khớp 100% với ảnh thứ 1. Thuật toán coi ảnh thứ 2 là bản tin trùng lặp (duplicate), lập tức **ghi đè hoặc loại bỏ ảnh thứ 1**, khiến trên màn hình chỉ còn lại duy nhất 1 ảnh!

---

### 3. Tại sao bên giao diện Customer hoàn toàn không nhìn thấy ảnh?
* **Vị trí lỗi**: Component hiển thị tin nhắn trong [`src/components/chat/ChatDrawer.tsx`](file:///Users/nguyenvanminhtam/Frontend/src/components/chat/ChatDrawer.tsx#L434-L443).
* **Nguyên nhân gốc rễ**:
  * Giao diện Customer (`ChatDrawer.tsx`) từ đầu chỉ được viết để render text đơn thuần:
    ```tsx
    <div className={`max-w-[82%] rounded-2xl px-4 py-2.5 ...`}>
      <p className="leading-relaxed whitespace-pre-wrap">{m.text}</p>
    </div>
    ```
  * Khung chat của Customer **HOÀN TOÀN CHƯA CÓ THẺ `<img>` ĐỂ HIỂN THỊ `m.imageUrl`**!
  * Do đó, dù Backend trả về đầy đủ `imageUrl` và LocalStorage/SignalR đã đồng bộ link ảnh, bên giao diện Customer **chỉ hiện mỗi dòng chữ text** *"Shop gửi bạn ảnh chụp thực tế của sách"* mà không hề vẽ bức ảnh ra màn hình!

---

## II. ĐỀ XUẤT KẾ HOẠCH KHẮC PHỤC (PROPOSED SOLUTION)

### Bước 1: Sửa thuật toán nhận diện tin nhắn trong `src/services/chatService.ts`
* Đưa `m.imageUrl` và `m.id` vào `contentKey` để mỗi bức ảnh là một thực thể độc lập duy nhất:
  ```ts
  const contentKey = `${String(m.senderId)}_${m.text.trim()}_${m.imageUrl || ""}_${m.id || m.createdAt || ""}`;
  ```
* Đảm bảo gửi bao nhiêu ảnh thì hiển thị bấy nhiêu ảnh, không bao giờ bị đè hoặc nuốt ảnh cũ.

### Bước 2: Nâng cấp giao diện hiển thị tin nhắn bên Customer (`src/components/chat/ChatDrawer.tsx`)
* Bổ sung khối render hình ảnh trong bong bóng chat của Customer:
  ```tsx
  {m.imageUrl && (
    <div className="mb-2 rounded-xl overflow-hidden border border-slate-200 bg-white p-1">
      <img
        src={m.imageUrl}
        alt="Ảnh chụp thực tế"
        onClick={() => setPreviewImageModal(m.imageUrl)}
        className="w-full max-h-64 object-cover rounded-lg cursor-pointer hover:opacity-90 transition-opacity"
      />
      <p className="text-[10px] text-slate-500 mt-1 px-1">📸 Bấm vào ảnh để phóng to</p>
    </div>
  )}
  ```
* Tích hợp Modal phóng to xem ảnh chi tiết cho khách hàng (giống bên Shop).

### Bước 3: Đồng bộ sự kiện Real-time & LocalStorage giữa 2 bên
* Đảm bảo khi Shop gửi ảnh thành công, sự kiện `bookverse_chat_updated` kích hoạt để `ChatDrawer` bên Customer tự động nạp lại và render ngay lập tức mà không cần F5.

---

## III. KẾ HOẠCH KIỂM THỬ (VERIFICATION PLAN)

1. **Kiểm tra trên Shop**: Gửi ảnh thứ 1 ➔ Gửi tiếp ảnh thứ 2 ➔ Cả 2 ảnh đều hiển thị song song đầy đủ.
2. **Kiểm tra trên Customer**: Mở cửa sổ chat với Shop ➔ Thấy rõ cả 2 ảnh chụp thực tế kèm chú thích.
3. **Kiểm tra Modal phóng to**: Click vào ảnh ở cả 2 phía để kiểm tra trải nghiệm phóng to sắc nét.
4. **Kiểm tra Build**: Chạy `npm run build` đảm bảo không có bất kỳ lỗi TypeScript nào.
