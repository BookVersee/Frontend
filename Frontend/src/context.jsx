import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { getCart, loginUser } from './store';

const AppContext = createContext({});

export const useApp = () => useContext(AppContext);

export function AppProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(() => {
    try {
      const stored = localStorage.getItem('bookverse_user');
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });

  const [cart, setCartState] = useState(() => {
    try {
      const stored = localStorage.getItem('bookverse_user');
      const user = stored ? JSON.parse(stored) : null;
      return user ? getCart(user.user_id) : [];
    } catch {
      return [];
    }
  });

  const [page, setPage] = useState('home');
  const [pageParams, setPageParams] = useState({});
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    if (currentUser) {
      localStorage.setItem('bookverse_user', JSON.stringify(currentUser));
      setCartState(getCart(currentUser.user_id));
    } else {
      localStorage.removeItem('bookverse_user');
    }
  }, [currentUser, refreshKey]);

  const login = useCallback((user) => {
    setCurrentUser(user);
    setCartState(getCart(user.user_id));
    if (user.role === 'ADMIN') {
      setPage('admin-users');
    } else if (user.role === 'SHOP') {
      setPage('shop-books');
    } else {
      setPage('home');
    }
  }, []);

  const logout = useCallback(() => {
    setCurrentUser(null);
    setCartState([]);
    setPage('home');
    setPageParams({});
  }, []);

  const navigate = useCallback((p, params = {}) => {
    setPage(p);
    setPageParams(params);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const refresh = useCallback(() => setRefreshKey((k) => k + 1), []);

  const setCart = useCallback((c) => setCartState(c), []);

  return (
    <AppContext.Provider
      value={{
        currentUser,
        cart,
        page,
        pageParams,
        refreshKey,
        login,
        logout,
        navigate,
        refresh,
        setCart,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}
