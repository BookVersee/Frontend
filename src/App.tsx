import React, { useState } from "react";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import { CartProvider } from "./contexts/CartContext";
import { Header } from "./components/common/Header";
import { Footer } from "./components/common/Footer";
import { AuthModal } from "./components/auth/AuthModal";
import { ProtectedRoute } from "./components/auth/ProtectedRoute";
import { Book, Order, CustomerPage } from "./types";
import { ChatDrawer } from "./components/chat/ChatDrawer";

// Customer Pages
import { HomePage } from "./pages/customer/HomePage";
import { BookDetailPage } from "./pages/customer/BookDetailPage";
import { CartPage } from "./pages/customer/CartPage";
import { CheckoutPage } from "./pages/customer/CheckoutPage";
import { MyOrdersPage } from "./pages/customer/MyOrdersPage";
import { OrderDetailPage } from "./pages/customer/OrderDetailPage";
import { ProfilePage } from "./pages/customer/ProfilePage";
import { ShopProfilePage } from "./pages/customer/ShopProfilePage";
import { PaymentResultPage } from "./pages/customer/PaymentResultPage";

// Other Roles
import { ShopDashboardPage } from "./pages/shop/ShopDashboardPage";
import { AdminDashboardPage } from "./pages/admin/AdminDashboardPage";
import { DeliverDashboardPage } from "./pages/deliver/DeliverDashboardPage";

const AppContent: React.FC = () => {
  const { role } = useAuth();
  const isPaymentCallback =
    window.location.search.includes("vnp_ResponseCode") ||
    window.location.search.includes("resultCode") ||
    window.location.search.includes("partnerCode") ||
    window.location.search.includes("orderId") ||
    window.location.pathname.includes("payment-result");
  const [customerPage, setCustomerPage] = useState<CustomerPage>(
    isPaymentCallback ? "paymentResult" : "home"
  );
  const [selectedBook, setSelectedBook] = useState<Book | null>(null);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [selectedShopId, setSelectedShopId] = useState<number>(1);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [chatDrawerOpen, setChatDrawerOpen] = useState(false);

  return (
    <div className="min-h-screen flex flex-col bg-slate-100/70 text-slate-900 selection:bg-blue-600 selection:text-white">
      {/* Header */}
      <Header
        customerPage={customerPage}
        setCustomerPage={setCustomerPage}
        onOpenAuth={() => setAuthModalOpen(true)}
        onOpenChat={() => setChatDrawerOpen(true)}
      />

      {/* Main Role Content */}
      <main className="flex-1">
        {/* CUSTOMER VIEWS */}
        {role === "customer" && customerPage === "paymentResult" && (
          <PaymentResultPage
            onViewOrders={() => {
              window.history.replaceState({}, document.title, "/");
              setCustomerPage("orders");
            }}
            onGoHome={() => {
              window.history.replaceState({}, document.title, "/");
              setCustomerPage("home");
            }}
          />
        )}

        {role === "customer" && customerPage === "home" && (
          <HomePage
            onSelectBook={(book) => {
              setSelectedBook(book);
              setCustomerPage("book");
            }}
            onGoToCart={() => setCustomerPage("cart")}
            onSelectShop={(shopId) => {
              setSelectedShopId(shopId);
              setCustomerPage("shopProfile");
            }}
          />
        )}

        {role === "customer" && customerPage === "book" && (
          selectedBook ? (
            <BookDetailPage
              book={selectedBook}
              onBack={() => setCustomerPage("home")}
              onSelectShop={(shopId) => {
                setSelectedShopId(shopId);
                setCustomerPage("shopProfile");
              }}
            />
          ) : (
            <HomePage
              onSelectBook={(book) => {
                setSelectedBook(book);
                setCustomerPage("book");
              }}
              onGoToCart={() => setCustomerPage("cart")}
              onSelectShop={(shopId) => {
                setSelectedShopId(shopId);
                setCustomerPage("shopProfile");
              }}
            />
          )
        )}

        {role === "customer" && customerPage === "shopProfile" && (
          <ShopProfilePage
            shopId={selectedShopId}
            onBack={() => setCustomerPage("home")}
            onSelectBook={(book) => {
              setSelectedBook(book);
              setCustomerPage("book");
            }}
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

        {role === "customer" && customerPage === "orderDetail" && (
          selectedOrder ? (
            <OrderDetailPage
              order={selectedOrder}
              onBack={() => setCustomerPage("orders")}
            />
          ) : (
            <MyOrdersPage
              onSelectOrder={(order) => {
                setSelectedOrder(order);
                setCustomerPage("orderDetail");
              }}
            />
          )
        )}

        {role === "customer" && customerPage === "profile" && (
          <ProfilePage
            onOpenAuth={() => setAuthModalOpen(true)}
            onGoHome={() => setCustomerPage("home")}
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

      {/* Global Modals & Drawers */}
      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
      />

      <ChatDrawer
        isOpen={chatDrawerOpen}
        onClose={() => setChatDrawerOpen(false)}
        shopId={selectedShopId}
        onSelectBook={(book) => {
          setSelectedBook(book);
          setCustomerPage("book");
          setChatDrawerOpen(false);
        }}
      />

      {role !== "shop" && <Footer />}
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
