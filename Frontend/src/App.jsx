import React, { useState } from 'react';
import { AppProvider, useApp } from './context';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import Auth from './views/Auth';
import Home from './views/customer/Home';
import BookDetail from './views/customer/BookDetail';
import Cart from './views/customer/Cart';
import CustomerOrders from './views/customer/Orders';
import Profile from './views/customer/Profile';
import ShopProfile from './views/customer/ShopProfile';
import ShopDashboard from './views/shop/ShopDashboard';
import AdminDashboard from './views/admin/AdminDashboard';

function AppContent() {
  const { page, currentUser } = useApp();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('');

  const renderPage = () => {
    // Auth page
    if (page === 'auth') return <Auth />;

    // Customer Views
    if (page === 'home') {
      return (
        <Home
          search={searchQuery}
          activeCategory={activeCategory}
        />
      );
    }
    if (page === 'book-detail') return <BookDetail />;
    if (page === 'shop-profile') return <ShopProfile />;

    // Authenticated Customer Views
    if (page === 'cart') {
      if (!currentUser) return <Auth />;
      return <Cart />;
    }
    if (page === 'customer-orders') {
      if (!currentUser) return <Auth />;
      return <CustomerOrders />;
    }
    if (page === 'profile') {
      if (!currentUser) return <Auth />;
      return <Profile />;
    }

    // Shop Dashboard Views
    if (page === 'shop-books') return <ShopDashboard tab="books" />;
    if (page === 'shop-orders') return <ShopDashboard tab="orders" />;
    if (page === 'shop-feedbacks') return <ShopDashboard tab="feedbacks" />;
    if (page === 'shop-revenue') return <ShopDashboard tab="revenue" />;
    if (page === 'shop-settings') return <ShopDashboard tab="settings" />;

    // Admin Dashboard Views
    if (page === 'admin-users') return <AdminDashboard tab="users" />;
    if (page === 'admin-shops') return <AdminDashboard tab="shops" />;
    if (page === 'admin-disputes') return <AdminDashboard tab="disputes" />;

    // Default Fallback
    return <Home search={searchQuery} activeCategory={activeCategory} />;
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#faf6f1] text-[#1c1612]">
      <Navbar
        searchValue={searchQuery}
        onSearch={(query) => setSearchQuery(query)}
        activeCategory={activeCategory}
        onSelectCategory={(cat) => {
          if (activeCategory === cat) {
            setActiveCategory('');
          } else {
            setActiveCategory(cat);
          }
        }}
      />
      <main className="flex-1">
        {renderPage()}
      </main>
      <Footer />
    </div>
  );
}

export default function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}
