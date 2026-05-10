import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import ClientLayout from "./layouts/ClientLayout";
import AdminLayout from "./layouts/AdminLayout";
import { Toaster } from "react-hot-toast";
import { useEffect } from "react";
import { useSettingStore } from "./store/useSettingStore";

// Client pages
import HomePage from "./pages/client/HomePage";
import ShopPage from "./pages/client/ShopPage";
import ProductDetailPage from "./pages/client/ProductDetailPage";
import CartPage from "./pages/client/CartPage";
import CheckoutPage from "./pages/client/CheckoutPage";
import LoginPage from "./pages/client/LoginPage";
import RegisterPage from "./pages/client/RegisterPage";
import MyOrdersPage from "./pages/client/MyOrdersPage";
import ProfilePage from "./pages/client/ProfilePage";

// Admin pages
import DashboardPage from "./pages/admin/DashboardPage";
import ProductsPage from "./pages/admin/ProductsPage";
import OrdersAdminPage from "./pages/admin/OrdersAdminPage";
import UsersPage from "./pages/admin/UsersPage";
import SettingsPage from "./pages/admin/SettingsPage";

// Utility pages
import NotFoundPage from "./pages/NotFoundPage";

export default function App() {
  const { fetchSettings } = useSettingStore();
  
  useEffect(() => {
    fetchSettings();
  }, []);

  return (
    <BrowserRouter>
      <Routes>
        {/* ══ CLIENT ROUTES ══ */}
        <Route element={<ClientLayout />}>
          <Route index element={<HomePage />} />
          <Route path="shop" element={<ShopPage />} />
          <Route path="products/:id" element={<ProductDetailPage />} />
          <Route path="cart" element={<CartPage />} />
          <Route path="checkout" element={<CheckoutPage />} />
          <Route path="login" element={<LoginPage />} />
          <Route path="register" element={<RegisterPage />} />
          <Route path="orders" element={<MyOrdersPage />} />
          <Route path="profile" element={<ProfilePage />} />

          {/* 404 within client layout */}
          <Route path="*" element={<NotFoundPage />} />
        </Route>

        {/* ══ ADMIN ROUTES (Protected — xem AdminLayout) ══ */}
        <Route path="admin" element={<AdminLayout />}>
          <Route index element={<DashboardPage />} />
          <Route path="products" element={<ProductsPage />} />
          <Route path="orders" element={<OrdersAdminPage />} />
          <Route path="users" element={<UsersPage />} />
          <Route path="settings" element={<SettingsPage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Route>
      </Routes>
      <Toaster 
        position="bottom-right" 
        toastOptions={{
          duration: 3000,
          style: {
            background: '#333',
            color: '#fff',
            borderRadius: '8px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
          },
        }} 
      />
    </BrowserRouter>
  );
}
