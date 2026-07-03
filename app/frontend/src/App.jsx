import React, { Suspense } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { QueryClientProvider, QueryClient } from "@tanstack/react-query";
import { Toaster } from "sonner";
import { AuthProvider, useAuth } from "@/auth";
import { I18nProvider } from "@/i18n";

// Layout
import Layout from "@/components/Layout";

// Pages
import Home from "@/pages/Home";
import Login from "@/pages/Login";
import Dashboard from "@/pages/Dashboard";
import Services from "@/pages/Services";
import ServiceDetail from "@/pages/ServiceDetail";
import ApplyService from "@/pages/ApplyService";
import Complaint from "@/pages/Complaint";
import RTI from "@/pages/RTI";
import Schemes from "@/pages/Schemes";
import Payments from "@/pages/Payments";
import Track from "@/pages/Track";
import Admin from "@/pages/Admin";
import Assistant from "@/pages/Assistant";

// Loading fallback
const LoadingPage = () => (
  <div className="flex items-center justify-center min-h-screen">
    <div className="text-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
      <p className="text-slate-600">Loading...</p>
    </div>
  </div>
);

// Protected route component
const ProtectedRoute = ({ children }) => {
  const { token } = useAuth();
  return token ? children : <Navigate to="/login" replace />;
};

// Admin-only route
const AdminRoute = ({ children }) => {
  const { token, user } = useAuth();
  if (!token) return <Navigate to="/login" replace />;
  if (user?.role !== "admin") return <Navigate to="/dashboard" replace />;
  return children;
};

// Query client setup
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60_000,
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

function AppContent() {
  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/login" element={<Login />} />
      <Route path="/" element={<Layout><Home /></Layout>} />
      <Route path="/services" element={<Layout><Services /></Layout>} />
      <Route path="/services/:slug" element={<Layout><ServiceDetail /></Layout>} />
      <Route path="/schemes" element={<Layout><Schemes /></Layout>} />
      <Route path="/track" element={<Layout><Track /></Layout>} />

      {/* Protected Routes */}
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <Layout><Dashboard /></Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/apply/:slug"
        element={
          <ProtectedRoute>
            <Layout><ApplyService /></Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/complaints"
        element={
          <ProtectedRoute>
            <Layout><Complaint /></Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/rti"
        element={
          <ProtectedRoute>
            <Layout><RTI /></Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/payments"
        element={
          <ProtectedRoute>
            <Layout><Payments /></Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/assistant"
        element={
          <ProtectedRoute>
            <Layout><Assistant /></Layout>
          </ProtectedRoute>
        }
      />

      {/* Admin Routes */}
      <Route
        path="/admin"
        element={
          <AdminRoute>
            <Layout><Admin /></Layout>
          </AdminRoute>
        }
      />

      {/* Catch all - redirect to home */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <I18nProvider>
      <Router>
        <AuthProvider>
          <QueryClientProvider client={queryClient}>
            <Suspense fallback={<LoadingPage />}>
              <AppContent />
              <Toaster position="top-center" richColors />
            </Suspense>
          </QueryClientProvider>
        </AuthProvider>
      </Router>
    </I18nProvider>
  );
}
