# CẨM NANG TOÀN DIỆN: TẠI SAO DÙNG TYPESCRIPT, LÝ THUYẾT & THỰC HÀNH USESTATE, USEEFFECT VÀ TÍCH HỢP BACKEND API

> **Dành cho lập trình viên xây dựng dự án BookVerse**  
> **Tài liệu đào tạo kỹ thuật nội bộ (Hands-on Training Guide)**

---

## 📑 MỤC LỤC BÀI HỌC

1. [Phần 1: Tại sao BookVerse lại viết bằng TypeScript thay vì JavaScript thuần?](#phần-1-tại-sao-bookverse-lại-viết-bằng-typescript-thay-vì-javascript-thuần)
2. [Phần 2: Làm chủ `useState` - Quản lý trạng thái giao diện](#phần-2-làm-chủ-usestate---quản-lý-trạng-thái-giao-diện)
3. [Phần 3: Làm chủ `useEffect` - Vòng đời Component & Tác vụ bất đồng bộ](#phần-3-làm-chủ-useeffect---vòng-đời-component--tác-vụ-bất-đồng-bộ)
4. [Phần 4: Hướng dẫn kết nối Frontend với Backend API qua Axios](#phần-4-hướng-dẫn-kết-nối-frontend-với-backend-api-qua-axios)
5. [Phần 5: Bài tập thực hành thực tế trong BookVerse](#phần-5-bài-tập-thực-hành-thực-tế-trong-bookverse)

---

## PHẦN 1: TẠI SAO BOOKVERSE LẠI VIẾT BẰNG TYPESCRIPT THAY VÌ JAVASCRIPT THUẦN?

JavaScript là ngôn ngữ kiểu động (**Dynamically Typed**), nghĩa là biến có thể nhận bất kỳ kiểu dữ liệu nào tại thời điểm chạy (runtime). TypeScript là một **Superset của JavaScript**, bổ sung hệ thống kiểu tĩnh (**Static Typing**) được kiểm tra ngay tại thời điểm biên dịch (compile-time).

```
   ┌──────────────────────────────────────────────────────────┐
   │                       TYPESCRIPT                         │
   │  ┌────────────────────────────────────────────────────┐  │
   │  │                    JAVASCRIPT                      │  │
   │  │   - Cú pháp chuẩn ES6+                             │  │
   │  │   - Chạy trực tiếp trên trình duyệt                │  │
   │  └────────────────────────────────────────────────────┘  │
   │   + Static Type Checking (Interface, Type, Enum)         │
   │   + Compile-time Error Detection (Bắt lỗi khi gõ code)   │
   │   + Auto-complete & Refactoring Support                  │
   └──────────────────────────────────────────────────────────┘
```

---

### 1.1. So sánh chi tiết qua 6 tiêu chí cốt lõi

| Tiêu chí | JavaScript (JS) | TypeScript (TS) trong BookVerse |
| :--- | :--- | :--- |
| **1. Bắt lỗi (Error Catching)** | Chỉ phát hiện khi chạy app hoặc khi người dùng thao tác gây sập trang (*Runtime Error*). | Bắt lỗi **ngay khi đang gõ code** trong IDE (*Compile-time Error*). |
| **2. Độ an toàn kiểu dữ liệu (Type Safety)** | Biến có thể bị gán nhầm từ `number` thành `string` hoặc `undefined`, gây ra lỗi kinh điển `TypeError: Cannot read properties of undefined`. | Bắt buộc biến phải tuân thủ khuôn mẫu định sẵn qua `interface` hoặc `type`. |
| **3. Đồng bộ Hợp đồng dữ liệu với Backend (API Contract)** | Dễ bị lệch tên trường (`camelCase` vs `snake_case`, `price` kiểu số hay chuỗi). | Khai báo `interface Book`, `interface Order` ánh xạ 1-1 với DTO của Backend C# .NET / Java. |
| **4. Trải nghiệm Lập trình viên (DX & Autocomplete)** | IDE chỉ gợi ý cơ bản, phải mở file khác hoặc API Docs để nhớ tên trường `customerPhone`, `orderStatus`. | Gõ dấu chấm `order.` sẽ lập tức xổ ra toàn bộ 15+ thuộc tính kèm chú thích kiểu dữ liệu. |
| **5. Tự tin Refactor mã nguồn** | Sửa tên trường ở một file dễ làm hỏng 5 file khác mà không hề hay biết. | Khi sửa `orderStatus` thành `status`, TypeScript sẽ báo đỏ toàn bộ những nơi cần cập nhật. |
| **6. Khả năng mở rộng dự án lớn (Enterprise Scale)** | Khó bảo trì khi dự án vượt quá 20 màn hình và nhiều dev cùng làm. | Chuẩn mực của các công ty công nghệ lớn (Google, Microsoft, Meta, Shopee, Tiki). |

---

### 1.2. Ví dụ thực tế chứng minh sức mạnh của TypeScript trong BookVerse

#### ❌ Tình huống với JavaScript thuần:
```javascript
// JavaScript: Không hề báo lỗi khi gõ code
function calculateTotal(order) {
  // Lỗi chính tả 'shippngFee' (thiếu chữ 'i') -> undefined!
  // Kết quả: NaN (Not a Number) hiển thị trên màn hình khách hàng!
  return order.totalAmount + order.shippngFee; 
}
```

#### ✅ Tình huống tương tự được bảo vệ bởi TypeScript:
```typescript
// TypeScript trong src/types/index.ts:
export interface Order {
  id: number;
  totalAmount: number;
  shippingFee: number;
  orderStatus: "PENDING" | "PROCESSING" | "SHIPPED" | "DELIVERED" | "CANCELLED" | "RETURNED";
}

function calculateTotal(order: Order): number {
  // ❌ IDE gạch đỏ ngay lập tức: Property 'shippngFee' does not exist on type 'Order'. Did you mean 'shippingFee'?
  return order.totalAmount + order.shippingFee; // ✅ Hoàn toàn chính xác
}
```

---

## PHẦN 2: LÀM CHỦ `useState` - QUẢN LÝ TRẠNG THÁI GIAO DIỆN

### 2.1. `useState` là gì?
Trong React, một biến JavaScript thông thường khi thay đổi giá trị sẽ **không làm giao diện tự vẽ lại (Re-render)**.
`useState` là một **React Hook** cho phép khai báo một biến trạng thái (*State*). Khi giá trị của State thay đổi qua hàm cập nhật (`setState`), React sẽ tự động kích hoạt Re-render lại component để hiển thị dữ liệu mới nhất lên màn hình.

---

### 2.2. Cú pháp cơ bản
```typescript
const [state, setState] = useState<InitialType>(initialValue);
```
- `state`: Biến chứa giá trị hiện tại.
- `setState`: Hàm dùng để cập nhật giá trị mới cho `state`.
- `initialValue`: Giá trị khởi tạo ban đầu.

---

### 2.3. Các trường hợp ứng dụng `useState` trong BookVerse

#### Ví dụ 1: State kiểu nguyên thủy (Primitive State - String, Number, Boolean)
*Trích từ thanh tìm kiếm trong [`HomePage.tsx`](file:///Users/nguyenvanminhtam/Frontend/src/pages/customer/HomePage.tsx):*

```typescript
// 1. Quản lý từ khóa tìm kiếm
const [search, setSearch] = useState<string>("");

// 2. Quản lý danh mục đang chọn (0 = Tất cả)
const [selectedCatId, setSelectedCatId] = useState<number>(0);

// 3. Quản lý trạng thái đang tải dữ liệu
const [loading, setLoading] = useState<boolean>(true);

// Khi người dùng gõ vào ô input:
<input
  value={search}
  onChange={(e) => setSearch(e.target.value)} // Gây re-render và lọc danh sách sách tức thì!
  placeholder="Tìm tên sách, tác giả..."
/>
```

---

#### Ví dụ 2: State dạng Mảng / Danh sách (Array State)
*Trích từ quản lý danh sách sách:*

```typescript
import { Book } from "../types";

// Khởi tạo state là một mảng rỗng chứa các đối tượng Book
const [books, setBooks] = useState<Book[]>([]);

// Thêm một cuốn sách mới vào đầu danh sách:
const handleAddBook = (newBook: Book) => {
  // ⚠️ QUY TẮC BẤT BIẾN (Immutability): Không dùng books.push(newBook)!
  // Luôn tạo một mảng mới bằng cú pháp Spread Operator [...]:
  setBooks((prevBooks) => [newBook, ...prevBooks]);
};

// Xóa một cuốn sách khỏi danh sách:
const handleDeleteBook = (bookId: number) => {
  setBooks((prevBooks) => prevBooks.filter((b) => b.id !== bookId));
};
```

---

#### Ví dụ 3: State dạng Đối tượng (Object State)
*Trích từ form cập nhật hồ sơ trong [`ProfilePage.tsx`](file:///Users/nguyenvanminhtam/Frontend/src/pages/customer/ProfilePage.tsx):*

```typescript
interface UserForm {
  name: string;
  phone: string;
  address: string;
}

const [form, setForm] = useState<UserForm>({
  name: "Minh Tâm",
  phone: "0901234567",
  address: "TP. Hồ Chí Minh",
});

// Cập nhật 1 trường cụ thể mà không làm mất các trường còn lại:
const handleChangePhone = (newPhone: string) => {
  setForm((prev) => ({
    ...prev,          // Giữ nguyên name và address
    phone: newPhone,  // Ghi đè trường phone
  }));
};
```

---

## PHẦN 3: LÀM CHỦ `useEffect` - VÒNG ĐỜI & TÁC VỤ BẤT ĐỒNG BỘ

### 3.1. `useEffect` là gì?
`useEffect` dùng để thực thi các **Side Effects** (tác vụ phụ bên ngoài quá trình render giao diện thuần túy), bao gồm:
1. **Gọi API lấy dữ liệu từ Backend** khi component vừa xuất hiện lên màn hình.
2. Lắng nghe sự kiện (Event Listener), thiết lập Timer (`setInterval`/`setTimeout`).
3. Đăng ký kết nối WebSocket / Chat Real-time.
4. Đọc/Ghi dữ liệu LocalStorage.

---

### 3.2. Cấu trúc và 3 biến thể của Dependency Array

```typescript
useEffect(() => {
  // Logic thực thi tác vụ phụ ở đây

  return () => {
    // [Tùy chọn] Cleanup Function: Dọn dẹp bộ nhớ khi Component bị hủy (Unmount)
  };
}, [/* Dependency Array */]);
```

| Cú pháp Dependency Array | Thời điểm chạy | Ứng dụng thực tế |
| :--- | :--- | :--- |
| **`useEffect(fn, [])`**<br>(Mảng rỗng) | **Chỉ chạy đúng 1 lần duy nhất** khi component vừa được gắn vào màn hình (*Component Mount*). | **Fetch dữ liệu khởi tạo** từ Backend khi mở trang (Load danh sách sách, load profile). |
| **`useEffect(fn, [id, search])`**<br>(Có chứa biến) | Chạy lần đầu khi mount, và **chạy lại mỗi khi giá trị của `id` hoặc `search` thay đổi**. | **Tìm kiếm tự động**, tải chi tiết khi đổi ID sách, lọc đơn hàng khi đổi Tab. |
| **`useEffect(fn)`**<br>(Không truyền mảng) | Chạy sau **mỗi lần component render**. | *Rất hiếm khi dùng*, dễ gây ra vòng lặp vô tận (*Infinite Loop*) nếu bên trong có gọi `setState`. |

---

### 3.3. Ví dụ thực tế trong BookVerse

#### Ví dụ 1: Tải dữ liệu trang chủ (Chạy 1 lần khi mở trang)
*Từ [`HomePage.tsx`](file:///Users/nguyenvanminhtam/Frontend/src/pages/customer/HomePage.tsx):*

```typescript
useEffect(() => {
  // Hàm bất đồng bộ fetch dữ liệu
  const loadInitialData = async () => {
    setLoading(true);
    try {
      // Chạy song song 2 API bằng Promise.all để tối ưu tốc độ tải trang
      const [categoriesData, booksData] = await Promise.all([
        bookService.getCategories(),
        bookService.getBooks(),
      ]);
      setCategories(categoriesData);
      setBooks(booksData);
    } catch (error) {
      console.error("Lỗi khi tải dữ liệu trang chủ:", error);
    } finally {
      setLoading(false); // Tắt trạng thái xoay loading
    }
  };

  loadInitialData();
}, []); // 👈 Mảng rỗng: Đảm bảo chỉ gọi API 1 lần duy nhất khi người dùng vào trang!
```

---

#### Ví dụ 2: Tải tin nhắn Chat theo ID shop (Chạy lại khi đổi Shop)
*Từ [`ChatDrawer.tsx`](file:///Users/nguyenvanminhtam/Frontend/src/components/chat/ChatDrawer.tsx):*

```typescript
useEffect(() => {
  if (isOpen) {
    // Mỗi khi người dùng bấm mở chat với Shop khác (shopId thay đổi),
    // useEffect sẽ tự động chạy lại để lấy lịch sử tin nhắn của đúng Shop đó!
    chatService.getMessages(shopId, user?.id).then((data) => {
      setMessages(data);
    });
  }
}, [isOpen, shopId, user?.id]); // 👈 Lắng nghe sự thay đổi của isOpen, shopId và userId
```

---

## PHẦN 4: HƯỚNG DẪN KẾT NỐI FRONTEND VỚI BACKEND API QUA AXIOS

### 4.1. Luồng truyền nhận dữ liệu giữa Frontend và Backend (.NET 8 / Node.js)

```
┌─────────────────┐           HTTP Request (JSON)          ┌─────────────────────┐
│  REACT FRONTEND │ ─────────────────────────────────────► │ BACKEND WEB API     │
│                 │   Headers: Authorization: Bearer JWT   │ (ASP.NET / Node.js) │
│ (Port: 5173)    │ ◄───────────────────────────────────── │ (Port: 5000)        │
└─────────────────┘           HTTP Response (JSON)         └─────────────────────┘
```

---

### 4.2. Thiết lập Axios Client chuẩn Enterprise ([`src/services/api.ts`](file:///Users/nguyenvanminhtam/Frontend/src/services/api.ts))

```typescript
import axios, { AxiosError, InternalAxiosRequestConfig } from "axios";
import { getStoredToken, removeStoredToken } from "../utils/storage";

// 1. Khởi tạo instance với baseURL
export const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "/api", // Chuyển tiếp qua Vite Proxy
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 15000, // Timeout sau 15 giây nếu server không phản hồi
});

// 2. Request Interceptor: Tự động đính kèm JWT Bearer Token vào mọi Request
apiClient.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = getStoredToken();
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// 3. Response Interceptor: Bắt và xử lý mã lỗi HTTP tập trung
apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    if (error.response?.status === 401) {
      console.warn("Phiên đăng nhập đã hết hạn. Đang đăng xuất...");
      removeStoredToken();
      window.location.href = "/";
    }
    return Promise.reject(error);
  }
);
```

---

### 4.3. Xây dựng Service Function hoàn chỉnh (Mẫu chuẩn)

*Cách viết Service Method trong `src/services/orderService.ts`:*

```typescript
export const orderService = {
  // Hàm gọi API tạo đơn hàng mới
  async createOrder(orderPayload: CreateOrderDTO): Promise<Order[]> {
    try {
      // 1. Gửi HTTP POST request lên backend
      const response = await apiClient.post<Order[]>("/orders", orderPayload);
      
      // 2. Trả về dữ liệu thực tế từ backend
      return response.data;
    } catch (error) {
      console.warn("[API Offline] Đang chạy dữ liệu Mock Fallback...");
      
      // 3. Fallback mock dữ liệu khi backend đang bảo trì hoặc chưa chạy
      const mockOrder: Order = {
        id: Date.now(),
        ...orderPayload,
        orderStatus: "PENDING",
        createdAt: new Date().toLocaleDateString("vi-VN"),
      };
      return [mockOrder];
    }
  },
};
```

---

### 4.4. Cách Component tiêu thụ dữ liệu từ Service (Mẫu chuẩn)

```tsx
import React, { useState, useEffect } from "react";
import { Book } from "../../types";
import { bookService } from "../../services/bookService";

export const BookListExample: React.FC = () => {
  // 1. Ba trạng thái chuẩn của một màn hình gọi API:
  const [books, setBooks] = useState<Book[]>([]);      // Data state
  const [loading, setLoading] = useState<boolean>(true); // Loading state
  const [error, setError] = useState<string | null>(null); // Error state

  // 2. Gọi API trong useEffect khi mở màn hình
  useEffect(() => {
    let isMounted = true; // Cờ tránh rò rỉ bộ nhớ (Memory Leak)

    const fetchBooks = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await bookService.getBooks();
        if (isMounted) {
          setBooks(data);
        }
      } catch (err) {
        if (isMounted) {
          setError("Không thể tải danh sách sách. Vui lòng thử lại sau.");
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchBooks();

    return () => {
      isMounted = false; // Dọn dẹp khi unmount
    };
  }, []);

  // 3. Render giao diện dựa trên 3 trạng thái
  if (loading) return <div className="p-8 text-center text-blue-600 font-bold">Đang tải dữ liệu từ máy chủ...</div>;
  if (error) return <div className="p-8 text-center text-red-500">{error}</div>;

  return (
    <div className="grid grid-cols-4 gap-4 p-6">
      {books.map((book) => (
        <div key={book.id} className="p-4 border rounded-2xl bg-white shadow-sm">
          <h3 className="font-bold text-slate-800">{book.title}</h3>
          <p className="text-xs text-slate-500">{book.author}</p>
          <p className="text-blue-600 font-bold mt-2">{book.price.toLocaleString("vi-VN")} đ</p>
        </div>
      ))}
    </div>
  );
};
```

---

## PHẦN 5: TỔNG KẾT & QUY TẮC VÀNG KHI LẬP TRÌNH REACT + TYPESCRIPT

1. **Quy tắc Bất Biến (Immutability):** Không bao giờ thay đổi trực tiếp State (`state.push()`, `state.name = "X"`). Luôn dùng hàm `setState` với bản sao mới (`[...state, newItem]` hoặc `{ ...state, key: value }`).
2. **Không gọi API trực tiếp trong Body của Component:** Luôn bọc lời gọi API bên trong `useEffect` hoặc Event Handler (`onClick`, `onSubmit`).
3. **Luôn khai báo kiểu dữ liệu cho State:** `useState<Book[]>` hoặc `useState<User | null>(null)` để TypeScript bảo vệ bạn khỏi các lỗi truy cập thuộc tính của `null`/`undefined`.
4. **Cô lập Endpoint trong tầng Service:** Không viết `axios.get('/api/...')` trực tiếp trong Component UI; hãy viết trong `src/services/` để dễ tái sử dụng và thay đổi URL khi cần.
