import React, { createContext, useContext, useState, useEffect } from "react";
import { Book, CartItem } from "../types";
import { getStoredCart, setStoredCart } from "../utils/storage";
import { normalizeBookGuid } from "../utils/guidHelper";

interface CartContextType {
  cart: CartItem[];
  cartCount: number;
  subtotal: number;
  shippingFee: number;
  total: number;
  addToCart: (book: Book, quantity?: number) => void;
  updateQuantity: (bookId: string | number, quantity: number) => void;
  removeFromCart: (bookId: string | number) => void;
  clearCart: () => void;
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

  const addToCart = (book: Book, quantity = 1) => {
    if (!book || !book.id) return;
    const normalizedBook: Book = {
      ...book,
      id: normalizeBookGuid(book.id),
    };
    const bookIdStr = String(normalizedBook.id);
    
    // Tự động tick chọn sản phẩm vừa thêm vào giỏ
    setSelectedBookIds((prev) => (prev.includes(bookIdStr) ? prev : [...prev, bookIdStr]));

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
  };

  const updateQuantity = (bookId: string | number, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(bookId);
    } else {
      setCart((prev) =>
        prev.map((item) =>
          item?.book && String(item.book.id) === String(bookId) ? { ...item, quantity } : item
        )
      );
    }
  };

  const removeFromCart = (bookId: string | number) => {
    const idStr = String(bookId);
    setCart((prev) => prev.filter((item) => item?.book && String(item.book.id) !== idStr));
    setSelectedBookIds((prev) => prev.filter((id) => id !== idStr));
  };

  // Chỉ xóa các món đã được đặt mua thành công, giữ lại các món chưa mua trong giỏ
  const removePurchasedItems = (purchasedBookIds: (string | number)[]) => {
    const purchasedSet = new Set(purchasedBookIds.map(String));
    setCart((prev) => prev.filter((item) => item?.book && !purchasedSet.has(String(item.book.id))));
    setSelectedBookIds((prev) => prev.filter((id) => !purchasedSet.has(id)));
  };

  const clearCart = () => {
    setCart([]);
    setSelectedBookIds([]);
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
