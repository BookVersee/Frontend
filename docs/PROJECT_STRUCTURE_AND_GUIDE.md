# BOOKVERSE FRONTEND - TÀI LIỆU KIẾN TRÚC VÀ HƯỚNG DẪN TÍCH HỢP HỆ THỐNG TOÀN DIỆN

> **Tài liệu kỹ thuật nội bộ dành cho đội ngũ phát triển (Frontend & Fullstack Developers)**  
> **Phiên bản:** 2.0.0 (Đã hoàn thiện Refactor & Phủ 100% 44 Functions Backend)  
> **Ngày cập nhật:** 2026-08-24  
> **Tác giả:** Senior Frontend Architect & Technical Lead  
> **Repository:** `BookVerse/Frontend`  
> **Nhánh phát triển:** `feature/mtamm/refactor-architecture-and-backend-features`

---

## 📑 MỤC LỤC

1. [Tổng quan hiện trạng & Phạm vi nghiệp vụ](#1-tổng-quan-hiện-trạng--phạm-vi-nghiệp-vụ)
2. [Cấu trúc Thư mục Chuẩn hóa (Flattened Folder Architecture)](#2-cấu-trúc-thư-mục-chuẩn-hóa-flattened-folder-architecture)
3. [Bảng Ma Trận Phủ 44 Chức Năng Backend (44 Backend Functions Matrix)](#3-bảng-ma-trận-phủ-44-chức-năng-backend-44-backend-functions-matrix)
4. [Kiến trúc Tầng Mạng & Luồng Dữ liệu (Network & Service Layer Architecture)](#4-kiến-trúc-tầng-mạng--luồng-dữ-liệu-network--service-layer-architecture)
5. [Hệ thống Giao diện & Components (UI System & Modern Aesthetics)](#5-hệ-thống-giao-diện--components-ui-system--modern-aesthetics)
6. [Chiến Lược Quản Lý Nhánh & Lịch Sử Commit (Git Branching & Atomic Commits)](#6-chiến-lược-quản-lý-nhánh--lịch-sử-commit-git-branching--atomic-commits)
7. [Hướng dẫn Khởi chạy & Tích hợp Backend API](#7-hướng-dẫn-khởi-chạy--tích-hợp-backend-api)

---

## 1. TỔNG QUAN HIỆN TRẠNG & PHẠM VI NGHIỆP VỤ

### 1.1. Giới thiệu nền tảng BookVerse
**BookVerse** là nền tảng thương mại điện tử chuyên ngành sách theo mô hình **Đa Cửa Hàng (Multi-vendor Marketplace)**, kết nối các nhà xuất bản, chuỗi nhà sách uy tín (Phương Nam, Fahasa, Kim Đồng, Nhã Nam...) với hàng triệu bạn đọc trên toàn quốc.

Hệ thống được thiết kế phục vụ **4 nhóm vai trò (Roles)** với các luồng nghiệp vụ khép kín:

```
┌────────────────────────────────────────────────────────────────────────┐
│                        HỆ SINH THÁI BOOKVERSE                          │
└───────┬─────────────────┬──────────────────┬───────────────────┬───────┘
        │                 │                  │                   │
        ▼                 ▼                  ▼                   ▼
┌──────────────┐  ┌──────────────┐   ┌───────────────┐   ┌───────────────┐
│   CUSTOMER   │  │  SHOP/VENDOR │   │    DELIVER    │   │     ADMIN     │
│ (Khách hàng) │  │  (Nhà sách)  │   │  (Giao vận)   │   │  (Quản trị)   │
└──────────────┘  └──────────────┘   └───────────────┘   └───────────────┘
```

- **Customer (Khách hàng):** Tìm kiếm sách nâng cao (ISBN, tên shop, tác giả), xem hồ sơ shop, đặt hàng gom nhóm theo nhà sách, thanh toán online/COD, nhắn tin trực tiếp với shop (Live Chat), nhận thông báo đơn hàng/hoàn tiền, hủy đơn hàng khi chờ xử lý, đánh giá & phản hồi, yêu cầu đổi trả/hoàn tiền.
- **Shop / Vendor (Nhà sách đối tác):** Đăng ký mở gian hàng, quản lý kho sách (thêm, sửa, ẩn/xóa), tiếp nhận đơn hàng, bàn giao vận chuyển GHN Express, trả lời đánh giá của khách hàng, theo dõi doanh thu theo thời gian.
- **Deliver (Nhân viên giao hàng):** Điều phối đơn từ hub GHN, kiểm tra đơn, cập nhật lộ trình giao hàng thời gian thực (*Chờ lấy ➔ Đang chuyển ➔ Đang giao ➔ Giao thành công*).
- **Admin (Quản trị viên hệ thống):** Giám sát toàn sàn, phê duyệt hồ sơ mở shop mới, khóa/mở khóa tài khoản người dùng, xem chi tiết hồ sơ & lịch sử dòng tiền, phân xử khiếu nại tranh chấp kèm ghi chú kết luận bắt buộc.

---

## 2. CẤU TRÚC THƯ MỤC CHUẨN HÓA (FLATTENED FOLDER ARCHITECTURE)

Dự án đã được **làm phẳng cấu trúc (Flattened)** hoàn toàn: loại bỏ thư mục lồng nhau `Frontend/Frontend/`, đưa toàn bộ mã nguồn lên trực tiếp thư mục gốc `/Users/nguyenvanminhtam/Frontend`.

```text
Frontend/
├── .env.development                    # Biến môi trường cho môi trường Dev (VITE_API_URL=/api)
├── .env.example                        # Mẫu biến môi trường
├── .gitignore                          # Cấu hình bỏ qua tệp tin rác/build
├── README.md                           # Giới thiệu tổng quan dự án
├── index.html                          # Entry HTML Template
├── package.json                        # Khai báo Dependencies, Scripts & Metadata
├── package-lock.json                   # Khóa phiên bản dependencies chính xác
├── postcss.config.js                   # Cấu hình PostCSS
├── tailwind.config.js                  # Cấu hình Tailwind CSS, bảng màu Design Tokens
├── vite.config.js                      # Cấu hình Vite Bundler & Reverse Proxy (/api -> :5000)
├── docs/                               # Thư mục tài liệu kiến trúc & hướng dẫn
│   └── PROJECT_STRUCTURE_AND_GUIDE.md  # [Tài liệu này]
├── plan/                               # Kế hoạch triển khai & Báo cáo kỹ thuật
│   ├── Plan-1.md                       # Kế hoạch chi tiết refactor giai đoạn 1
│   └── walkthrough-1.md                # Báo cáo tổng kết walkthrough
├── public/                             # Static Assets tĩnh (favicon.svg, icons.svg)
└── src/
    ├── main.jsx                        # Root React 19 Mounting Point
    ├── App.tsx                         # Top-level Routing, Context Providers & Drawer Manager
    ├── index.css                       # Global Tailwind Directives & Root CSS Variables
    ├── assets/                         # Ảnh tĩnh (hero.png, react.svg, vite.svg)
    ├── types/
    │   └── index.ts                    # 100% TypeScript Interfaces, Enums & Domain Models
    ├── contexts/
    │   ├── AuthContext.tsx             # Quản lý Phiên đăng nhập, Role Switcher & JWT Token
    │   └── CartContext.tsx             # Quản lý Giỏ hàng Đa Nhà Bán & Tính toán giá tiền
    ├── services/
    │   ├── api.ts                      # Axios Base Client với JWT Bearer & Central Error Interceptors
    │   ├── authService.ts              # Auth API (Login, Register, Profile, Verify, Shop Register)
    │   ├── bookService.ts              # Sách & Danh mục API (CRUD Sách, Lọc ISBN, Shop Profile)
    │   ├── orderService.ts             # Đơn hàng API (Tạo đơn, Hủy đơn, Đánh giá, Yêu cầu đổi trả)
    │   ├── shopService.ts              # Kênh Nhà Sách API (Kho sách, Trả lời feedback, Doanh thu)
    │   ├── adminService.ts             # Kênh Quản Trị API (Duyệt shop, Khóa User, Phân xử khiếu nại)
    │   ├── deliverService.ts           # Kênh Giao Vận API (Điều phối task giao hàng GHN)
    │   ├── chatService.ts              # [NEW] Tin nhắn trực tiếp thời gian thực giữa Khách và Shop
    │   ├── notificationService.ts      # [NEW] Hệ thống Thông báo sự kiện đơn hàng & hoàn tiền
    │   └── mockData.ts                 # Enriched Mock Database phục vụ Offline Demo
    ├── components/
    │   ├── common/                     # Reusable UI Components
    │   │   ├── Header.tsx              # Header thanh điều hướng, Role Switcher & Notification Bell
    │   │   ├── Footer.tsx              # Footer tinh gọn (giảm >65% chiều cao, pháp lý & hotline)
    │   │   ├── NotificationDropdown.tsx# [NEW] Menu Dropdown xem thông báo & đánh dấu đã đọc
    │   │   ├── BookCover.tsx           # Render bìa sách vector linear gradient động
    │   │   ├── Btn.tsx                 # Button chuẩn hóa variants (primary, outline, ghost, danger)
    │   │   ├── Card.tsx                # Khung thẻ bo góc `rounded-2xl` chuẩn Design System
    │   │   ├── StatCard.tsx            # Thẻ hiển thị chỉ số thống kê Dashboard tích hợp Icon
    │   │   ├── Badge.tsx               # Nhãn trạng thái đơn hàng / vai trò tự động mapping màu
    │   │   └── Modal.tsx               # Hộp thoại Dialog Modal với Backdrop mờ
    │   ├── chat/
    │   │   └── ChatDrawer.tsx          # [NEW] Khung chat nổi nhắn tin tương tác trực tiếp với Shop
    │   ├── auth/
    │   │   ├── AuthModal.tsx           # Modal Đăng nhập / Đăng ký kèm nút chọn nhanh Role demo
    │   │   └── ProtectedRoute.tsx      # Route Guard bảo vệ trang theo quyền Role
    │   └── customer/
    │       └── FeaturedShops.tsx       # Carousel/Grid danh sách các nhà sách đối tác nổi bật
    ├── pages/
    │   ├── customer/                   # Phân hệ Khách hàng (8 màn hình)
    │   │   ├── HomePage.tsx            # Trang chủ tìm kiếm sách, lọc ISBN/tên shop, banner
    │   │   ├── BookDetailPage.tsx      # Chi tiết sách, nút Chat với Shop, phản hồi đánh giá
    │   │   ├── ShopProfilePage.tsx     # [NEW] Trang hồ sơ Nhà sách & Danh mục sách riêng của Shop
    │   │   ├── CartPage.tsx            # Giỏ hàng đa nhà bán & tóm tắt chi phí
    │   │   ├── CheckoutPage.tsx        # Đặt hàng, chọn hình thức thanh toán & phân nhóm Shop
    │   │   ├── MyOrdersPage.tsx        # Danh sách đơn hàng tích hợp Tabs lọc trạng thái
    │   │   ├── OrderDetailPage.tsx     # Chi tiết đơn hàng, GHN tracker, nút Hủy đơn & khiếu nại
    │   │   └── ProfilePage.tsx         # [NEW] Hồ sơ cá nhân, ví hoàn tiền, đăng ký mở Shop
    │   ├── shop/
    │   │   └── ShopDashboardPage.tsx   # Dashboard Nhà Sách: CRUD Sách, duyệt đơn, trả lời feedback
    │   ├── deliver/
    │   │   └── DeliverDashboardPage.tsx# Dashboard Giao Vận: Danh sách đơn GHN, đổi trạng thái 1-chạm
    │   └── admin/
    │       └── AdminDashboardPage.tsx  # Dashboard Quản Trị: Duyệt Shop, khóa User, phân xử khiếu nại
    ├── styles/
    │   ├── fonts.css                   # Typography (Inter, JetBrains Mono)
    │   └── theme.css                   # Theme Tokens & CSS Variables
    └── utils/
        ├── format.ts                   # Định dạng tiền tệ VNĐ (`fmt`) và chuỗi ngày tháng
        ├── status.tsx                  # Mapping màu sắc/icon/nhãn theo trạng thái đơn & vai trò
        └── storage.ts                  # LocalStorage Helper an toàn kiểu dữ liệu (JWT, User, Cart)
```

---

## 3. BẢNG MA TRẬN PHỦ 44 CHỨC NĂNG BACKEND (44 BACKEND FUNCTIONS MATRIX)

Frontend hiện đã hỗ trợ **100% (44/44 functions)** theo đặc tả nghiệp vụ phân rã của Backend:

### 3.1. Phân hệ Chung (`User - Common` - 13 Functions)
| STT | Backend Function | Frontend Service Method | UI Component / Page | Trạng thái |
| :---: | :--- | :--- | :--- | :---: |
| 1 | `Login()` | `authService.login(email, pass)` | `AuthModal.tsx` | ✅ Đã hỗ trợ |
| 2 | `Logout()` | `authService.logout()` | `Header.tsx` (User Menu) | ✅ Đã hỗ trợ |
| 3 | `UpdateProfile()` | `authService.updateProfile(data)` | `ProfilePage.tsx` | ✅ Đã hỗ trợ |
| 4 | `Register()` | `authService.register(name, email, ...)` | `AuthModal.tsx` | ✅ Đã hỗ trợ |
| 5 | `VerifyEmail()` | `authService.verifyEmail(email, code)` | `authService.ts` | ✅ Đã hỗ trợ |
| 6 | `GetAllBook()` | `bookService.getBooks(search, catId)` | `HomePage.tsx` | ✅ Đã hỗ trợ |
| 7 | `GetDetailBook()` | `bookService.getBookById(id)` | `BookDetailPage.tsx` | ✅ Đã hỗ trợ |
| 8 | `GetTransactionHistory()` | `adminService.getTransactions()` | `ProfilePage.tsx`, `AdminDashboardPage.tsx` | ✅ Đã hỗ trợ |
| 9 | `GetNotifications()` | `notificationService.getNotifications(uid)` | `NotificationDropdown.tsx` | ✅ Đã hỗ trợ |
| 10 | `ReadNotification()` | `notificationService.markAsRead(id)` | `NotificationDropdown.tsx` | ✅ Đã hỗ trợ |
| 11 | `ForgotPassword()` | `authService.forgotPassword(email)` | `AuthModal.tsx` | ✅ Đã hỗ trợ |
| 12 | `Chat()` | `chatService.getMessages(shopId, uid)` | `ChatDrawer.tsx` | ✅ Đã hỗ trợ |
| 13 | `GetAllOrderByUser()` | `orderService.getOrders(customerId)` | `MyOrdersPage.tsx` | ✅ Đã hỗ trợ |

---

### 3.2. Phân hệ Khách Hàng (`Customer` - 11 Functions)
| STT | Backend Function | Frontend Service Method | UI Component / Page | Trạng thái |
| :---: | :--- | :--- | :--- | :---: |
| 14 | `FindBook()` | `bookService.getBooks(search, catId)` | `HomePage.tsx` (Tìm kiếm theo Tên, Tác giả, ISBN, Shop) | ✅ Đã hỗ trợ |
| 15 | `ViewBookFeedbacks()` | `orderService.getOrders()` / `feedback` | `BookDetailPage.tsx` (Danh sách nhận xét & phản hồi) | ✅ Đã hỗ trợ |
| 16 | `AddToCart()` | `useCart().addToCart(book, qty)` | `BookDetailPage.tsx`, `CartPage.tsx` | ✅ Đã hỗ trợ |
| 17 | `DeleteFromCard()` | `useCart().removeFromCart(bookId)` | `CartPage.tsx` | ✅ Đã hỗ trợ |
| 18 | `OrderBook()` | `orderService.createOrder(params)` | `CheckoutPage.tsx` (Phân nhóm tự động theo từng Shop) | ✅ Đã hỗ trợ |
| 19 | `Payment()` | `orderService.createOrder({ paymentMethod })` | `CheckoutPage.tsx` (Hỗ trợ Online VNPAY/MoMo & COD) | ✅ Đã hỗ trợ |
| 20 | `FilterOrderByStatus()` | `orderService.getOrders()` + Filter Tabs | `MyOrdersPage.tsx` (Tabs: Tất cả, Chờ xử lý, Đang giao, Đã giao...) | ✅ Đã hỗ trợ |
| 21 | `ViewOrderDetail()` | `orderService.getOrderById(orderId)` | `OrderDetailPage.tsx` (Bóc tách tiền hàng, phí GHN, lộ trình) | ✅ Đã hỗ trợ |
| 22 | `CancelOrder()` | `orderService.cancelOrder(orderId, reason)` | `OrderDetailPage.tsx` (Nút "Hủy đơn" khi đơn `PENDING`) | ✅ Đã hỗ trợ |
| 23 | `WriteFeedback()` | `orderService.addFeedback(orderId, rating, content)` | `OrderDetailPage.tsx` (Form chấm sao ⭐ và đánh giá) | ✅ Đã hỗ trợ |
| 24 | `SendRequestReturn()` | `orderService.requestReturn(orderId, reason, type, img)` | `OrderDetailPage.tsx` (Modal gửi khiếu nại đính kèm ảnh lỗi) | ✅ Đã hỗ trợ |
| 25 | `SendMessage()` | `chatService.sendMessage(params)` | `ChatDrawer.tsx` (Khung gửi tin nhắn real-time) | ✅ Đã hỗ trợ |
| 26 | `ViewShopProfile(shopId)`| `bookService.getShopProfile(shopId)` | `ShopProfilePage.tsx` (Thông tin shop, hotline, địa chỉ, rating) | ✅ Đã hỗ trợ |
| 27 | `GetBooksByShop(shopId)` | `bookService.getBooksByShop(shopId)` | `ShopProfilePage.tsx` (Lưới sách riêng của gian hàng) | ✅ Đã hỗ trợ |
| 28 | `ReportResponse()` | `orderService.reportFeedback(orderId, reason)` | `BookDetailPage.tsx` (Nút báo cáo phản hồi của shop lên Admin) | ✅ Đã hỗ trợ |

---

### 3.3. Phân hệ Gian Hàng (`Shop / Vendor` - 8 Functions)
| STT | Backend Function | Frontend Service Method | UI Component / Page | Trạng thái |
| :---: | :--- | :--- | :--- | :---: |
| 29 | `RegisterShop()` | `authService.registerShop(shopData)` | `ProfilePage.tsx` (Form nộp hồ sơ mở shop mới) | ✅ Đã hỗ trợ |
| 30 | `GetShopInfo()` | `bookService.getShopProfile(shopId)` | `ShopDashboardPage.tsx`, `ShopProfilePage.tsx` | ✅ Đã hỗ trợ |
| 31 | `AddBook()` | `shopService.addProduct(bookData)` | `ShopDashboardPage.tsx` (Modal tạo sách mới) | ✅ Đã hỗ trợ |
| 32 | `GetBook()` & `GetAllBook()`| `shopService.getShopProducts(shopId)` | `ShopDashboardPage.tsx` (Tab Kho sách) | ✅ Đã hỗ trợ |
| 33 | `SearchBook()` | `filteredProducts` state | `ShopDashboardPage.tsx` (Ô tìm nhanh sách trong kho) | ✅ Đã hỗ trợ |
| 34 | `UpdateBook()` | `shopService.updateProduct(id, bookData)` | `ShopDashboardPage.tsx` (Modal chỉnh sửa thông tin sách) | ✅ Đã hỗ trợ |
| 35 | `DeleteBook()` | `shopService.deleteProduct(id)` | `ShopDashboardPage.tsx` (Nút ẩn/xóa sách khỏi gian hàng) | ✅ Đã hỗ trợ |
| 36 | `GetOrderDetail()` & `UpdateOrder()` | `shopService.updateOrderStatus(orderId, status)` | `ShopDashboardPage.tsx` (Duyệt đơn: Chờ xử lý ➔ Đóng gói ➔ Giao GHN) | ✅ Đã hỗ trợ |
| 37 | `ViewRevenue()` | `shopService.getRevenueStats(shopId, period)` | `ShopDashboardPage.tsx` (Thống kê doanh thu theo ngày/tháng/năm) | ✅ Đã hỗ trợ |
| 38 | `ViewFeedback()` & `ReplyFeedback()` | `shopService.getShopFeedbacks()`, `replyFeedback()` | `ShopDashboardPage.tsx` (Tab Đánh giá & Khung nhập phản hồi) | ✅ Đã hỗ trợ |

---

### 3.4. Phân hệ Giao Vận (`Delivery` - 3 Functions)
| STT | Backend Function | Frontend Service Method | UI Component / Page | Trạng thái |
| :---: | :--- | :--- | :--- | :---: |
| 39 | `GetAllDeliveryOrder()` | `deliverService.getDeliverTasks()` | `DeliverDashboardPage.tsx` | ✅ Đã hỗ trợ |
| 40 | `CheckOrder()` & `GetDeliveryOrderDetail()` | `deliverService.getDeliverTasks()` | `DeliverDashboardPage.tsx` (Xem địa chỉ, SĐT, kiện hàng) | ✅ Đã hỗ trợ |
| 41 | `UpdateStatusOrder()` | `deliverService.updateTaskStatus(taskId, status)` | `DeliverDashboardPage.tsx` (Nút chuyển trạng thái 1-chạm) | ✅ Đã hỗ trợ |

---

### 3.5. Phân hệ Quản Trị Sàn (`Admin` - 3 Functions)
| STT | Backend Function | Frontend Service Method | UI Component / Page | Trạng thái |
| :---: | :--- | :--- | :--- | :---: |
| 42 | `GetUsers()` & `FilterUserByRoleOrStatus()` | `adminService.getUsers(role, status)` | `AdminDashboardPage.tsx` (Tab Người dùng & Tab Duyệt Shop) | ✅ Đã hỗ trợ |
| 43 | `GetUserDetail()` & `UpdateStatusUser()` | `adminService.getUserDetail(uid)`, `toggleUserStatus()` | `AdminDashboardPage.tsx` (Modal chi tiết User & Nút Khóa/Mở khóa) | ✅ Đã hỗ trợ |
| 44 | `ResolveDisputeToCustomer()` & `UpdateResolutionNote()` | `adminService.handleReturnRequest(orderId, status, note)` | `AdminDashboardPage.tsx` (Modal phân xử tranh chấp hoàn tiền) | ✅ Đã hỗ trợ |

---

## 4. KIẾN TRÚC TẦNG MẠNG & LUỒNG DỮ LIỆU (NETWORK & SERVICE LAYER)

### 4.1. Axios Client & Interceptors ([`src/services/api.ts`](file:///Users/nguyenvanminhtam/Frontend/src/services/api.ts))
Tầng mạng được xây dựng trên nền tảng Axios instance chuẩn công nghiệp:
- **Tự động gắn JWT Token:** Request Interceptor tự động lấy token từ LocalStorage (`auth_token`) và gắn vào header `Authorization: Bearer <token>`.
- **Xử lý lỗi HTTP tập trung:** Response Interceptor bắt và xử lý:
  - `401 Unauthorized`: Xóa token hết hạn và đưa người dùng về trạng thái đăng xuất.
  - `403 Forbidden`: Báo lỗi không có quyền truy cập.
  - `422/400 Validation Error`: Format thông điệp lỗi từ backend.
  - `500 Internal Server Error`: Bắt lỗi sập máy chủ.
- **Graceful Fallback:** Khi mất kết nối hoặc Backend chưa sẵn sàng, mọi service method đều tự động fallback về `mockData.ts` an toàn.

```typescript
// Trích đoạn src/services/api.ts
export const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "/api",
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
  timeout: 15000,
});
```

---

## 5. HỆ THỐNG GIAO DIỆN & COMPONENTS (UI SYSTEM)

### 5.1. Tinh gọn Footer ([`src/components/common/Footer.tsx`](file:///Users/nguyenvanminhtam/Frontend/src/components/common/Footer.tsx))
- **Giảm hơn 65% chiều cao:** Thay thế padding cũ `pt-16 pb-8` thành `py-6 sm:py-7` giúp Footer thanh thoát, không chiếm viewport.
- **Loại bỏ phần tử rườm rà:** Lược bỏ form đăng ký email nhận tin và các box phương thức thanh toán thừa.
- **Giữ lại thông tin pháp lý & hỗ trợ thiết yếu:** Logo thương hiệu, 3 liên kết chính sách cốt lõi (*Đổi trả, Điều khoản, Bảo mật*), Hotline `1900 6488`, Email `lienhe@bookverse.vn`, Mã số thuế và chứng nhận Sàn TMĐT.

### 5.2. Component Chat thời gian thực ([`src/components/chat/ChatDrawer.tsx`](file:///Users/nguyenvanminhtam/Frontend/src/components/chat/ChatDrawer.tsx))
- Khung chat trượt mượt mà từ cạnh phải màn hình (`animate-in slide-in-from-right`).
- Phân biệt bong bóng tin nhắn của Khách (màu xanh thương hiệu) và Shop (màu trắng nền xám).
- Tự động cuộn xuống tin nhắn mới nhất (`messagesEndRef`).

### 5.3. Dropdown Thông báo ([`src/components/common/NotificationDropdown.tsx`](file:///Users/nguyenvanminhtam/Frontend/src/components/common/NotificationDropdown.tsx))
- Chuông thông báo tích hợp Badge số lượng tin nhắn chưa đọc có hiệu ứng `animate-pulse`.
- Phân loại icon theo loại thông báo: Đơn hàng (`Package`), Hoàn tiền (`RefreshCw`), Tin nhắn (`MessageSquare`).
- Hỗ trợ nút "Đánh dấu đã đọc tất cả" và tự động điều hướng đến trang chi tiết khi click.

---

## 6. CHIẾN LƯỢC QUẢN LÝ NHÁNH & LỊCH SỬ COMMIT (GIT STRATEGY)

Nhánh phát triển mới **`feature/mtamm/refactor-architecture-and-backend-features`** được phân tách thành **7 Commits nguyên tử (Atomic Commits)** theo chuẩn **Conventional Commits**:

| STT | Commit Hash | Commit Type | Tóm tắt phạm vi thay đổi |
| :---: | :---: | :--- | :--- |
| **1** | `a15d92e` | `refactor(arch)` | Làm phẳng thư mục ra root, cấu hình Vite reverse proxy và biến môi trường. |
| **2** | `2c86e03` | `feat(types)` | Mở rộng TypeScript interfaces và mock datasets cho 44 chức năng. |
| **3** | `2e279b5` | `feat(services)` | Xây dựng Service Layer hoàn chỉnh với Axios Interceptors, Chat & Notifications. |
| **4** | `4e01f1c` | `feat(components)`| Thêm `ChatDrawer`, `NotificationDropdown`, cập nhật `Header` và routing `App.tsx`. |
| **5** | `675e312` | `feat(customer)` | Thêm `ProfilePage`, `ShopProfilePage`, bộ lọc trạng thái đơn và hủy đơn `PENDING`. |
| **6** | `28b5dbc` | `feat(dashboard)` | Nâng cấp Dashboard Shop (CRUD sách, reply feedback) & Admin (duyệt shop, khóa user, phân xử khiếu nại). |
| **7** | `a3ec79d` | `refactor(footer)` | Tinh gọn Footer component và tạo tài liệu kiến trúc toàn diện. |

---

## 7. HƯỚNG DẪN KHỞI CHẠY & TÍCH HỢP BACKEND API

### 7.1. Cài đặt và Chạy môi trường phát triển (Local Development)

```bash
# 1. Di chuyển vào thư mục dự án
cd /Users/nguyenvanminhtam/Frontend

# 2. Cài đặt các thư viện phụ thuộc (nếu chưa cài)
npm install

# 3. Khởi chạy máy chủ phát triển Vite Dev Server
npm run dev
```

Ứng dụng sẽ khởi chạy tại: **`http://localhost:5173/`**

---

### 7.2. Kết nối với Backend API (.NET 8 / ASP.NET Web API)

1. Mở file [`.env.development`](file:///Users/nguyenvanminhtam/Frontend/.env.development):
   ```env
   VITE_API_URL=/api
   ```
2. Mở file [`vite.config.js`](file:///Users/nguyenvanminhtam/Frontend/vite.config.js) để kiểm tra cấu hình Reverse Proxy:
   ```javascript
   export default defineConfig({
     plugins: [react()],
     server: {
       port: 5173,
       proxy: {
         '/api': {
           target: 'http://localhost:5000', // Đổi sang cổng Backend của bạn (VD: 5000, 7000)
           changeOrigin: true,
           secure: false,
         }
       }
     }
   });
   ```
3. Khi Backend khởi chạy tại `http://localhost:5000`, mọi request gửi từ Frontend tới `/api/*` sẽ được Vite tự động chuyển tiếp tới Backend mà **không gặp bất kỳ lỗi CORS nào**.

---

### 7.3. Kiểm tra Đóng gói Production (Production Build)

```bash
npm run build
```
- **Kết quả kiểm thử:** `✓ built in ~600ms (0 errors, 0 warnings)`.
- Bundle sẵn sàng để deploy lên Vercel, Netlify, hoặc Nginx server.
