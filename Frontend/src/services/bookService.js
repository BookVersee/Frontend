import { apiClient } from "./api";
import { INITIAL_BOOKS, INITIAL_CATEGORIES } from "./mockData";

export const bookService = {
  async getCategories() {
    try {
      const res = await apiClient.get("/categories");
      return res.data;
    } catch {
      return INITIAL_CATEGORIES;
    }
  },

  async getBooks() {
    try {
      const res = await apiClient.get("/books");
      return res.data;
    } catch {
      return INITIAL_BOOKS;
    }
  },

  async getBookById(id) {
    try {
      const res = await apiClient.get(`/books/${id}`);
      return res.data;
    } catch {
      const b = INITIAL_BOOKS.find((item) => item.id === id);
      return b || null;
    }
  },

  async getBooksByShop(shopId) {
    try {
      const res = await apiClient.get(`/shops/${shopId}/books`);
      return res.data;
    } catch {
      return INITIAL_BOOKS.filter((b) => b.shopId === shopId);
    }
  },

  async createBook(bookData) {
    try {
      const res = await apiClient.post("/books", bookData);
      return res.data;
    } catch {
      const newBook = {
        ...bookData,
        id: Date.now(),
      };
      return newBook;
    }
  },
};
