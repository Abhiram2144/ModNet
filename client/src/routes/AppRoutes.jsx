import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { Suspense, lazy } from "react";
import { useAuth } from "../contexts/AuthContext";

// 🧩 Lazy load all pages for performance
const Login = lazy(() => import("../pages/Login"));
const ModuleSelect = lazy(() => import("../pages/ModuleSelect"));
const Home = lazy(() => import("../pages/Home"));
const Discover = lazy(() => import("../pages/Discover"));
const Chat = lazy(() => import("../pages/ModuleChat"));
const NotFound = lazy(() => import("../pages/NotFound"));
const LandingPage = lazy(() => import("../pages/LandingPage"));
const Account = lazy(() => import("../pages/Account"));
const Review = lazy(() => import("../pages/Review"));
const GroupChat = lazy(() => import("../pages/GroupChat"));
const AdminLogin = lazy(() => import("../pages/AdminLogin"));
const Dashboard = lazy(() => import("../pages/Dashboard"));
// const SignUp = lazy(()=> import("../pages/SignUp"))

// 🔐 Protected route wrapper
const ProtectedRoute = ({ children }) => {
  const { user } = useAuth();
  return user ? children : <Navigate to="/login" />;
};

// 🚀 Main router
export default function AppRoutes() {
  return (
    <Suspense
      fallback={
        <div className="flex h-screen items-center justify-center">
          Loading...
        </div>
      }
    >
      <Routes>
        {/* Public Routes */}
        <Route path="/login" element={<Login />} />
        <Route path="/admin/login" element={<AdminLogin />} />
        {/* <Route path = "/signup" element = {<SignUp/>} /> */}

        {/* Admin Routes */}
        <Route path="/dashboard" element={<Dashboard />} />

        {/* Protected Routes */}
        <Route
          path="/modules"
          element={
            <ProtectedRoute>
              <ModuleSelect />
            </ProtectedRoute>
          }
        />

        <Route
          path="/account"
          element={
            <ProtectedRoute>
              <Account />
            </ProtectedRoute>
          }
        />

        <Route
          path="/review"
          element={
            <ProtectedRoute>
              <Review />
            </ProtectedRoute>
          }
        />

        <Route
          path="/discover"
          element={
            <ProtectedRoute>
              <Discover />
            </ProtectedRoute>
          }
        />

        <Route
          path="/home"
          element={
            <ProtectedRoute>
              <Home />
            </ProtectedRoute>
          }
        />

        <Route
          path="/discover/chat/:key"
          element={
            <ProtectedRoute>
              <GroupChat />
            </ProtectedRoute>
          }
        />

        <Route path="/" element={<LandingPage />} />

        <Route
          path="/chat/:moduleId"
          element={
            <ProtectedRoute>
              <Chat />
            </ProtectedRoute>
          }
        />

        {/* Catch-all */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Suspense>
  );
}
