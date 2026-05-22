// src/App.tsx
import type { JSX } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import LandingPage from "./pages/LandingPage";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import AdminPanel from "./pages/AdminPanel";
import { useAuthStore } from "./store/auth";

const App = () => {
  const { token, role } = useAuthStore();

  const Protected = ({ children }: { children: JSX.Element }) => {
    return token ? children : <Navigate to="/login" replace />;
  };

  const AdminOnly = ({ children }: { children: JSX.Element }) => {
    return token && role === "ADMIN" ? children : <Navigate to="/" replace />;
  };

  return (
    <>
      <Toaster position="top-right" />
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route
          path="/dashboard"
          element={
            <Protected>
              <Dashboard />
            </Protected>
          }
        />
        <Route
          path="/admin"
          element={
            <AdminOnly>
              <AdminPanel />
            </AdminOnly>
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  );
};

export default App;
