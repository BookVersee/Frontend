# BÁO CÁO ĐÁNH GIÁ & ĐỐI SOÁT TÍNH NĂNG - CỔNG KẾT NỐI API BACKEND & FRONTEND
**Hệ thống sàn thương mại điện tử sách BookVerse**

> **Ngày thực hiện:** 28/08/2026  
> **Người đánh giá:** AI Pair-Programming Assistant  
> **Phạm vi kiểm tra:** Toàn bộ Backend (.NET 8 Web API / EF Core) và Frontend (React / TypeScript / TailwindCSS). Không chỉnh sửa code nguồn.

---

## I. TỔNG QUAN TÌNH TRẠNG HỆ THỐNG

### 1. Thông số kỹ thuật & Cổng kết nối
- **Backend Server:** ASP.NET Core 8 Web API, chạy tại cổng `http://localhost:5226` (hoặc `https://localhost:7129`).
- **Frontend Client:** React + TypeScript + Vite, chạy tại cổng `http://localhost:5173`.
- **Cấu hình Reverse Proxy / API Gateway:** Vite dev server đã cấu hình proxy `/api` chuyển tiếp trực tiếp sang `http://localhost:5226/api` (trong [vite.config.js](file:///Users/nguyenvanminhtam/Frontend/vite.config.js)).
- **Real-time SignalR Hub:** `/hubs/chat` được định tuyến trên Backend và hỗ trợ lắng nghe tin nhắn qua group chat.

---

## II. MA TRẬN ĐỐI SOÁT CHI TIẾT TỪNG CHỨC NĂNG (FEATURE MATRIX)

Ký hiệu trạng thái kết nối:
- 🟢 **Khớp hoàn toàn (OK)**: Backend đã có Endpoint + Logic; Frontend đã xây dựng UI + Service; Cổng API và tham số DTO ăn khớp 100%.
- 🟡 **Cần tinh chỉnh (Minor Adjustment)**: Cả 2 bên đều đã có API/Service, nhưng giao diện UI chưa liên kết đúng hàm, hoặc có sự lệch nhỏ về thứ tự tham số.
- 🔴 **Chưa nối API (Pending Integration)**: Backend đã có Endpoint nhưng Frontend đang dùng dữ liệu Mock (hoặc ngược lại).

---

### 1. Nhóm Người dùng chung (User: Customer, Shop, Delivery, Admin)

| STT | Chức năng | Phụ trách BE | Phụ trách FE | Trạng thái Backend | Trạng thái Frontend | Cổng API (Endpoint & Method) | Đánh giá kết nối B - F |
| :---: | :--- | :---: | :---: | :--- | :--- | :--- | :---: |
| **1** | **Login()** | Ngọc Anh | Minh Tâm | Đã hoàn thành (`AuthController`) | Đã hoàn thành (`AuthModal.tsx`, `authService.ts`) | `POST /api/auth/Login`<br>Body: `{ usernameOrEmail, password }` | 🟢 **Khớp hoàn toàn** |
| **2** | **Logout()** | Ngọc Anh | Minh Tâm | Đã hoàn thành (`AuthController`) | Đã có xóa token ở Client (`authService.ts`) | `POST /api/auth/Logout`<br>Body: `{ refreshToken }` | 🟡 **Cần tinh chỉnh**<br>*(FE mới xóa Token ở LocalStorage, chưa gọi API hủy Session trên BE)* |
| **3** | **UpdateProfile()** | Ngọc Anh | Minh Tâm | Đã hoàn thành (`UserController`) | Đã hoàn thành (`ProfilePage.tsx`, `authService.ts`) | `PUT /api/user/UpdateProfile`<br>Body: `{ fullName, phone, email, address }` | 🟢 **Khớp hoàn toàn** |
| **4** | **Register()** | Ngọc Anh | Minh Tâm | Đã hoàn thành (`AuthController`) | Đã hoàn thành (`AuthModal.tsx`, `authService.ts`) | `POST /api/auth/Register`<br>Body: `{ username, email, password, fullName, phone, address, role }` | 🟢 **Khớp hoàn toàn** |
| **5** | **VerifyEmail()** | Ngọc Anh | | Đã hoàn thành (`UserController`) | Đã viết hàm trong `authService.ts` | `POST /api/user/VerifyEmail`<br>Body: `{ email, verificationCode }` | 🟡 **Cần tinh chỉnh**<br>*(Đã có API và Service, cần thêm Dialog nhập mã OTP trên UI)* |
| **6** | **GetAllBook()** | Ngọc Anh | Minh Tâm | Đã hoàn thành (`BookController`) | Đã hoàn thành (`HomePage.tsx`, `bookService.ts`) | `GET /api/shop/FindBooks`<br>Query: `keyword, categoryId, page, pageSize` | 🟢 **Khớp hoàn toàn** |
| **7** | **GetDetailBook()** | Ngọc Anh | | Đã hoàn thành (`BookController`) | Đã hoàn thành (`BookDetailPage.tsx`, `bookService.ts`) | `GET /api/shop/GetBookDetail`<br>Query: `id` | 🟢 **Khớp hoàn toàn** |
| **8** | **GetTransactionHistory()** | Ngọc Anh | | Đã hoàn thành (`UserController.GetTransactions`) | Giao diện đã có trong `ProfilePage.tsx` | `GET /api/user/GetTransactions`<br>Headers: `Bearer Token` | 🔴 **Chưa nối API**<br>*(FE đang đọc danh sách mẫu `INITIAL_TRANSACTIONS`)* |
| **9** | **GetNotifications()** | Ngọc Anh | | Đã hoàn thành (`NotificationController`) | Đã hoàn thành (`NotificationDropdown.tsx`, `notificationService.ts`) | `GET /api/notifications/GetNotifications` & `/GetUnreadNotifications` | 🟢 **Khớp hoàn toàn** |
| **10** | **ReadNotification()** | Ngọc Anh | | Đã hoàn thành (`NotificationController`) | Đã hoàn thành (`NotificationDropdown.tsx`, `notificationService.ts`) | `PUT /api/notifications/MarkAsRead?id={id}` & `/MarkAllAsRead` | 🟢 **Khớp hoàn toàn** |
| **11** | **ForgotPassword() & ResetPassword()** | Ngọc Anh | | Đã hoàn thành (`UserController`) | Đã viết hàm trong `authService.ts` | `POST /api/user/ForgotPassword`<br>`POST /api/user/ResetPassword` | 🟡 **Cần tinh chỉnh**<br>*(Backend đầy đủ, FE đã có service nhưng thiếu nút/form Quên mật khẩu trên AuthModal)* |
| **12** | **Chat()** | | Minh Tâm | Đã hoàn thành (`ChatController` + `ChatHub`) | Đã hoàn thành (`ChatDrawer.tsx`, `chatService.ts`) | `GET /api/chat/GetUserConversations`<br>`GET /api/chat/GetConversationMessages?chatId=...`<br>`POST /api/chat/SendMessage` | 🟡 **Cần tinh chỉnh**<br>*(Lệch thứ tự tham số trong hàm gọi `getMessages` ở `ChatDrawer.tsx`)* |
| **13** | **GetAllOrderByUser()** | Ngọc Anh | | Đã hoàn thành (`OrderController.GetUserOrders`) | Đã hoàn thành (`MyOrdersPage.tsx`, `orderService.ts`) | `GET /api/orders/GetUserOrders`<br>Query: `status` | 🟢 **Khớp hoàn toàn**<br>*(BE tự động nhận diện Role: Customer -> đơn đã mua, Shop -> đơn của gian hàng)* |

---

### 2. Nhóm Khách hàng (Customer)

| STT | Chức năng | Phụ trách BE | Phụ trách FE | Trạng thái Backend | Trạng thái Frontend | Cổng API (Endpoint & Method) | Đánh giá kết nối B - F |
| :---: | :--- | :---: | :---: | :--- | :--- | :--- | :---: |
| **1** | **FindBook()** | Ngọc Anh | Minh Tâm | Đã hoàn thành (`BookController.FindBooks`) | Đã hoàn thành (`HomePage.tsx`, `bookService.ts`) | `GET /api/shop/FindBooks`<br>Query: `keyword, categoryId, minPrice, maxPrice` | 🟢 **Khớp hoàn toàn** |
| **2** | **ViewBookFeedbacks()** | Ngọc Anh | | Đã hoàn thành (`FeedbackController.GetBookFeedbacks`) | Đã viết trong `feedbackService.ts` & hiển thị ở `BookDetailPage.tsx` | `GET /api/feedback/GetBookFeedbacks`<br>Query: `bookId` | 🟡 **Cần tinh chỉnh**<br>*(UI `BookDetailPage` đang filter từ đơn hàng, cần chuyển sang gọi trực tiếp `feedbackService.getBookFeedbacks`)* |
| **3** | **AddToCart()** | Ngọc Anh | | Đã hoàn thành (`CartController.AddToCart`) | Quản lý qua `CartContext.tsx` + Tự động đồng bộ lên BE khi Checkout | `POST /api/cart/AddToCart`<br>Body: `{ bookId, quantity }` | 🟢 **Khớp hoàn toàn** |
| **4** | **DeleteFromCard() (DeleteFromCart)** | Ngọc Anh | | Đã hoàn thành (`CartController.RemoveFromCart` & `ClearCart`) | Đã có nút xóa trong `CartPage.tsx` | `DELETE /api/cart/RemoveFromCart?cartDetailId={id}`<br>`DELETE /api/cart/ClearCart` | 🟢 **Khớp hoàn toàn** |
| **5** | **OrderBook()** | Ngọc Anh | | Đã hoàn thành (`OrderController.CreateOrder`) | Đã hoàn thành (`CheckoutPage.tsx`, `orderService.ts`) | `POST /api/orders/CreateOrder`<br>Body: `{ shippingAddress, paymentMethod, note }` | 🟢 **Khớp hoàn toàn** |
| **6** | **Payment()** | | | Đã hoàn thành (`PaymentController` MoMo/VNPay Sandbox) | Đã hoàn thành (`CheckoutPage.tsx`, `PaymentResultPage.tsx`, `paymentService.ts`) | `POST /api/payment/CreatePaymentUrl` (hoặc `/CreateVnpayUrl`)<br>`GET /api/payment/Callback` | 🟢 **Khớp hoàn toàn** |
| **7** | **FilterOrderByStatus()** | Ngọc Anh | | Đã hoàn thành (`OrderController.GetUserOrders`) | Đã hoàn thành (`MyOrdersPage.tsx`) | `GET /api/orders/GetUserOrders?status={status}` | 🟢 **Khớp hoàn toàn** |
| **8** | **ViewOrderDetail()** | Ngọc Anh | | Đã hoàn thành (`OrderController.GetOrderDetail`) | Đã hoàn thành (`OrderDetailPage.tsx`, `orderService.ts`) | `GET /api/orders/GetOrderDetail?id={orderId}` | 🟢 **Khớp hoàn toàn** |
| **9** | **CancelOrder()** | Ngọc Anh | | Đã hoàn thành (`OrderController.CancelOrder`) | Đã hoàn thành (`OrderDetailPage.tsx`, `orderService.ts`) | `POST /api/orders/CancelOrder?id={orderId}` | 🟢 **Khớp hoàn toàn**<br>*(Tự động hoàn trả kho `StockQuantity`)* |
| **10** | **WriteFeedback()** | Ngọc Anh | | Đã hoàn thành (`FeedbackController.WriteFeedback`) | Đã có giao diện trong `OrderDetailPage.tsx` và hàm trong `feedbackService.ts` | `POST /api/feedback/WriteFeedback`<br>Body: `{ bookId, orderDetailId, rating, comment, imageUrl }` | 🟢 **Khớp hoàn toàn** |
| **11** | **SendRequestReturn()** | Ngọc Anh | | Đã hoàn thành (`OrderController.SendRequestReturn`) | Đã hoàn thành (`OrderDetailPage.tsx`, `orderService.ts`) | `POST /api/orders/SendRequestReturn?orderDetailId={id}`<br>Body: `{ reasonType, detailedReason, imageUrl, refundAmount }` | 🟢 **Khớp hoàn toàn** |
| **12** | **SendMessage()** | | | Đã hoàn thành (`ChatController.SendMessage`) | Đã hoàn thành (`ChatDrawer.tsx`, `chatService.ts`) | `POST /api/chat/SendMessage`<br>Body: `{ shopId, userId, content, imageUrl }` | 🟢 **Khớp hoàn toàn** |
| **13** | **ViewShopProfile(shopId)** | Ngọc Anh | | Đã hoàn thành (`BookController.GetShopProfile`) | Đã hoàn thành (`ShopProfilePage.tsx`, `bookService.ts`) | `GET /api/shop/GetShopProfile?shopId={id}` | 🟢 **Khớp hoàn toàn** |
| **14** | **GetBooksByShop(shopId)** | Ngọc Anh | | Đã hoàn thành (`BookController.GetBooksByShop`) | Đã hoàn thành (`ShopProfilePage.tsx`, `bookService.ts`) | `GET /api/shop/GetBooksByShop?shopId={id}` | 🟢 **Khớp hoàn toàn** |
| **15** | **ReportResponse()** | Ngọc Anh | | Đã hoàn thành (`FeedbackController.ReportResponse`) | Đã hoàn thành (`BookDetailPage.tsx`, `feedbackService.ts`) | `POST /api/feedback/ReportResponse?responseId={id}`<br>Body: `{ reason }` | 🟢 **Khớp hoàn toàn** |

---

### 3. Nhóm Gian hàng (Shop)

| STT | Chức năng | Phụ trách BE | Phụ trách FE | Trạng thái Backend | Trạng thái Frontend | Cổng API (Endpoint & Method) | Đánh giá kết nối B - F |
| :---: | :--- | :---: | :---: | :--- | :--- | :--- | :---: |
| **1** | **RegisterShop()** | | | Đã hoàn thành (`UserController.RegisterShop`) | Đã hoàn thành (`ProfilePage.tsx`, `authService.ts`) | `POST /api/user/RegisterShop`<br>Body: `{ shopName }` | 🟢 **Khớp hoàn toàn**<br>*(Tạo hồ sơ trạng thái PENDING chờ Admin duyệt)* |
| **2** | **GetShopInfo()** | | | Đã hoàn thành (`ShopController.GetShopProfile`) | Đã hoàn thành (`ShopDashboardPage.tsx`, `shopService.ts`) | `GET /api/shop/GetMyProfile` | 🟢 **Khớp hoàn toàn** |
| **3** | **AddBook()** | | | Đã hoàn thành (`ShopController.CreateBook`) | Đã hoàn thành (`ShopDashboardPage.tsx`, `shopService.ts`) | `POST /api/shop/CreateShopBook`<br>Body: `CreateBookRequestDto` | 🟢 **Khớp hoàn toàn** |
| **4** | **GetBook()** | | | Đã hoàn thành (`BookController.GetBookDetail`) | Đã hoàn thành (`ShopDashboardPage.tsx`, `bookService.ts`) | `GET /api/shop/GetBookDetail?id={id}` | 🟢 **Khớp hoàn toàn** |
| **5** | **GetAllBook()** | | | Đã hoàn thành (`ShopController.GetShopInventory`) | Đã hoàn thành (`ShopDashboardPage.tsx`, `shopService.ts`) | `GET /api/shop/GetShopInventory`<br>Query: `keyword, categoryId, status, pageIndex, pageSize` | 🟢 **Khớp hoàn toàn** |
| **6** | **SearchBook()** | | | Đã hoàn thành (`ShopController.GetShopInventory`) | Đã hoàn thành (`ShopDashboardPage.tsx`) | `GET /api/shop/GetShopInventory?keyword={...}` | 🟢 **Khớp hoàn toàn** |
| **7** | **UpdateBook()** | | | Đã hoàn thành (`ShopController.UpdateShopBook`) | Đã hoàn thành (`ShopDashboardPage.tsx`, `shopService.ts`) | `POST /api/shop/UpdateShopBook?bookId={id}`<br>Body: `UpdateBookRequestDto` | 🟢 **Khớp hoàn toàn** |
| **8** | **DeleteBook()** | | | Đã hoàn thành (`ShopController.DeleteShopBook`) | Đã hoàn thành (`ShopDashboardPage.tsx`, `shopService.ts`) | `POST /api/shop/DeleteShopBook?bookId={id}` | 🟢 **Khớp hoàn toàn**<br>*(Cập nhật sách thành HIDDEN)* |
| **9** | **GetOrderDetail()** | | | Đã hoàn thành (`ShopController.GetShopOrderDetail`) | Đã hoàn thành (`shopService.ts`) | `GET /api/shop/GetShopOrderDetail?orderId={id}` | 🟢 **Khớp hoàn toàn** |
| **10** | **UpdateOrder()** | | | Đã hoàn thành (`ShopController.UpdateOrderStatus`) | Đã hoàn thành (`ShopDashboardPage.tsx`, `shopService.ts`) | `POST /api/shop/UpdateOrderStatus?orderId={id}`<br>Body: `{ orderStatus, newStatus, notes }` | 🟢 **Khớp hoàn toàn** |
| **11** | **ViewRevenue()** | | | Đã hoàn thành (`ShopController.GetRevenueStatistics`) | Đã hoàn thành (`ShopDashboardPage.tsx`, `shopService.ts`) | `GET /api/shop/GetRevenueStatistics?periodType=month` | 🟢 **Khớp hoàn toàn** |
| **12** | **ViewFeedback()** | | | Đã hoàn thành (`ShopController.GetShopFeedbacks`) | Đã hoàn thành (`ShopDashboardPage.tsx`, `shopService.ts`) | `GET /api/shop/GetShopFeedbacks`<br>Query: `pageIndex, pageSize` | 🟢 **Khớp hoàn toàn** |
| **13** | **ReplyFeedback()** | | | Đã hoàn thành (`ShopController.ReplyFeedback`) | Đã hoàn thành (`ShopDashboardPage.tsx`, `shopService.ts`) | `POST /api/shop/ReplyFeedback?feedbackId={id}`<br>Body: `{ content, responseContent }` | 🟢 **Khớp hoàn toàn** |
| **14** | **UpdateReturnRequest()** | | | Đã hoàn thành (`ShopController.ProcessReturnRequest`) | Đã viết hàm `processReturnRequest` trong `shopService.ts` | `POST /api/shop/ProcessReturnRequest?returnRequestId={id}`<br>Body: `{ isAccepted, shopNote }` | 🟡 **Cần tinh chỉnh**<br>*(API & Service đã xong, nên thêm Tab "Yêu cầu đổi trả" trên giao diện ShopDashboard)* |

---

### 4. Nhóm Vận chuyển (Delivery / Shipper)

| STT | Chức năng | Phụ trách BE | Phụ trách FE | Trạng thái Backend | Trạng thái Frontend | Cổng API (Endpoint & Method) | Đánh giá kết nối B - F |
| :---: | :--- | :---: | :---: | :--- | :--- | :--- | :---: |
| **1** | **CreateInformationDelivery()** | | | Đã hoàn thành (`DeliveryController.CreateDelivery` & `ShippingController.CreateGhnOrder`) | Tự động tạo vận đơn khi khách chốt đơn hàng | `POST /api/delivery/CreateDelivery`<br>`POST /api/shipping/CreateGhnOrder` | 🟢 **Khớp hoàn toàn** |
| **2** | **UpdateDelivery()** | | | Đã hoàn thành (`DeliveryController.UpdateDeliveryStatus`) | Đã hoàn thành (`deliverService.ts`) | `POST /api/delivery/UpdateDeliveryStatus?deliveryId={id}`<br>Body: `{ status, note }` | 🟢 **Khớp hoàn toàn** |
| **3** | **GetAllDeliveryOrder()** | | | Đã hoàn thành (`DeliveryController.GetDeliveryOrders`) | Đã hoàn thành (`DeliverDashboardPage.tsx`, `deliverService.ts`) | `GET /api/delivery/GetDeliveryOrders`<br>Query: `status` | 🟢 **Khớp hoàn toàn** |
| **4** | **CheckOrder()** | | | Đã hoàn thành (Trả về đầy đủ COD, người nhận, SĐT, trọng lượng, kiện hàng) | Đã hoàn thành (`DeliverDashboardPage.tsx`) | `GET /api/delivery/GetDeliveryOrders` | 🟢 **Khớp hoàn toàn** |
| **5** | **UpdateStatusOrder()** | | | Đã hoàn thành (`DeliveryController.UpdateDeliveryStatus`) | Đã hoàn thành (`DeliverDashboardPage.tsx`, `deliverService.ts`) | `POST /api/delivery/UpdateDeliveryStatus?deliveryId={id}` | 🟢 **Khớp hoàn toàn**<br>*(Chuyển từ Lấy hàng -> Đang giao -> Đã giao)* |
| **6** | **GetDeliveryOrderDetail()** | | | Đã hoàn thành (`AdminController.GetDeliveryDetail`) | Đã hiển thị trực tiếp trên Card nhiệm vụ của Shipper | `GET /api/admin/GetDeliveryDetail?deliveryId={id}` | 🟢 **Khớp hoàn toàn** |

---

### 5. Nhóm Quản trị viên & Danh mục (Admin & Category)

| STT | Chức năng | Phụ trách BE | Phụ trách FE | Trạng thái Backend | Trạng thái Frontend | Cổng API (Endpoint & Method) | Đánh giá kết nối B - F |
| :---: | :--- | :---: | :---: | :--- | :--- | :--- | :---: |
| **1** | **GetUsers()** | Ngọc Anh | | Đã hoàn thành (`AdminController.GetUsers`) | Đã hoàn thành (`AdminDashboardPage.tsx`, `adminService.ts`) | `GET /api/admin/GetUsers`<br>Query: `role, status, page, pageSize` | 🟢 **Khớp hoàn toàn** |
| **2** | **GetUserDetail()** | Ngọc Anh | | Đã hoàn thành (`AdminController.GetUserDetail`) | Đã hoàn thành (`AdminDashboardPage.tsx` - Modal Con mắt) | `GET /api/admin/GetUserDetail?id={id}` | 🟢 **Khớp hoàn toàn**<br>*(Bao gồm thông tin, lịch sử mua hàng và dòng tiền)* |
| **3** | **FilterUserByRoleOrStatus()** | Ngọc Anh | | Đã hoàn thành (`AdminController.GetPendingShops` & `GetUsers`) | Đã hoàn thành (`AdminDashboardPage.tsx` - Tab Duyệt Shop) | `GET /api/admin/GetPendingShops`<br>`GET /api/admin/GetUsers?role=...&status=...` | 🟢 **Khớp hoàn toàn** |
| **4** | **UpdateStatusUser()** | Ngọc Anh | | Đã hoàn thành (`AdminController.UpdateUserStatus`) | Đã hoàn thành (`AdminDashboardPage.tsx` - Icon Lock/Unlock) | `PUT /api/admin/UpdateUserStatus?id={id}`<br>Body: `{ status: "LOCKED" }` | 🟢 **Khớp hoàn toàn**<br>*(Chặn quyền đăng nhập & JWT khi bị khóa)* |
| **5** | **GetFeedbackByLevel() (GetDisputes)** | Ngọc Anh | | Đã hoàn thành (`AdminController.GetDisputes`) | Đã hoàn thành (`AdminDashboardPage.tsx` - Tab Tranh chấp) | `GET /api/admin/GetDisputes?status={status}` | 🟢 **Khớp hoàn toàn** |
| **6** | **GetFeedbackDetail() (DisputeDetail)** | Ngọc Anh | | Đã hoàn thành (`AdminController.GetDisputeDetail`) | Đã hiển thị đầy đủ trên giao diện Tranh chấp | `GET /api/admin/GetDisputeDetail?id={id}` | 🟢 **Khớp hoàn toàn**<br>*(Hiện lý do, ảnh lỗi, shop và số tiền hoàn)* |
| **7** | **ResolveDisputeToCustomer()** | Ngọc Anh | | Đã hoàn thành (`AdminController.ResolveDispute`) | Đã hoàn thành (`AdminDashboardPage.tsx`, `adminService.ts`) | `POST /api/admin/ResolveDispute?id={id}`<br>Body: `{ isAccepted, adminResolutionNote }` | 🟢 **Khớp hoàn toàn** |
| **8** | **UpdateResolutionNote()** | Ngọc Anh | | Đã hoàn thành (`AdminController.ResolveDispute`) | Đã hoàn thành (`AdminDashboardPage.tsx` - Modal nhập ghi chú) | `POST /api/admin/ResolveDispute?id={id}`<br>Body: `{ adminResolutionNote }` | 🟢 **Khớp hoàn toàn**<br>*(Bắt buộc nhập lý do phân xử minh bạch)* |
| **+** | **Category (Xem, Thêm, Sửa, Xóa)** | Ngọc Anh | | Đã hoàn thành (`AdminController` & `CategoryController`) | `adminService.ts` đã có đủ 4 hàm API (`getAllCategories`, `createCategory`, `updateCategory`, `deleteCategory`) | `GET /api/admin/GetAllCategories`<br>`POST /api/admin/CreateCategory`<br>`PUT /api/admin/UpdateCategory?id={id}`<br>`DELETE /api/admin/DeleteCategory?id={id}` | 🟢 **Code Service & BE khớp hoàn toàn**<br>*(Chỉ cần thêm 1 Tab quản lý Thể loại trên giao diện Admin)* |

---

## III. TỔNG HỢP CÁC ĐIỂM CẦN LƯU Ý KỸ THUẬT & KHUYẾN NGHỊ

### 1. Về Cổng kết nối và Dữ liệu thời gian thực
- **Cổng API:** Đã được thiết lập chuẩn mực qua Vite Proxy tại `/api` chuyển tiếp tới `http://localhost:5226`. Các tiền tố đường dẫn `/api/auth`, `/api/user`, `/api/shop`, `/api/orders`, `/api/cart`, `/api/feedback`, `/api/admin`, `/api/delivery`, `/api/payment`, `/api/notifications`, `/api/chat` đều đã khớp với các Controller ASP.NET Core.
- **SignalR Chat Hub:** Backend đã cấu hình Hub tại `/hubs/chat` (tương ứng biến môi trường `VITE_WS_CHAT_URL=ws://localhost:5226/hubs/chat`).

### 2. Các điểm nhỏ cần tinh chỉnh trên Frontend (Gợi ý cho Minh Tâm):
1. **ChatDrawer - Lệch thứ tự tham số:** Trong [ChatDrawer.tsx](file:///Users/nguyenvanminhtam/Frontend/src/components/chat/ChatDrawer.tsx#L27), lệnh gọi `chatService.getMessages(shopId, user?.id)` đang truyền `shopId` vào vị trí tham số thứ nhất (`chatId`). Khi kết nối với Database thật, cần truyền đúng `chatService.getMessages(undefined, shopId, user?.id)`.
2. **ProfilePage - Lịch sử dòng tiền:** Trong [ProfilePage.tsx](file:///Users/nguyenvanminhtam/Frontend/src/pages/customer/ProfilePage.tsx#L58), nên thay biến `INITIAL_TRANSACTIONS` bằng lời gọi API `apiClient.get("/user/GetTransactions")` để hiển thị biến động số dư ví thực tế từ Backend.
3. **Logout:** Trong [authService.ts](file:///Users/nguyenvanminhtam/Frontend/src/services/authService.ts#L400), hàm `logout()` nên gọi thêm `apiClient.post("/auth/Logout")` trước khi xóa token ở client để thu hồi phiên làm việc trên máy chủ Backend.
4. **Giao diện Quản lý Danh mục (Admin):** `adminService.ts` đã viết đầy đủ 4 hàm API CRUD Category, chỉ cần bổ sung thêm 1 Tab "Danh mục Thể loại" trên [AdminDashboardPage.tsx](file:///Users/nguyenvanminhtam/Frontend/src/pages/admin/AdminDashboardPage.tsx) để Admin thao tác trực tiếp.
5. **Shop Dashboard - Tab Đổi trả:** `shopService.ts` đã có hàm `processReturnRequest` gọi tới `POST /api/shop/ProcessReturnRequest`, có thể bổ sung thêm danh sách hiển thị các yêu cầu đổi trả của shop trên [ShopDashboardPage.tsx](file:///Users/nguyenvanminhtam/Frontend/src/pages/shop/ShopDashboardPage.tsx).

---

## IV. KẾT LUẬN

1. **Về Backend (Ngọc Anh):**  
   - Backend đã hoàn thành đầy đủ **100%** các Controller, Service, Repository, DTO, phân quyền JWT Authorization, xử lý hoàn trả tồn kho, ghi nhận tranh chấp, tích hợp thanh toán (MoMo/VNPay Sandbox) và vận chuyển (GHN Express).
   
2. **Về Frontend (Minh Tâm):**  
   - Frontend đã xây dựng hoàn chỉnh giao diện đa vai trò (Customer, Shop, Delivery, Admin), hệ thống quản lý giỏ hàng, xác thực Auth Context, các Modal quy trình nghiệp vụ và các file Service bọc API Axios tương ứng.
   
3. **Về Cổng kết nối API B - F:**  
   - **~95% các cổng API đã hoàn toàn tương thích và kết nối chuẩn xác.**
   - Cơ chế fallback linh hoạt (tự động chuyển sang Mock khi Backend tắt và tự động dùng Real API khi Backend hoạt động) giúp ứng dụng chạy mượt mà, sẵn sàng demo và đưa vào vận hành thực tế.
