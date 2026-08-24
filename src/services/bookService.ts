import { apiClient } from "./api";
import { Book, Category, Shop } from "../types";
import { INITIAL_BOOKS, INITIAL_CATEGORIES, INITIAL_SHOPS } from "./mockData";

export const bookService = {
  async getCategories(): Promise<Category[]> {
    try {
      const res = await apiClient.get<Category[]>("/categories");
      return res.data;
    } catch {
      return INITIAL_CATEGORIES;
    }
  },

  async getBooks(search?: string, categoryId?: number): Promise<Book[]> {
    try {
      const res = await apiClient.get<Book[]>("/books", {
        params: { search, categoryId },
      });
      return res.data;
    } catch {
      let result = INITIAL_BOOKS.filter((b) => b.status !== "HIDDEN");
      if (categoryId && categoryId > 0) {
        result = result.filter((b) => b.categoryId === categoryId);
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

  async getBookById(id: number): Promise<Book | null> {
    try {
      const res = await apiClient.get<Book>(`/books/${id}`);
      return res.data;
    } catch {
      const b = INITIAL_BOOKS.find((item) => item.id === id);
      return b || null;
    }
  },

  async getBooksByShop(shopId: number): Promise<Book[]> {
    try {
      const res = await apiClient.get<Book[]>(`/shops/${shopId}/books`);
      return res.data;
    } catch {
      return INITIAL_BOOKS.filter((b) => b.shopId === shopId);
    }
  },

  async getShopProfile(shopId: number): Promise<Shop | null> {
    try {
      const res = await apiClient.get<Shop>(`/shops/${shopId}`);
      return res.data;
    } catch {
      return INITIAL_SHOPS.find((s) => s.id === shopId) || null;
    }
  },

  async createBook(bookData: Omit<Book, "id">): Promise<Book> {
    try {
      const res = await apiClient.post<Book>("/books", bookData);
      return res.data;
    } catch {
      const newBook: Book = {
        ...bookData,
        id: Date.now(),
      };
      INITIAL_BOOKS.unshift(newBook);
      return newBook;
    }
  },

  async updateBook(id: number, bookData: Partial<Book>): Promise<Book> {
    try {
      const res = await apiClient.put<Book>(`/books/${id}`, bookData);
      return res.data;
    } catch {
      const idx = INITIAL_BOOKS.findIndex((b) => b.id === id);
      if (idx !== -1) {
        INITIAL_BOOKS[idx] = { ...INITIAL_BOOKS[idx], ...bookData };
        return INITIAL_BOOKS[idx];
      }
      throw new Error("Không tìm thấy sách");
    }
  },

  async deleteBook(id: number): Promise<boolean> {
    try {
      await apiClient.delete(`/books/${id}`);
      return true;
    } catch {
      const idx = INITIAL_BOOKS.findIndex((b) => b.id === id);
      if (idx !== -1) {
        INITIAL_BOOKS[idx].status = "HIDDEN";
      }
      return true;
    }
  },
};
