import React, { createContext, useContext, useState, useEffect } from "react";
import { Book, CartItem } from "../types";
import { getStoredCart, setStoredCart } from "../utils/storage";

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
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [cart, setCart] = useState<CartItem[]>(() => getStoredCart<CartItem>());

  useEffect(() => {
    setStoredCart(cart);
  }, [cart]);

  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);
  const subtotal = cart.reduce((sum, item) => sum + item.book.price * item.quantity, 0);
  const shippingFee = cart.length > 0 ? 30000 : 0;
  const total = subtotal + shippingFee;

  const addToCart = (book: Book, quantity = 1) => {
    setCart((prev) => {
      const existing = prev.find((item) => String(item.book.id) === String(book.id));
      if (existing) {
        return prev.map((item) =>
          String(item.book.id) === String(book.id)
            ? { ...item, quantity: item.quantity + quantity }
            : item
        );
      }
      return [...prev, { book, quantity }];
    });
  };

  const updateQuantity = (bookId: string | number, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(bookId);
    } else {
      setCart((prev) =>
        prev.map((item) =>
          String(item.book.id) === String(bookId) ? { ...item, quantity } : item
        )
      );
    }
  };

  const removeFromCart = (bookId: string | number) => {
    setCart((prev) => prev.filter((item) => String(item.book.id) !== String(bookId)));
  };

  const clearCart = () => {
    setCart([]);
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
