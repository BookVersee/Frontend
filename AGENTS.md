# BỘ QUY TẮC PHÁT TRIỂN DỰ ÁN (PROJECT RULES & GUIDELINES)

## ⚠️ QUY TẮC BẮT BUỘC 1: QUẢN LÝ MÃ NGUỒN BACKEND VÀ FRONTEND
1. **Tuyệt đối KHÔNG tự ý chỉnh sửa bất kỳ file mã nguồn nào trong thư mục `Backend/`**:
   - Thư mục `Backend/` là repository riêng được đồng bộ 100% với nhánh `dev` từ remote GitHub (`https://github.com/BookVersee/Backend.git`).
   - Mọi thay đổi logic, giao diện, state management và xử lý lỗi chỉ được phép thực hiện trong mã nguồn **Frontend (`src/`)**.
2. **Dựa trên API Contract hiện tại của Backend để điều chỉnh Frontend**:
   - Luôn đọc và bám sát các DTO, Controller, Service hiện có của Backend để gửi đúng cấu trúc payload (parameters, query params, body dto, data types).
   - Nếu Backend có ràng buộc (ví dụ `PublishedYear` từ 1000 đến 2100), Frontend phải validate và gửi đúng dữ liệu hợp lệ.
   - Nếu Backend thiếu tính năng hoặc có lỗi nghiệp vụ thuộc phạm vi Backend, lập tài liệu đề xuất rõ ràng để người dùng gửi cho đội ngũ Dev Backend, **không được tự ý sửa file C# của Backend**.

---

## 2. QUY TẮC THIẾT KẾ GIAO DIỆN & TRẢI NGHIỆM NGƯỜI DÙNG (UI/UX)
- Giao diện phải hiện đại, trực quan, hỗ trợ đầy đủ tính năng thực tế cho Sàn Thương mại Điện tử sách:
  - Xem nhiều ảnh sản phẩm (ảnh bìa chính + các trang đọc thử / góc chụp thực tế) kèm thumbnail gallery tương tác và zoom modal.
  - Quản lý đánh giá / phản hồi minh bạch, rõ ràng theo đúng nghiệp vụ Backend.
  - Xử lý trạng thái tải (loading), thông báo thành công / thất bại (toast / banner) chuyên nghiệp.
