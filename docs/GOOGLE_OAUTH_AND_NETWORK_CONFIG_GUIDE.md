# HƯỚNG DẪN THIẾT LẬP GOOGLE CLOUD OAUTH & CẤU HÌNH CỔNG KẾT NỐI (DÀNH CHO BACKEND DEV)

> **Tài liệu bàn giao từ**: Frontend Team  
> **Gửi tới**: Backend Development & DevOps Team  
> **Dự án**: BookVerse - Multi-Vendor Book Marketplace  
> **Mục tiêu**: Cung cấp danh sách chính xác các URL, Cổng mạng (Ports), và quy tắc cấu hình trong Google Cloud Console & Backend để đảm bảo **chạy thông suốt trên máy của tất cả thành viên trong nhóm**, không bị lỗi `origin_mismatch`, `CORS`, hay sai lệch cổng thanh toán.

---

## 1. MA TRẬN PHÂN BỔ CỔNG MẠNG (PORT ALLOCATION MATRIX)

Khi chạy cục bộ (Local Development), hệ thống BookVerse được phân bổ cổng chuẩn như sau:

| Dịch vụ | Địa chỉ URL Cục bộ | Vai trò | Ghi chú |
| :--- | :--- | :--- | :--- |
| **Frontend Web App** | `http://localhost:5173` | Giao diện Single Page Application (Vite + React 19) | Cổng chính của Frontend |
| **Frontend Fallback** | `http://localhost:5174`<br>`http://localhost:3000` | Cổng dự phòng khi cổng 5173 bị chiếm dụng | Cần cho phép trong Google Console |
| **Backend REST API** | `http://localhost:5226` | Máy chủ ASP.NET Core Web API (.NET 10.0) | Cung cấp REST endpoints |
| **Swagger UI** | `http://localhost:5226/swagger/index.html` | Tài liệu & công cụ kiểm thử API trực quan | Tự động sinh từ code |
| **SignalR Chat Hub** | `ws://localhost:5226/hubs/chat` | WebSocket real-time chat giữa Khách hàng & Shop | Giao thức 2 chiều |
| **SQL Server** | `localhost,1433` | CSDL SQL Server (Database `BookManagementDb`) | Kết nối qua EF Core |

---

## 2. CẤU HÌNH CHI TIẾT TRONG GOOGLE CLOUD CONSOLE

