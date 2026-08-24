# HƯỚNG DẪN CHI TIẾT 2 BỘ MÃ NGUỒN MỞ: SHADCN-ADMIN & ASSISTANT-UI

> **Tài liệu phân tích kiến trúc, hướng dẫn cài đặt và ứng dụng thực tế vào dự án BookVerse**  
> **Dành cho:** Frontend & Fullstack Developers  

---

## 📑 MỤC LỤC

1. [Tổng quan về 2 thư viện mã nguồn mở](#1-tổng-quan-về-2-thư-viện-mã-nguồn-mở)
2. [Phần 1: Khám phá & Làm chủ `shadcn-admin`](#phần-1-khám-phá--làm-chủ-shadcn-admin)
   - 2.1. Giới thiệu & Cấu trúc kiến trúc
   - 2.2. Hướng dẫn cài đặt & Chạy thử nghiệm độc lập
   - 2.3. Giải thích cơ chế hoạt động trong mã nguồn
   - 2.4. Cách ứng dụng các component của `shadcn-admin` vào BookVerse
3. [Phần 2: Khám phá & Làm chủ `assistant-ui`](#phần-2-khám-phá--làm-chủ-assistant-ui)
   - 3.1. Giới thiệu & Kiến trúc AI Chatbot Runtime
   - 3.2. Hướng dẫn cài đặt & Tích hợp
   - 3.3. Giải thích các primitives: `Thread`, `Composer`, `Message`
   - 3.4. Xây dựng "Trợ lý AI Tư vấn Sách BookVerse" (AI Book Concierge)
4. [So sánh & Bản đồ tích hợp vào hệ sinh thái BookVerse](#4-so-sánh--bản-đồ-tích-hợp-vào-hệ-sinh-thái-bookverse)

---

## 1. TỔNG QUAN VỀ 2 THƯ VIỆN MÃ NGUỒN MỞ

| Tiêu chí | 🛡️ `shadcn-admin` | 🤖 `assistant-ui` |
| :--- | :--- | :--- |
| **Repository** | [satnaing/shadcn-admin](https://github.com/satnaing/shadcn-admin) | [assistant-ui/assistant-ui](https://github.com/assistant-ui/assistant-ui) |
| **Mục đích chính** | Bộ khung Giao diện Quản trị viên (Admin Dashboard) chuẩn Enterprise. | Bộ component & Runtime chuyên sâu để xây dựng giao diện AI Chat / Chatbot. |
| **Công nghệ lõi** | React, TypeScript, Tailwind CSS, Radix UI Primitives, TanStack Table, Recharts. | React, TypeScript, Tailwind CSS, Vercel AI SDK, LangChain / OpenAI Runtimes. |
| **Vị trí áp dụng trong BookVerse** | Nâng cấp giao diện **Admin Dashboard** & **Shop Dashboard** (Bảng quản lý đơn, lọc dữ liệu nâng cao). | Tích hợp **AI Trợ lý Sách (AI Book Assistant)** tư vấn đọc sách thông minh và giải đáp thắc mắc. |
| **Thư mục tham khảo** | `Frontend/references/shadcn-admin` | `Frontend/references/assistant-ui` |

---

## PHẦN 1: KHÁM PHÁ & LÀM CHỦ `shadcn-admin`

### 2.1. Giới thiệu & Cấu trúc kiến trúc
`shadcn-admin` là một bản mẫu (Template) Admin Dashboard mã nguồn mở cực kỳ nổi tiếng trong cộng đồng React. Khác với các thư viện đóng gói (như Material-UI hay Ant Design), triết lý của **Shadcn UI** là: **"Copy and paste components into your project"** - bạn sở hữu 100% mã nguồn component, dễ dàng tùy biến giao diện mà không bị giới hạn bởi thư viện bên thứ ba.

```
references/shadcn-admin/
├── src/
│   ├── components/
│   │   ├── ui/                 # Atomic UI primitives (button, dialog, dropdown-menu, table...)
│   │   ├── app-sidebar.tsx     # Thanh sidebar điều hướng có thể thu gọn (Collapsible Sidebar)
│   │   ├── search.tsx          # Ô tìm kiếm Spotlight / Command Palette (Ctrl + K)
│   │   └── theme-switch.tsx    # Chuyển đổi Dark / Light mode
│   ├── features/               # Cấu trúc Feature-based sạch sẽ:
│   │   ├── users/              # Quản lý User (Data Table, Filter, Action Dialogs)
│   │   ├── tasks/              # Quản lý Task & Kanban board
│   │   └── dashboard/          # Biểu đồ phân tích doanh thu & Cards thống kê
│   ├── routes/                 # Định tuyến với React Router
│   └── main.tsx                # Entry point
```

---

### 2.2. Hướng dẫn cài đặt & Chạy thử nghiệm độc lập

Để chạy thử `shadcn-admin` độc lập:

```bash
# 1. Di chuyển vào thư mục tham khảo
cd /Users/nguyenvanminhtam/Frontend/references/shadcn-admin

# 2. Cài đặt các thư viện phụ thuộc bằng pnpm (hoặc npm)
npm install --legacy-peer-deps

# 3. Khởi chạy dev server trên cổng riêng (ví dụ: 5174)
npm run dev
```

---

### 2.3. Giải thích cơ chế hoạt động cốt lõi

#### A. Cơ chế Data Table với `@tanstack/react-table`
Thay vì viết thẻ `<table>` tĩnh, `shadcn-admin` dùng TanStack Table (Headless UI) kết hợp với Tailwind CSS để tạo bảng dữ liệu có sẵn:
- Phân trang (*Pagination*).
- Sắp xếp cột (*Column Sorting*).
- Lọc theo từng cột hoặc tìm kiếm toàn cục (*Global Filtering*).
- Ẩn/Hiện cột linh hoạt (*Column Visibility*).

*Cách viết một cột trong Data Table:*
```tsx
import { ColumnDef } from "@tanstack/react-table";
import { User } from "./types";

export const columns: ColumnDef<User>[] = [
  {
    accessorKey: "name",
    header: "Họ và Tên",
    cell: ({ row }) => <span className="font-bold">{row.getValue("name")}</span>,
  },
  {
    accessorKey: "role",
    header: "Vai trò",
    cell: ({ row }) => (
      <span className="px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 text-xs">
        {row.getValue("role")}
      </span>
    ),
  },
];
```

---

### 2.4. Cách ứng dụng các component của `shadcn-admin` vào BookVerse

Chúng ta có thể chuyển giao 3 tính năng xuất sắc nhất của `shadcn-admin` vào BookVerse:

1. **Sidebar Thu Gọn (Collapsible Sidebar):** Áp dụng vào [`src/pages/admin/AdminDashboardPage.tsx`](file:///Users/nguyenvanminhtam/Frontend/src/pages/admin/AdminDashboardPage.tsx) thay thế cho thanh tab ngang, giúp màn hình quản trị rộng rãi và chuyên nghiệp hơn.
2. **Command Palette (`Ctrl + K` Quick Search):** Cho phép Admin tìm kiếm nhanh mã đơn hàng, tên khách hàng hoặc tên sách chỉ bằng phím tắt.
3. **Data Table lọc nhiều tiêu chí:** Áp dụng vào bảng đơn hàng và bảng đối soát dòng tiền `Transaction`.

---

## PHẦN 2: KHÁM PHÁ & LÀM CHỦ `assistant-ui`

### 3.1. Giới thiệu & Kiến trúc AI Chatbot Runtime
`assistant-ui` là một bộ thư viện React chuyên sâu hàng đầu hiện nay dành riêng cho việc xây dựng **Giao diện Chatbot Trí tuệ Nhân tạo (AI Chat / Generative UI)**.

Khác với khung chat nhắn tin người-với-người thông thường (`ChatDrawer.tsx`), `assistant-ui` cung cấp sẵn:
- **Streaming Response:** Hiệu ứng chữ chạy từng từ mượt mà giống hệt ChatGPT / Claude.
- **Thread Management:** Quản lý nhiều phiên trò chuyện khác nhau.
- **Generative UI / Tool Calling:** Cho phép AI trả về các **React Component trực tiếp** (ví dụ: AI gợi ý 3 cuốn sách và render ngay thẻ `BookCard` có nút "Mua ngay" vào bên trong ô chat!).
- **Branching & Editing:** Cho phép người dùng chỉnh sửa lại câu hỏi trước đó và sinh lại câu trả lời.

```
┌─────────────────────────────────────────────────────────────┐
│                    ASSISTANT-UI RUNTIME                     │
├──────────────────────────────┬──────────────────────────────┤
│ <Thread />                   │ Khung hiển thị luồng chat    │
│   ├── <ThreadWelcome />      │ Lời chào & Gợi ý câu hỏi mẫu │
│   ├── <MessageList />        │ Danh sách tin nhắn           │
│   │     ├── <UserMessage />  │ Tin nhắn của người dùng      │
│   │     └── <AssistantMsg /> │ Tin nhắn trả lời từ AI       │
│   └── <Composer />           │ Ô nhập prompt, gửi ảnh/tệp   │
└──────────────────────────────┴──────────────────────────────┘
```

---

### 3.2. Hướng dẫn cài đặt & Chạy thử nghiệm

Để khám phá mã nguồn `assistant-ui`:

```bash
# 1. Di chuyển vào thư mục tham khảo
cd /Users/nguyenvanminhtam/Frontend/references/assistant-ui

# 2. Cài đặt dependencies
npm install

# 3. Xem các ví dụ mẫu
npm run build
```

---

### 3.3. Các Component cốt lõi (Primitives)

```tsx
import { Thread, Composer, Message } from "@assistant-ui/react";
import { useLocalRuntime } from "@assistant-ui/react";

export const AIChatExample = () => {
  // Runtime kết nối với Backend hoặc mô hình AI (OpenAI, Gemini, Ollama)
  const runtime = useLocalRuntime({
    async onSend(message) {
      // Gửi câu hỏi lên API AI Backend của bạn
      const response = await fetch("/api/ai/chat", {
        method: "POST",
        body: JSON.stringify({ prompt: message.content }),
      });
      return response.body;
    },
  });

  return (
    <div className="h-[600px] border rounded-2xl p-4 bg-white">
      <Thread runtime={runtime}>
        {/* Render danh sách tin nhắn và ô nhập tự động */}
      </Thread>
    </div>
  );
};
```

---

### 3.4. Xây dựng "Trợ lý AI Tư vấn Sách BookVerse" (AI Book Concierge)

Chúng ta có thể tích hợp `assistant-ui` vào BookVerse để tạo tính năng **"Trợ lý AI Đọc Sách"**:

```tsx
// Ví dụ kịch bản tích hợp vào BookVerse:
// Người dùng hỏi: "Gợi ý cho tôi 2 cuốn sách hay về tâm lý học hành vi"
// AI Bot trả về: Lời giải thích kèm trực tiếp 2 Component BookCover + Nút "Thêm vào giỏ"
```

1. **Khách hàng bấm nút "Hỏi Trợ Lý AI"** ở góc phải màn hình.
2. **Khung AI Assistant mở ra**, gợi ý các câu hỏi: *"Sách bán chạy nhất tuần này?"*, *"Sách phát triển bản thân cho sinh viên?"*.
3. **AI phản hồi dạng Streaming**, tự động tìm kiếm sách trong kho dữ liệu của BookVerse và hiển thị danh thiếp sách tương tác trực tiếp.

---

## 4. TỔNG KẾT & HƯỚNG DẪN ỨNG DỤNG VÀO BOOKVERSE

```
┌──────────────────────────────────────────────────────────────────────────┐
│                         BOOKVERSE APPLICATION                            │
├──────────────────────────────┬───────────────────────────────────────────┤
│ 🛒 PHÂN HỆ KHÁCH HÀNG        │ 🤖 TÍCH HỢP ASSISTANT-UI                  │
│    - HomePage, BookDetail    │    - AI Book Recommendation Concierge     │
│    - MyOrders, Profile       │    - Chatbot hỗ trợ giải đáp chính sách   │
├──────────────────────────────┼───────────────────────────────────────────┤
│ 🏪 PHÂN HỆ ADMIN & SHOP      │ 🛡️ TÍCH HỢP SHADCN-ADMIN                 │
│    - AdminDashboardPage      │    - Collapsible Navigation Sidebar       │
│    - ShopDashboardPage       │    - TanStack Data Table với bộ lọc đa cột│
└──────────────────────────────┴───────────────────────────────────────────┘
```

Hai bộ mã nguồn tham khảo này hiện đã nằm sẵn trong thư mục `references/` của bạn, sẵn sàng để chúng ta trích xuất và tích hợp từng tính năng nâng cao vào BookVerse bất cứ khi nào bạn muốn!
