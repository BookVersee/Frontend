const TOKEN_KEY = "bookverse_auth_token";
const REFRESH_TOKEN_KEY = "bookverse_refresh_token";
const USER_KEY = "bookverse_auth_user";
const CART_KEY = "bookverse_cart";

export const getStoredToken = (): string | null => localStorage.getItem(TOKEN_KEY);
export const setStoredToken = (token: string): void => localStorage.setItem(TOKEN_KEY, token);
export const removeStoredToken = (): void => {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
};

export const getStoredUser = <T>(): T | null => {
  const data = localStorage.getItem(USER_KEY);
  if (!data) return null;
  try {
    return JSON.parse(data) as T;
  } catch {
    return null;
  }
};

export const setStoredUser = (user: unknown): void => {
  localStorage.setItem(USER_KEY, JSON.stringify(user));
};

export const getStoredCart = <T>(): T[] => {
  const data = localStorage.getItem(CART_KEY);
  if (!data) return [];
  try {
    return JSON.parse(data) as T[];
  } catch {
    return [];
  }
};

export const setStoredCart = (cart: unknown[]): void => {
  localStorage.setItem(CART_KEY, JSON.stringify(cart));
};
