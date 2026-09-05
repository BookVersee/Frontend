import { apiClient } from "./api";
import { BackendCartResponse, ApiResponse } from "../types";
import { normalizeBookGuid } from "../utils/guidHelper";

export const cartService = {
  /**
   * Lấy toàn bộ thông tin giỏ hàng của người dùng hiện tại từ Database
   * GET /api/cart/GetCart
   */
  async getCart(): Promise<BackendCartResponse | null> {
    try {
      const res = await apiClient.get<ApiResponse<BackendCartResponse>>("/cart/GetCart");
      return res.data?.data || null;
    } catch (error: any) {
      console.warn("[cartService] getCart error:", error?.response?.data?.message || error.message);
      return null;
    }
  },

  /**
   * Thêm sản phẩm sách vào giỏ hàng ngay khi người dùng bấm "Thêm vào giỏ hàng"
   * POST /api/cart/AddToCart
   * @param bookId Mã định danh cuốn sách
   * @param quantity Số lượng muốn thêm (mặc định 1)
   */
  async addToCart(bookId: string | number, quantity = 1): Promise<BackendCartResponse | null> {
    try {
      const validBookId = normalizeBookGuid(bookId);
      const res = await apiClient.post<ApiResponse<BackendCartResponse>>("/cart/AddToCart", {
        bookId: validBookId,
        quantity,
      });
      return res.data?.data || null;
    } catch (error: any) {
      const msg = error?.response?.data?.message || error.message || "Không thể thêm sản phẩm vào giỏ hàng.";
      console.error("[cartService] addToCart error:", msg);
      throw new Error(msg);
    }
  },

  /**
   * Cập nhật số lượng của một sản phẩm trong giỏ hàng
   * PUT /api/cart/UpdateCartItem?cartDetailId=...
   * @param cartDetailId Mã định danh dòng giỏ hàng trong database
   * @param quantity Số lượng mới
   */
  async updateCartItem(cartDetailId: string, quantity: number): Promise<BackendCartResponse | null> {
    try {
      const res = await apiClient.put<ApiResponse<BackendCartResponse>>(
        "/cart/UpdateCartItem",
        { quantity },
        { params: { cartDetailId } }
      );
      return res.data?.data || null;
    } catch (error: any) {
      const msg = error?.response?.data?.message || error.message || "Không thể cập nhật số lượng.";
      console.warn("[cartService] updateCartItem error:", msg);
      throw new Error(msg);
    }
  },

  /**
   * Xóa một sản phẩm khỏi giỏ hàng
   * DELETE /api/cart/RemoveFromCart?cartDetailId=...
   * @param cartDetailId Mã định danh dòng giỏ hàng trong database
   */
  async removeFromCart(cartDetailId: string): Promise<BackendCartResponse | null> {
    try {
      const res = await apiClient.delete<ApiResponse<BackendCartResponse>>(
        "/cart/RemoveFromCart",
        { params: { cartDetailId } }
      );
      return res.data?.data || null;
    } catch (error: any) {
      console.warn("[cartService] removeFromCart error:", error?.response?.data?.message || error.message);
      return null;
    }
  },

  /**
   * Làm trống toàn bộ giỏ hàng
   * DELETE /api/cart/ClearCart
   */
  async clearCart(): Promise<boolean> {
    try {
      await apiClient.delete<ApiResponse<string>>("/cart/ClearCart");
      return true;
    } catch (error: any) {
      console.warn("[cartService] clearCart error:", error?.response?.data?.message || error.message);
      return false;
    }
  },
};
