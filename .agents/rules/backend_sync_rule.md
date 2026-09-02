# Quy Tắc Đồng Bộ Backend & Phát Triển Frontend

1. **Tuyệt đối KHÔNG chỉnh sửa code Backend**:
   - Thư mục `Backend/` luôn được giữ đồng bộ nguyên bản với nhánh `dev` trên GitHub repository `https://github.com/BookVersee/Backend.git`.
   - Bất kỳ can thiệp code nào cũng chỉ được thực hiện trong `src/` của Frontend.
2. **Frontend bám sát API Contract của Backend**:
   - Đọc kỹ Controller và Request DTO của Backend để truyền đúng parameters, body data types, query params.
   - Frontend tự xử lý mapping, fallback và validation để khớp hoàn hảo với Backend.
   - Khi cần cải tiến Backend, viết báo cáo đề xuất rõ ràng để người dùng chuyển tiếp cho đội ngũ Backend.
