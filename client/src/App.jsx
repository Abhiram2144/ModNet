import { BrowserRouter as Router, useLocation } from "react-router-dom";
import AppRoutes from "./routes/AppRoutes";
import "../src/styles/index.css";
import { useEffect, useState } from "react";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
// import Navbar from "./components/Navbar";
// import Footer from "./components/Footer";
import Loader from "./components/Loader";

function App() {
  return (
    <AuthProvider>
      <Router>
        <MainLayout />
      </Router>
    </AuthProvider>
  );
}

function MainLayout() {
  const location = useLocation();
  const { user } = useAuth();
  // Show the global Loader only when AuthContext is actively preloading data for the session.
  // This prevents the Loader from flashing on every route change.
  const { preloading } = useAuth();

  if (preloading) return <Loader />;

  return (
    <div className="flex min-h-screen flex-col bg-[#F2EFE8] text-gray-900">
      {/* {showNavbar && <Navbar />} */}
      <main className="flex-grow">
        {/* Add padding to avoid navbar overlap */}
        <AppRoutes />
      </main>
      {/* {showFooter && <Footer />} */}
    </div>
  );
}

export default App;
