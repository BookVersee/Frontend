import { apiClient } from "./api";
import { Book, Category } from "../types";
import { INITIAL_BOOKS, INITIAL_CATEGORIES } from "./mockData";

export const bookService = {
  async getCategories(): Promise<Category[]> {
    try {
      const res = await apiClient.get<Category[]>("/categories");
      return res.data;
    } catch {
      return INITIAL_CATEGORIES;
    }
  },

  async getBooks(): Promise<Book[]> {
    try {
      const res = await apiClient.get<Book[]>("/books");
      return res.data;
    } catch {
      return INITIAL_BOOKS;
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

  async createBook(bookData: Omit<Book, "id">): Promise<Book> {
    try {
      const res = await apiClient.post<Book>("/books", bookData);
      return res.data;
    } catch {
      const newBook: Book = {
        ...bookData,
        id: Date.now(),
      };
      return newBook;
    }
  },
};
