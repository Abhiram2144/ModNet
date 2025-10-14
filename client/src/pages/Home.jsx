import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabaseClient";
import { useAuth } from "../contexts/AuthContext";
import { Loader2, MessageSquare, LogOut } from "lucide-react";

export default function Home() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [modules, setModules] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      navigate("/login");
      return;
    }

    const fetchModules = async () => {
      try {
        // 1️⃣ Get the student's internal record (linked by auth user id)
        const { data: studentData, error: studentError } = await supabase
          .from("students")
          .select("id")
          .eq("userid", user.id)
          .maybeSingle();
        console.log(user.id);
        if (studentError) throw studentError;
        if (!studentData) throw new Error("Student record not found.");

        // 2️⃣ Fetch modules joined via user_modules (linked to students.id)
        const { data: userModules, error: modError } = await supabase
          .from("user_modules")
          .select(`
            moduleid,
            modules:moduleid (
              id,
              name,
              code,
              description
            )
          `)
          .eq("userid", studentData.id);

        if (modError) throw modError;

        const formattedModules =
          userModules?.map((u) => u.modules).filter(Boolean) || [];

        setModules(formattedModules);
      } catch (err) {
        console.error("❌ Error fetching modules:", err.message);
        setModules([]);
      } finally {
        setLoading(false);
      }
    };

    fetchModules();
  }, [user, navigate]);

  const handleModuleClick = (moduleId) => {
    navigate(`/chat/${moduleId}`);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/login");
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen text-gray-400">
        <Loader2 className="animate-spin w-6 h-6 mr-2" />
        Loading modules...
      </div>
    );
  }

  if (modules.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-black text-white px-6">
        <h2 className="text-2xl font-semibold mb-3">No Modules Found</h2>
        <p className="text-gray-400 text-center max-w-sm mb-6">
          You haven’t selected any modules yet. Add some to start discussions!
        </p>
        <button
          onClick={() => navigate("/modules")}
          className="bg-white text-black px-6 py-2 rounded-xl font-semibold hover:bg-gray-200 transition-all"
        >
          Add Modules
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white flex flex-col">
      <div className="flex justify-between items-center px-4 py-3 border-b border-gray-800">
        <h1 className="text-xl font-bold">My Modules</h1>
        <button
          onClick={handleLogout}
          className="text-gray-400 hover:text-white transition-all"
        >
          <LogOut size={20} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto">
        {modules.map((mod) => (
          <div
            key={mod.id}
            onClick={() => handleModuleClick(mod.id)}
            className="flex items-center justify-between px-4 py-3 border-b border-gray-900 hover:bg-neutral-900 cursor-pointer transition-all"
          >
            <div>
              <h3 className="font-semibold text-lg">{mod.name}</h3>
              <p className="text-gray-400 text-sm">{mod.code}</p>
              {mod.description && (
                <p className="text-gray-500 text-xs mt-1 line-clamp-1">
                  {mod.description}
                </p>
              )}
            </div>
            <MessageSquare size={18} className="text-gray-400" />
          </div>
        ))}
      </div>
    </div>
  );
}
