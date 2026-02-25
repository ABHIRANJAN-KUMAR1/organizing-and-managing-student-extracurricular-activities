import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/context/AuthContext";
import { ActivityProvider } from "@/context/ActivityContext";
import { ThemeProvider } from "@/context/ThemeContext";
import { NotificationProvider } from "@/context/NotificationContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { useAuth } from "@/context/AuthContext";

// Pages
import Index from "./pages/Index";
import Login from "./pages/Login";
import Register from "./pages/Register";
import AdminDashboard from "./pages/AdminDashboard";
import StudentDashboard from "./pages/StudentDashboard";
import Activities from "./pages/Activities";
import ActivityDetail from "./pages/ActivityDetail";
import ActivityForm from "./pages/ActivityForm";
import MyActivities from "./pages/MyActivities";
import Settings from "./pages/Settings";
import Students from "./pages/Students";
import AdminRedirect from "./pages/AdminRedirect";
import NotFound from "./pages/NotFound";
import PasswordReset from "./pages/PasswordReset";
import NewPassword from "./pages/NewPassword";
import EmailVerify from "./pages/EmailVerify";
import CategoryManagement from "./pages/CategoryManagement";
import Profile from "./pages/Profile";
import Analytics from "./pages/Analytics";

// Helper component to route to appropriate dashboard
const DashboardRouter = () => {
  const { user } = useAuth();

  if (user?.role === "admin") {
    return <AdminDashboard />;
  }

  return <StudentDashboard />;
};

const queryClient = new QueryClient();

const AppRoutes = () => (
  <Routes>
    {/* Public Routes */}
    <Route path="/" element={<Index />} />
    <Route path="/login" element={<Login />} />
    <Route path="/register" element={<Register />} />
    <Route path="/password-reset" element={<PasswordReset />} />
    <Route path="/new-password" element={<NewPassword />} />
    <Route path="/email-verify" element={<EmailVerify />} />
    <Route path="/categories" element={
      <ProtectedRoute requiredRole="admin">
        <CategoryManagement />
      </ProtectedRoute>
    } />
    <Route path="/profile" element={
      <ProtectedRoute>
        <Profile />
      </ProtectedRoute>
    } />
    <Route path="/analytics" element={
      <ProtectedRoute requiredRole="admin">
        <Analytics />
      </ProtectedRoute>
    } />

    {/* Protected Routes */}
    <Route
      path="/dashboard"
      element={
        <ProtectedRoute>
          <DashboardRouter />
        </ProtectedRoute>
      }
    />
    <Route
      path="/activities"
      element={
        <ProtectedRoute>
          <Activities />
        </ProtectedRoute>
      }
    />
    <Route
      path="/activities/new"
      element={
        <ProtectedRoute requiredRole="admin">
          <ActivityForm />
        </ProtectedRoute>
      }
    />
    <Route
      path="/activities/:id"
      element={
        <ProtectedRoute>
          <ActivityDetail />
        </ProtectedRoute>
      }
    />
    <Route
      path="/activities/:id/edit"
      element={
        <ProtectedRoute requiredRole="admin">
          <ActivityForm />
        </ProtectedRoute>
      }
    />
    <Route
      path="/my-activities"
      element={
        <ProtectedRoute requiredRole="student">
          <MyActivities />
        </ProtectedRoute>
      }
    />
    <Route
      path="/settings"
      element={
        <ProtectedRoute>
          <Settings />
        </ProtectedRoute>
      }
    />
    <Route
      path="/students"
      element={
        <ProtectedRoute requiredRole="admin">
          <Students />
        </ProtectedRoute>
      }
    />
    <Route
      path="/redirect"
      element={
        <ProtectedRoute requiredRole="admin">
          <AdminRedirect />
        </ProtectedRoute>
      }
    />

    {/* Catch all */}
    <Route path="*" element={<NotFound />} />
  </Routes>
);

const App = () => (
  <ThemeProvider>
    <NotificationProvider>
      <AuthProvider>
        <ActivityProvider>
          <QueryClientProvider client={queryClient}>
            <TooltipProvider>
              <Toaster />
              <Sonner />
              <BrowserRouter>
                <AppRoutes />
              </BrowserRouter>
            </TooltipProvider>
          </QueryClientProvider>
        </ActivityProvider>
      </AuthProvider>
    </NotificationProvider>
  </ThemeProvider>
);

export default App;
