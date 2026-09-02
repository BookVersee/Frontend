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
    const parsed = JSON.parse(data);
    if (parsed && typeof parsed === "object") {
      return parsed as T;
    }
    return null;
  } catch {
    return null;
  }
};

export const setStoredUser = (user: unknown): void => {
  if (user) {
    localStorage.setItem(USER_KEY, JSON.stringify(user));
  } else {
    localStorage.removeItem(USER_KEY);
  }
};

export const getStoredCart = <T>(): T[] => {
  const data = localStorage.getItem(CART_KEY);
  if (!data) return [];
  try {
    const parsed = JSON.parse(data);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((item: any) => item && typeof item === "object" && item.book) as T[];
  } catch {
    return [];
  }
};

export const setStoredCart = (cart: unknown[]): void => {
  if (Array.isArray(cart)) {
    localStorage.setItem(CART_KEY, JSON.stringify(cart));
  } else {
    localStorage.removeItem(CART_KEY);
  }
};
