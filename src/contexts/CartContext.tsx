import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { Book, CartItem, BackendCartResponse } from "../types";
import { getStoredCart, setStoredCart, getStoredToken } from "../utils/storage";
import { normalizeBookGuid } from "../utils/guidHelper";
import { cartService } from "../services/cartService";

interface CartContextType {
  cart: CartItem[];
  cartCount: number;
  subtotal: number;
  shippingFee: number;
  total: number;
  addToCart: (book: Book, quantity?: number) => Promise<boolean>;
  updateQuantity: (bookId: string | number, quantity: number) => Promise<void>;
  removeFromCart: (bookId: string | number) => Promise<void>;
  clearCart: () => Promise<void>;
  refreshCart: () => Promise<void>;
  setCart: React.Dispatch<React.SetStateAction<CartItem[]>>;

  // Selection state
  selectedBookIds: string[];
  toggleSelectItem: (bookId: string | number) => void;
  selectAllItems: () => void;
  deselectAllItems: () => void;
  toggleSelectAll: () => void;
  isItemSelected: (bookId: string | number) => boolean;
  isAllSelected: boolean;
  selectedItems: CartItem[];
  selectedCount: number;
  selectedSubtotal: number;
  selectedShippingFee: number;
  selectedTotal: number;
  removePurchasedItems: (purchasedBookIds: (string | number)[]) => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [cart, setCart] = useState<CartItem[]>(() => {
    const rawCart = getStoredCart<CartItem>();
    return rawCart.map((item) => {
      if (item?.book && item.book.id) {
        const normalizedId = normalizeBookGuid(item.book.id);
        if (String(normalizedId) !== String(item.book.id)) {
          return {
            ...item,
            book: {
              ...item.book,
              id: normalizedId,
            },
          };
        }
      }
      return item;
    });
  });

  // Mặc định chọn tất cả sản phẩm đang có trong giỏ hàng khi khởi tạo
  const [selectedBookIds, setSelectedBookIds] = useState<string[]>(() => {
    const rawCart = getStoredCart<CartItem>();
    return rawCart
      .map((item) => (item?.book?.id ? normalizeBookGuid(item.book.id) : ""))
      .filter(Boolean);
  });

  // Chuyển đổi dữ liệu BackendCartResponse thành CartItem[] của Frontend
  const syncWithBackendCart = useCallback((backendCart: BackendCartResponse, currentCart: CartItem[]): CartItem[] => {
    const existingBookMap = new Map<string, Book>();
    currentCart.forEach((item) => {
      if (item?.book?.id) {
        existingBookMap.set(String(item.book.id).toLowerCase(), item.book);
      }
    });

    const items: CartItem[] = [];
    for (const group of backendCart.shopGroups || []) {
      for (const bItem of group.items || []) {
        const bookIdStr = String(bItem.bookId).toLowerCase();
        const existingBook = existingBookMap.get(bookIdStr);

        const book: Book = existingBook
          ? {
              ...existingBook,
              id: bItem.bookId,
              title: bItem.bookTitle || existingBook.title,
              price: bItem.unitPrice || existingBook.price,
              imageUrl: bItem.bookImage || existingBook.imageUrl,
              shopId: group.shopId || existingBook.shopId,
              shopName: group.shopName || existingBook.shopName,
            }
          : {
              id: bItem.bookId,
              title: bItem.bookTitle,
              price: bItem.unitPrice,
              imageUrl: bItem.bookImage,
              shopId: group.shopId,
              shopName: group.shopName,
              coverColor: "#1e3a8a",
              coverColor2: "#3b82f6",
              status: "ACTIVE",
              category: "",
              author: "",
              rating: 5,
              reviewCount: 0,
              description: "",
            };

        items.push({
          cartDetailId: bItem.cartDetailId,
          book,
          quantity: bItem.quantity,
        });
      }
    }
    return items;
  }, []);

