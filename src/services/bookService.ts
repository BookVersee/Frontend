import { apiClient } from "./api";
import { Book, Category, Shop, ApiResponse } from "../types";
import { INITIAL_BOOKS, INITIAL_CATEGORIES, INITIAL_SHOPS } from "./mockData";

export const bookService = {
  async getCategories(): Promise<Category[]> {
    try {
      // Gọi API lấy danh mục thực tế của Backend
      const res = await apiClient.get<ApiResponse<any[]>>("/categories/GetCategories");
      return res.data.data.map((c: any) => ({
        id: c.id,
        name: c.name,
      }));
    } catch (error) {
      console.warn("getCategories API error, falling back to mock:", error);
      return INITIAL_CATEGORIES;
    }
  },

  async getBooks(search?: string, categoryId?: string | number): Promise<Book[]> {
    try {
      const params: any = {
        page: 1,
        pageSize: 100, // lấy danh sách đủ nhiều để hiển thị
      };
      if (search && search.trim()) params.keyword = search;
      if (categoryId && categoryId !== "0" && categoryId !== 0) params.categoryId = categoryId;

      const res = await apiClient.get<ApiResponse<any>>("/shop/FindBooks", {
        params,
      });

      const pagedData = res.data.data;
      const items = pagedData.items || [];
      return items.map((b: any) => ({
        id: b.id,
        shopId: b.shopId,
        shopName: b.shopName,
        categoryId: b.categoryId,
        title: b.title,
        author: b.author || "Chưa rõ tác giả",
        publisher: b.publisher || "NXB Cập nhật",
        price: b.price,
        stock: b.stockQuantity,
        rating: b.rating || 0,
        reviewCount: 0,
        description: b.description || "",
        coverColor: "#ffffff",
        coverColor2: "#ffffff",
        imageUrl: b.imageUrl,
        status: b.status === "ACTIVE" ? "ACTIVE" : b.status === "EMPTY" ? "OUT_OF_STOCK" : "HIDDEN",
        isbn: b.isbn,
        publishedYear: b.publishedYear,
      }));
    } catch (error) {
      console.warn("getBooks API error, falling back to mock:", error);
      let result = INITIAL_BOOKS.filter((b) => b.status !== "HIDDEN");
      if (categoryId && categoryId !== "0" && categoryId !== 0) {
        result = result.filter((b) => String(b.categoryId) === String(categoryId));
      }
      if (search && search.trim()) {
        const q = search.toLowerCase().trim();
        result = result.filter(
          (b) =>
            b.title.toLowerCase().includes(q) ||
            b.author.toLowerCase().includes(q) ||
            b.shopName.toLowerCase().includes(q) ||
            (b.isbn && b.isbn.includes(q))
        );
      }
      return result;
    }
  },

  async getBookById(id: string | number): Promise<Book | null> {
    try {
      const res = await apiClient.get<ApiResponse<any>>(`/shop/GetBookDetail`, {
        params: { id }
      });
      const b = res.data.data;
      return {
        id: b.id,
        shopId: b.shopId,
        shopName: b.shopName,
        categoryId: b.categoryId,
        title: b.title,
        author: b.author || "Chưa rõ tác giả",
        publisher: b.publisher || "NXB Cập nhật",
        price: b.price,
        stock: b.stockQuantity,
        rating: b.rating || 0,
        reviewCount: 0,
        description: b.description || "",
        coverColor: "#ffffff",
        coverColor2: "#ffffff",
        imageUrl: b.imageUrl,
        status: b.status === "ACTIVE" ? "ACTIVE" : b.status === "EMPTY" ? "OUT_OF_STOCK" : "HIDDEN",
        isbn: b.isbn,
        publishedYear: b.publishedYear,
      };
    } catch (error) {
      console.warn("getBookById API error, falling back to mock:", error);
      const b = INITIAL_BOOKS.find((item) => String(item.id) === String(id));
      return b || null;
    }
  },

  async getBooksByShop(shopId: string | number): Promise<Book[]> {
    try {
      const res = await apiClient.get<ApiResponse<any[]>>(`/shop/GetBooksByShop`, {
        params: { shopId }
      });
      return res.data.data.map((b: any) => ({
        id: b.id,
        shopId: b.shopId,
        shopName: b.shopName,
        categoryId: b.categoryId,
        title: b.title,
        author: b.author || "Chưa rõ tác giả",
        publisher: b.publisher || "NXB Cập nhật",
        price: b.price,
        stock: b.stockQuantity,
        rating: b.rating || 0,
        reviewCount: 0,
        description: b.description || "",
        coverColor: "#ffffff",
        coverColor2: "#ffffff",
        imageUrl: b.imageUrl,
        status: b.status === "ACTIVE" ? "ACTIVE" : b.status === "EMPTY" ? "OUT_OF_STOCK" : "HIDDEN",
        isbn: b.isbn,
        publishedYear: b.publishedYear,
      }));
    } catch (error) {
      console.warn("getBooksByShop API error, falling back to mock:", error);
      return INITIAL_BOOKS.filter((b) => String(b.shopId) === String(shopId));
    }
  },

  async getShopProfile(shopId: string | number): Promise<Shop | null> {
    try {
      const res = await apiClient.get<ApiResponse<any>>(`/shop/GetShopProfile`, {
        params: { shopId }
      });
      const s = res.data.data;
      return {
        id: s.id,
        ownerId: s.userId,
        name: s.shopName,
        email: "shop@email.com",
        phone: s.phone || "",
        address: s.address || "",
        description: "",
        status: s.condition === "ACTIVE" || s.condition === "OPEN" ? "ACTIVE" : "PENDING",
        rating: s.rating || 0,
        reviewCount: 0,
        bookCount: 0,
        joinedDate: s.createdAt,
      };
    } catch (error) {
      console.warn("getShopProfile API error, falling back to mock:", error);
      return INITIAL_SHOPS.find((s) => String(s.id) === String(shopId)) || null;
    }
  },

  async createBook(bookData: Omit<Book, "id">): Promise<Book> {
    try {
      // Note: Backend post to CreateBook might require shop specific controller, but since we have mock option:
      const res = await apiClient.post<ApiResponse<any>>("/books", bookData);
      return res.data.data;
    } catch (error) {
      console.warn("createBook API error, falling back to mock:", error);
      const newBook: Book = {
        ...bookData,
        id: Date.now() as any,
      };
      INITIAL_BOOKS.unshift(newBook);
      return newBook;
    }
  },

  async updateBook(id: string | number, bookData: Partial<Book>): Promise<Book> {
    try {
      const res = await apiClient.put<ApiResponse<any>>(`/books/${id}`, bookData);
      return res.data.data;
    } catch (error) {
      console.warn("updateBook API error, falling back to mock:", error);
      const idx = INITIAL_BOOKS.findIndex((b) => String(b.id) === String(id));
      if (idx !== -1) {
        INITIAL_BOOKS[idx] = { ...INITIAL_BOOKS[idx], ...bookData };
        return INITIAL_BOOKS[idx];
      }
      throw new Error("Không tìm thấy sách");
    }
  },

  async deleteBook(id: string | number): Promise<boolean> {
    try {
      await apiClient.delete(`/books/${id}`);
      return true;
    } catch (error) {
      console.warn("deleteBook API error, falling back to mock:", error);
      const idx = INITIAL_BOOKS.findIndex((b) => String(b.id) === String(id));
      if (idx !== -1) {
        INITIAL_BOOKS[idx].status = "HIDDEN";
      }
      return true;
    }
  },
};
