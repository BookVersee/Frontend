# Kế Hoạch Tối Ưu & Chuẩn Hóa Hệ Thống Biến Môi Trường (.env)

Đánh giá hiện trạng các file môi trường trong dự án, loại bỏ các file dư thừa gây phân mảnh, và hợp nhất thành mô hình chuẩn 2 file: **`.env`** (chứa cấu hình thực tế cho Docker Compose, Database, Backend, Frontend; được ẩn khỏi Git) và **`.env.example`** (mẫu chuẩn không lộ mật khẩu cho lập trình viên clone về).

---

## 1. Đánh Giá Hiện Trạng & Phân Tích Kỹ Thuật

### 1.1. Hiện trạng các file `.env` trong dự án
Dự án hiện đang có tới 4 file môi trường ở thư mục gốc:
1. [`.env`](file:///Users/nguyenvanminhtam/Frontend/.env): Chỉ chứa 3 biến lẻ tẻ (`VITE_APP_TITLE`, `VITE_API_TIMEOUT`, `VITE_ENABLE_AI_ASSISTANT`).
2. [`.env.development`](file:///Users/nguyenvanminhtam/Frontend/.env.development): Chứa đầy đủ các biến môi trường cho chạy dev local (API URL, WebSocket, Payment Gateways, Google Client ID,...).
3. [`.env.production`](file:///Users/nguyenvanminhtam/Frontend/.env.production): Chỉ chứa 5 biến sơ sài, trùng lặp.
4. [`.env.example`](file:///Users/nguyenvanminhtam/Frontend/.env.example): File mẫu với hướng dẫn cũ yêu cầu `cp .env.example .env.development`.

### 1.2. Xác định các điểm dư thừa và rủi ro bảo mật
- **Dư thừa & Gây xung đột cấu hình**:
  - Khi chạy `npm run dev`, Vite luôn ưu tiên nạp `.env.development` trước `.env`. Nếu lập trình viên cấu hình các biến trong `.env` thì sẽ bị `.env.development` ghi đè hoặc gây hiểu nhầm tại sao sửa `.env` mà không có tác dụng.
  - File `.env.production` không đầy đủ và không cần thiết tồn tại tĩnh trong mã nguồn, vì môi trường Production/Docker thường được inject biến môi trường trực tiếp từ Docker Compose hoặc CI/CD pipeline.
- **Rủi ro rò rỉ bảo mật (Security Leak)**:
  - Hiện tại trong file [`.gitignore`](file:///Users/nguyenvanminhtam/Frontend/.gitignore) chỉ có:
    ```gitignore
    .env.local
    .env.*.local
    *.local
    ```
    **HOÀN TOÀN THIẾU `.env`, `.env.development`, `.env.production`!**
  - Cả 3 file cấu hình thực tế này hiện **đang bị Git theo dõi (`tracked`)** và đã từng commit vào Git repo. Nếu người dùng đưa thông tin nhạy cảm (mật khẩu DB, secret key JWT, API secrets) vào `.env` lúc này, toàn bộ sẽ bị đẩy lên remote repository (GitHub).

### 1.3. Khả thi của việc gom thành 2 file (`.env` và `.env.example`)
> [!NOTE]
> **Hoàn toàn khả thi và là chuẩn mực tốt nhất (Best Practice) trong kiến trúc Web & Docker hiện đại:**
> 1. **Vite**: Mặc định tự động nạp `.env` cho mọi chế độ (cả `npm run dev` lẫn `npm run build`). Vite chỉ đóng gói (expose) các biến có tiền tố `VITE_` vào bundle trình duyệt, các biến hệ thống khác sẽ không bị lộ ra ngoài.
> 2. **Docker Compose**: Theo quy chuẩn của Docker Compose, khi thực thi `docker compose up`, Docker Compose sẽ **tự động ưu tiên đọc file `.env`** tại thư mục gốc để nạp các biến `${PORT_BACKEND}`, `${PORT_FRONTEND}`, `${DB_CONNECTION_STRING}`,... và truyền vào các container `frontend`, `backend`, `database`.
> 3. **.env.example**: Làm file tài liệu mẫu (Template) duy nhất được commit lên Git, chứa tên biến, mô tả và giá trị mặc định/placeholder, không chứa mật khẩu thực tế.

---

## User Review Required

> [!IMPORTANT]
> **Xóa bỏ theo dõi Git đối với các file cấu hình nội bộ:**
> Khi đưa `.env` vào `.gitignore`, chúng ta cần thực hiện lệnh `git rm --cached .env .env.development .env.production` để Git ngừng theo dõi các file này mà không làm mất nội dung local của bạn.
> Hai file dư thừa `.env.development` và `.env.production` sẽ được xóa bỏ sau khi đã gom toàn bộ cấu hình đầy đủ sang `.env`.

> [!WARNING]
> **Tuân thủ AGENTS.md đối với Backend:**
> File `.env` tại thư mục gốc có thể chứa các biến cấu hình cho Backend và Database (ví dụ SQL Server / PostgreSQL connection string) để Docker Compose truyền vào container Backend. Tuy nhiên, toàn bộ mã nguồn C# trong thư mục `Backend/` sẽ được giữ nguyên 100%, không bị sửa đổi.

---

## Proposed Changes

```
Frontend Root
├── .gitignore              <-- [MODIFY] Bổ sung .env và các pattern nhạy cảm, chỉ giữ lại !.env.example
├── .env.example            <-- [MODIFY] Chuẩn hóa mẫu biến: Ports, DB (SQL Server/Postgres), API, Vite, Secrets
├── .env                    <-- [MODIFY] Hợp nhất toàn bộ giá trị thực tế đang chạy tốt từ .env.development
├── .env.development        <-- [DELETE] Xóa bỏ file dư thừa (đã gom vào .env)
├── .env.production         <-- [DELETE] Xóa bỏ file dư thừa
├── README.md               <-- [MODIFY] Cập nhật hướng dẫn: cp .env.example .env
└── docs/...                <-- [MODIFY] Đồng bộ tài liệu hướng dẫn setup môi trường
```

---

### Component 1: Git Configuration & Bảo Mật

#### [MODIFY] [.gitignore](file:///Users/nguyenvanminhtam/Frontend/.gitignore)
- Cập nhật mục `# Environment files`:
  ```gitignore
  # Environment files & Secrets
  .env
  .env.development
  .env.production
  .env.test
  .env.local
  .env.*.local
  *.local
  
  # Luôn cho phép track file template mẫu
  !.env.example
  ```
- Thực hiện `git rm --cached` để loại bỏ các file env nhạy cảm khỏi Git index.

---

### Component 2: Chuẩn Hóa File Mẫu `.env.example`

#### [MODIFY] [.env.example](file:///Users/nguyenvanminhtam/Frontend/.env.example)
Cấu trúc lại thành 6 phần mạch lạc, bao gồm cả Docker Compose, Database, Backend và Frontend:
1. **Cổng dịch vụ & Docker Compose (Ports & Networking)**:
   - `PORT_FRONTEND=5173`
   - `PORT_BACKEND=5226`
   - `PORT_DB=1433` (hoặc 5432 nếu dùng PostgreSQL)
2. **Cơ sở dữ liệu (SQL Server / PostgreSQL)**:
   - `DB_HOST=localhost` (hoặc `db` trong docker network)
   - `DB_PORT=1433`
   - `DB_NAME=BookManagementDb`
   - `DB_USER=sa`
   - `DB_PASSWORD=YourStrongPasswordHere!`
   - `DB_CONNECTION_STRING=Server=localhost,1433;Database=BookManagementDb;User Id=sa;Password=YourStrongPasswordHere!;TrustServerCertificate=True;`
3. **Backend API & Core Security (.NET 8 Web API)**:
   - `ASPNETCORE_ENVIRONMENT=Development`
   - `JWT_SECRET_KEY=YourSuperSecretKeyForJwtAuthenticationMustBeLong123!`
   - `JWT_EXPIRE_MINUTES=60`
4. **Frontend Core & Vite Proxy (`VITE_*`)**:
   - `VITE_PORT=5173`
   - `VITE_APP_TITLE=BookVerse - Sàn Thương Mại Điện Tử Sách`
   - `VITE_APP_ENV=development`
   - `VITE_API_URL=/api`
   - `VITE_API_TIMEOUT=15000`
   - `VITE_BACKEND_URL=http://localhost:5226`
   - `VITE_WS_CHAT_URL=http://localhost:5226/hubs/chat`
   - `VITE_WS_NOTIF_URL=http://localhost:5226/hubs/notifications`
   - `VITE_WS_APP_URL=http://localhost:5226/hubs/app`
   - `VITE_ENABLE_MOCK=false`
   - `VITE_ENABLE_AI_ASSISTANT=true`
5. **Cổng thanh toán & Vận chuyển (Sandbox Gateways)**:
   - VNPay, MoMo, GHN Express (giữ dummy keys an toàn).
6. **Dịch vụ thứ 3 (Cloudinary & Google OAuth)**:
   - `VITE_CLOUDINARY_CLOUD_NAME=your-cloud-name`
   - `VITE_CLOUDINARY_UPLOAD_PRESET=your-preset`
   - `VITE_GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com`

---

### Component 3: Hợp Nhất & Dọn Dẹp File Cấu Hình Thực Tế

#### [MODIFY] [.env](file:///Users/nguyenvanminhtam/Frontend/.env)
- Đưa toàn bộ các giá trị thực tế đang hoạt động ổn định từ [`.env.development`](file:///Users/nguyenvanminhtam/Frontend/.env.development) sang file [`.env`](file:///Users/nguyenvanminhtam/Frontend/.env).
- Bổ sung các biến Docker Compose & Database connection string (SQL Server hiện tại của dự án: `Server=.;Database=BookManagementDb;Trusted_Connection=True;TrustServerCertificate=True;` hoặc format tương thích Docker).
- Đảm bảo đầy đủ các biến `VITE_*` mà mã nguồn frontend đang gọi.

#### [DELETE] [`.env.development`](file:///Users/nguyenvanminhtam/Frontend/.env.development)
- Xóa bỏ file này sau khi đã hợp nhất toàn bộ nội dung sang `.env`.

#### [DELETE] [`.env.production`](file:///Users/nguyenvanminhtam/Frontend/.env.production)
- Xóa bỏ file này để tránh phân mảnh cấu hình.

---

### Component 4: Đồng Bộ Tài Liệu Dự Án

#### [MODIFY] [README.md](file:///Users/nguyenvanminhtam/Frontend/README.md)
- Đổi lệnh hướng dẫn khởi tạo môi trường từ `cp .env.example .env.development` thành:
  ```bash
  cp .env.example .env
  ```
- Cập nhật sơ đồ cấu trúc thư mục (chỉ hiển thị `.env` và `.env.example`).

#### [MODIFY] Tài liệu trong `docs/`
- Cập nhật các vị trí đề cập đến `.env.development` trong [PROJECT_STRUCTURE_AND_GUIDE.md](file:///Users/nguyenvanminhtam/Frontend/docs/PROJECT_STRUCTURE_AND_GUIDE.md), [API_INTEGRATION_GUIDE.md](file:///Users/nguyenvanminhtam/Frontend/docs/API_INTEGRATION_GUIDE.md), [GOOGLE_OAUTH_AND_NETWORK_CONFIG_GUIDE.md](file:///Users/nguyenvanminhtam/Frontend/docs/GOOGLE_OAUTH_AND_NETWORK_CONFIG_GUIDE.md) để thống nhất trỏ về `.env`.

---

## Verification Plan

### Automated / Build Checks
1. **Kiểm tra biên dịch Vite**:
   ```bash
   npm run build
   ```
   Đảm bảo Vite đọc trơn tru biến từ `.env` duy nhất và build ra thư mục `dist/` thành công không lỗi thiếu biến.
2. **Kiểm tra trạng thái Git**:
   ```bash
   git status
   git ls-files .env*
   ```
   Đảm bảo:
   - `.env` KHÔNG còn xuất hiện trong danh sách tracked files.
   - `.env` bị git ignore và không bị commit khi gõ `git status`.
   - `.env.example` là file duy nhất còn được Git theo dõi.
   - `.env.development` và `.env.production` đã được xóa sạch.

### Manual Verification
1. Chạy thử server phát triển: `npm run dev -- --host` và kiểm tra ứng dụng khởi chạy bình thường, đọc đúng `VITE_API_URL` và `VITE_GOOGLE_CLIENT_ID`.
2. Kiểm tra xem các biến Docker Compose (Ports, Connection Strings) có sẵn sàng để một file `docker-compose.yml` bất kỳ sau này nạp vào hay không.