  // Hàm tải lại giỏ hàng từ máy chủ Backend
  const refreshCart = useCallback(async () => {
    const token = getStoredToken();
    if (!token) return;

    const backendCart = await cartService.getCart();
    if (backendCart) {
      setCart((prev) => {
        const updated = syncWithBackendCart(backendCart, prev);
        setStoredCart(updated);
        return updated;
      });
    }
  }, [syncWithBackendCart]);

  // Đồng bộ với Backend khi khởi tạo hoặc khi có token
  useEffect(() => {
    const token = getStoredToken();
    if (token) {
      refreshCart();
    }
  }, [refreshCart]);

  // Lưu giỏ hàng vào localStorage mỗi khi state cart thay đổi
  useEffect(() => {
    setStoredCart(cart);
  }, [cart]);

  // Đồng bộ selectedBookIds khi giỏ hàng thay đổi (loại bỏ các id đã bị xóa)
  useEffect(() => {
    const currentBookIds = new Set(cart.map((i) => String(i?.book?.id)));
    setSelectedBookIds((prev) => prev.filter((id) => currentBookIds.has(id)));
  }, [cart]);

  const cartCount = cart.reduce((sum, item) => sum + (Number(item?.quantity) || 0), 0);
  const subtotal = cart.reduce(
    (sum, item) => sum + (Number(item?.book?.price) || 0) * (Number(item?.quantity) || 0),
    0
  );
  const shippingFee = cart.length > 0 ? 30000 : 0;
  const total = subtotal + shippingFee;

  // Trạng thái các món được người dùng tick chọn (Selected Items)
  const isItemSelected = (bookId: string | number) => selectedBookIds.includes(String(bookId));
  const isAllSelected = cart.length > 0 && cart.every((i) => selectedBookIds.includes(String(i?.book?.id)));

  const toggleSelectItem = (bookId: string | number) => {
    const idStr = String(bookId);
    setSelectedBookIds((prev) =>
      prev.includes(idStr) ? prev.filter((id) => id !== idStr) : [...prev, idStr]
    );
  };

  const selectAllItems = () => {
    setSelectedBookIds(cart.map((i) => String(i?.book?.id)));
  };

  const deselectAllItems = () => {
    setSelectedBookIds([]);
  };

  const toggleSelectAll = () => {
    if (isAllSelected) {
      deselectAllItems();
    } else {
      selectAllItems();
    }
  };

  const selectedItems = cart.filter((item) => item?.book && selectedBookIds.includes(String(item.book.id)));
  const selectedCount = selectedItems.reduce((sum, item) => sum + (Number(item?.quantity) || 0), 0);
  const selectedSubtotal = selectedItems.reduce(
    (sum, item) => sum + (Number(item?.book?.price) || 0) * (Number(item?.quantity) || 0),
    0
  );
  const selectedShippingFee = selectedItems.length > 0 ? 30000 : 0;
  const selectedTotal = selectedSubtotal + selectedShippingFee;

  /**
   * Thêm sản phẩm sách vào giỏ hàng:
   * 1. Cập nhật ngay state trên Frontend (Optimistic UI)
   * 2. Gọi ngay lập tức API POST /api/cart/AddToCart lên máy chủ Backend
   */
  const addToCart = async (book: Book, quantity = 1): Promise<boolean> => {
    if (!book || !book.id) return false;
    const normalizedBook: Book = {
      ...book,
      id: normalizeBookGuid(book.id),
    };
    const bookIdStr = String(normalizedBook.id);

    // Tự động tick chọn sản phẩm vừa thêm vào giỏ
    setSelectedBookIds((prev) => (prev.includes(bookIdStr) ? prev : [...prev, bookIdStr]));

    // Cập nhật Optimistic vào state React
    setCart((prev) => {
      const existing = prev.find((item) => item?.book && String(item.book.id) === bookIdStr);
      if (existing) {
        return prev.map((item) =>
          item?.book && String(item.book.id) === bookIdStr
            ? { ...item, quantity: (Number(item.quantity) || 0) + quantity }
            : item
        );
      }
      return [...prev, { book: normalizedBook, quantity }];
    });

    // Nếu người dùng đã đăng nhập, gửi ngay API lên máy chủ Backend
    const token = getStoredToken();
    if (token) {
      try {
        const backendCart = await cartService.addToCart(normalizedBook.id, quantity);
        if (backendCart) {
          setCart((prev) => syncWithBackendCart(backendCart, prev));
        }
        return true;
      } catch (error: any) {
        console.warn("[CartContext] addToCart server sync error:", error.message);
        // Có thể hiển thị thông báo lỗi từ Backend nếu hết hàng trong kho
        return false;
      }
    }

    return true;
  };