Bên Backend Dev khi tạo hoặc cấu hình **OAuth 2.0 Client ID** trên [Google Cloud Console](https://console.cloud.google.com/apis/credentials) cần thiết lập chính xác các mục sau:

### 2.1. Thông tin ứng dụng (Application Settings)
- **Application type**: `Web application` (Ứng dụng web)
- **Name**: `BookVerse Development & Testing Client`

---

### 2.2. Mục 1: Authorized JavaScript origins (Nguồn gốc JavaScript được phép)

> [!IMPORTANT]
> **Đây là mục quan trọng nhất**. Khi người dùng bấm nút đăng nhập Google trên trình duyệt, Google Identity Services (GIS) sẽ kiểm tra URL của trình duyệt có nằm trong danh sách này hay không. Nếu thiếu cổng, Google sẽ chặn ngay lập tức và báo lỗi đỏ `origin_mismatch`.

**Copy & Paste toàn bộ danh sách URL sau vào ô "Authorized JavaScript origins":**

```
http://localhost:5173
http://localhost:5174
http://localhost:5175
http://localhost:3000
http://localhost
http://127.0.0.1:5173
http://127.0.0.1:3000
```

*(Khi deploy lên Vercel/Production, chỉ cần bấm thêm `+ ADD URI` và điền domain thật, ví dụ: `https://bookverse-frontend.vercel.app`)*

> [!WARNING]
> **Quy tắc của Google**: Tuyệt đối **KHÔNG** thêm dấu gạch chéo `/` ở cuối các URL trong mục này (ví dụ: `http://localhost:5173/` là **SAI**, phải là `http://localhost:5173`).

---

### 2.3. Mục 2: Authorized redirect URIs (URI chuyển hướng được phép)

Điền danh sách URI sau vào ô **"Authorized redirect URIs"**:

```
http://localhost:5173
http://localhost:5173/
http://localhost:5173/auth/callback
http://localhost:5173/login
http://localhost:3000
https://developers.google.com/oauthplayground
```

*(URL `https://developers.google.com/oauthplayground` giúp Backend dev có thể chủ động tự sinh Google ID Token mẫu để test API qua Swagger/Postman mà không cần mở giao diện web).*

---

## 3. ĐỒNG BỘ MÃ CLIENT ID GIỮA FRONTEND VÀ BACKEND

Sau khi bấm **Save** trên Google Cloud Console, Google sẽ cấp một chuỗi **Client ID** (dạng `xxxxxxxxxxxx-xxxxxxxxxxxxxxxx.apps.googleusercontent.com`).

### 📌 Phía Backend
Điền mã này vào file `BookManagement.Api/appsettings.json` (hoặc `appsettings.Development.json`):
```json
{
  "GoogleAuth": {
    "ClientId": "YOUR_ACTUAL_CLIENT_ID.apps.googleusercontent.com"
  }
}
```

### 📌 Phía Frontend
Điền đúng cùng mã Client ID trên vào file `.env.development`:
```env
VITE_GOOGLE_CLIENT_ID=YOUR_ACTUAL_CLIENT_ID.apps.googleusercontent.com
```

> [!CAUTION]
> Cả Frontend và Backend **BẮT BUỘC DÙNG CHUNG 1 CLIENT ID**. Nếu Frontend dùng Client ID A nhưng Backend cấu hình Client ID B thì hàm `GoogleJsonWebSignature.ValidateAsync` của Backend sẽ ném lỗi `InvalidOperationException: Invalid Google ID Token (Audience mismatch)`.

---

## 4. CẤU HÌNH CORS TRONG BACKEND (PROGRAM.CS)

Để đảm bảo Frontend ở bất kỳ cổng dev nào (`5173`, `5174`, `3000`, `127.0.0.1`, Vercel deploy) đều gọi API và kết nối SignalR WebSocket thông suốt không bị lỗi CORS, trong file `BookManagement.Api/Program.cs` cấu hình CORS linh hoạt:

```csharp
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowFrontend", policy =>
    {
        policy.SetIsOriginAllowed(origin =>
            {
                if (string.IsNullOrEmpty(origin)) return false;
                var host = new Uri(origin).Host;
                return host == "localhost" 
                    || host == "127.0.0.1" 
                    || host.EndsWith(".vercel.app");
            })
            .AllowAnyHeader()
            .AllowAnyMethod()
            .AllowCredentials(); // Bắt buộc cho SignalR WebSockets và JWT Cookies
    });
});
```

---

## 5. CẤU HÌNH CỔNG THANH TOÁN (MOMO & VNPAY)

Trong file `BookManagement.Api/appsettings.json`, lưu ý cập nhật các URL Callback chuyển hướng sau khi khách thanh toán thành công về đúng cổng **5173** của Frontend:

```json
{
  "Momo": {
    "ApiUrl": "https://test-payment.momo.vn/v2/gateway/api/create",
    "PartnerCode": "MOMO",
    "AccessKey": "F8BBA842ECF85",
    "SecretKey": "K951B6PE1waDMi640xX08PD3vg6EkVlz",
    "RedirectUrl": "http://localhost:5173/payment-result",
    "IpnUrl": "http://localhost:5226/api/payment/momo/ipn",
    "RequestType": "captureWallet"
  },
  "VnPay": {
    "BaseUrl": "https://sandbox.vnpayment.vn/paymentv2/vpcpay.html",
    "TmnCode": "CGXZLS0Z",
    "HashSecret": "XNBCJFAKAZQSGTARRLRAZSMHKGVAENMT",
    "ReturnUrl": "http://localhost:5173/payment-result"
  }
}
```

---

## 6. CHECKLIST KIỂM TRA NHANH KHI TRIỂN KHAI (QUICK CHECKLIST)

- [ ] Đã thêm `http://localhost:5173` và `http://localhost:3000` vào **Authorized JavaScript origins** trên Google Cloud Console.
- [ ] Đã dán cùng một mã `ClientId` vào `appsettings.json` (Backend) và `.env.development` (Frontend).
- [ ] Cấu hình CORS trong `Program.cs` cho phép mọi `localhost` origins và `.AllowCredentials()`.
- [ ] Đã đổi `Momo:RedirectUrl` và `VnPay:ReturnUrl` trỏ về `http://localhost:5173/payment-result`.
- [ ] Khởi động Backend (`dotnet run --project BookManagement.Api`) -> `http://localhost:5226`.
- [ ] Khởi động Frontend (`npm run dev`) -> `http://localhost:5173`.
