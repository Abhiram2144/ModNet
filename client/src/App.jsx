import { BrowserRouter as Router } from "react-router-dom";
import AppRoutes from "./routes/AppRoutes";
import "../src/styles/App.css";
import { useEffect, useState } from "react";
import { supabase } from "./lib/supabaseClient";
import { AuthProvider } from "./contexts/AuthContext";

function App() {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initSession = async () => {
      // check if there's an active session when app loads
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) console.log("No active session");
      setLoading(false);
    };
    initSession();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen text-lg font-semibold">
        Loading ModNet...
      </div>
    );
  }

  return (
    <AuthProvider>
    <Router>
      <div className="min-h-screen bg-gray-50 text-gray-900">
        <AppRoutes />
      </div>
    </Router>
    </AuthProvider>
  );
}

export default App;