  /**
   * Cập nhật số lượng cuốn sách trong giỏ hàng:
   * 1. Cập nhật state React
   * 2. Gọi API PUT /api/cart/UpdateCartItem hoặc DELETE /api/cart/RemoveFromCart
   */
  const updateQuantity = async (bookId: string | number, quantity: number) => {
    const idStr = String(bookId);
    const targetItem = cart.find((item) => item?.book && String(item.book.id) === idStr);

    if (quantity <= 0) {
      await removeFromCart(bookId);
      return;
    }

    setCart((prev) =>
      prev.map((item) =>
        item?.book && String(item.book.id) === idStr ? { ...item, quantity } : item
      )
    );

    const token = getStoredToken();
    if (token && targetItem?.cartDetailId) {
      try {
        await cartService.updateCartItem(targetItem.cartDetailId, quantity);
      } catch (error: any) {
        console.warn("[CartContext] updateQuantity server sync error:", error.message);
      }
    }
  };

  /**
   * Xóa một cuốn sách khỏi giỏ hàng:
   * 1. Xóa khỏi state React
   * 2. Gọi API DELETE /api/cart/RemoveFromCart
   */
  const removeFromCart = async (bookId: string | number) => {
    const idStr = String(bookId);
    const targetItem = cart.find((item) => item?.book && String(item.book.id) === idStr);

    setCart((prev) => prev.filter((item) => item?.book && String(item.book.id) !== idStr));
    setSelectedBookIds((prev) => prev.filter((id) => id !== idStr));

    const token = getStoredToken();
    if (token && targetItem?.cartDetailId) {
      try {
        await cartService.removeFromCart(targetItem.cartDetailId);
      } catch (error: any) {
        console.warn("[CartContext] removeFromCart server sync error:", error.message);
      }
    }
  };

  /**
   * Chỉ xóa các món đã được đặt mua thành công, giữ lại các món chưa mua trong giỏ
   */
  const removePurchasedItems = (purchasedBookIds: (string | number)[]) => {
    const purchasedSet = new Set(purchasedBookIds.map(String));
    setCart((prev) => prev.filter((item) => item?.book && !purchasedSet.has(String(item.book.id))));
    setSelectedBookIds((prev) => prev.filter((id) => !purchasedSet.has(id)));
  };

  /**
   * Làm trống toàn bộ giỏ hàng
   */
  const clearCart = async () => {
    setCart([]);
    setSelectedBookIds([]);

    const token = getStoredToken();
    if (token) {
      try {
        await cartService.clearCart();
      } catch (error: any) {
        console.warn("[CartContext] clearCart server sync error:", error.message);
      }
    }
  };

  return (
    <CartContext.Provider
      value={{
        cart,
        cartCount,
        subtotal,
        shippingFee,
        total,
        addToCart,
        updateQuantity,
        removeFromCart,
        clearCart,
        refreshCart,
        setCart,
        selectedBookIds,
        toggleSelectItem,
        selectAllItems,
        deselectAllItems,
        toggleSelectAll,
        isItemSelected,
        isAllSelected,
        selectedItems,
        selectedCount,
        selectedSubtotal,
        selectedShippingFee,
        selectedTotal,
        removePurchasedItems,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = (): CartContextType => {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within a CartProvider");
  return ctx;
};
