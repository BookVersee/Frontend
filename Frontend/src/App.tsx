import React, { useState } from "react";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import { CartProvider } from "./contexts/CartContext";
import { Header } from "./components/common/Header";
import { Footer } from "./components/common/Footer";
import { AuthModal } from "./components/auth/AuthModal";
import { ProtectedRoute } from "./components/auth/ProtectedRoute";
import { Book, Order, CustomerPage } from "./types";

// Customer Pages
import { HomePage } from "./pages/customer/HomePage";
import { BookDetailPage } from "./pages/customer/BookDetailPage";
import { CartPage } from "./pages/customer/CartPage";
import { CheckoutPage } from "./pages/customer/CheckoutPage";
import { MyOrdersPage } from "./pages/customer/MyOrdersPage";
import { OrderDetailPage } from "./pages/customer/OrderDetailPage";

// Other Roles
import { ShopDashboardPage } from "./pages/shop/ShopDashboardPage";
import { AdminDashboardPage } from "./pages/admin/AdminDashboardPage";
import { DeliverDashboardPage } from "./pages/deliver/DeliverDashboardPage";

const AppContent: React.FC = () => {
  const { role } = useAuth();
  const [customerPage, setCustomerPage] = useState<CustomerPage>("home");
  const [selectedBook, setSelectedBook] = useState<Book | null>(null);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [authModalOpen, setAuthModalOpen] = useState(false);

  return (
    <div className="min-h-screen flex flex-col bg-slate-100/70 text-slate-900 selection:bg-blue-600 selection:text-white">
      {/* Header */}
      <Header
        customerPage={customerPage}
        setCustomerPage={setCustomerPage}
        onOpenAuth={() => setAuthModalOpen(true)}
      />

      {/* Main Role Content */}
      <main className="flex-1">
        {/* CUSTOMER VIEWS */}
        {role === "customer" && customerPage === "home" && (
          <HomePage
            onSelectBook={(book) => {
              setSelectedBook(book);
              setCustomerPage("book");
            }}
            onGoToCart={() => setCustomerPage("cart")}
          />
        )}

        {role === "customer" && customerPage === "book" && selectedBook && (
          <BookDetailPage
            book={selectedBook}
            onBack={() => setCustomerPage("home")}
          />
        )}

        {role === "customer" && customerPage === "cart" && (
          <CartPage
            onBack={() => setCustomerPage("home")}
            onCheckout={() => setCustomerPage("checkout")}
          />
        )}

        {role === "customer" && customerPage === "checkout" && (
          <CheckoutPage
            onBack={() => setCustomerPage("cart")}
            onSuccess={() => setCustomerPage("orders")}
          />
        )}

        {role === "customer" && customerPage === "orders" && (
          <MyOrdersPage
            onSelectOrder={(order) => {
              setSelectedOrder(order);
              setCustomerPage("orderDetail");
            }}
          />
        )}

        {role === "customer" && customerPage === "orderDetail" && selectedOrder && (
          <OrderDetailPage
            order={selectedOrder}
            onBack={() => setCustomerPage("orders")}
          />
        )}

        {/* SHOP VIEW */}
        {role === "shop" && (
          <ProtectedRoute
            allowedRoles={["shop"]}
            onOpenAuth={() => setAuthModalOpen(true)}
          >
            <ShopDashboardPage />
          </ProtectedRoute>
        )}

        {/* ADMIN VIEW */}
        {role === "admin" && (
          <ProtectedRoute
            allowedRoles={["admin"]}
            onOpenAuth={() => setAuthModalOpen(true)}
          >
            <AdminDashboardPage />
          </ProtectedRoute>
        )}

        {/* DELIVER VIEW */}
        {role === "deliver" && (
          <ProtectedRoute
            allowedRoles={["deliver"]}
            onOpenAuth={() => setAuthModalOpen(true)}
          >
            <DeliverDashboardPage />
          </ProtectedRoute>
        )}
      </main>

      {/* Global Modals & Footer */}
      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
      />

      <Footer />
    </div>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <CartProvider>
        <AppContent />
      </CartProvider>
    </AuthProvider>
  );
}
