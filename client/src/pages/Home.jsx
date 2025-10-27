import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabaseClient";
import { useAuth } from "../contexts/AuthContext";
import { Loader2, MessageCircle } from "lucide-react";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import ModuleContainer from "../components/ModuleContainer";
export default function Home() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [modules, setModules] = useState([]);
  const { userModules } = useAuth();
  // initialize loading to false if modules were preloaded in AuthContext
  const [loading, setLoading] = useState(!userModules);
  const username = user.email.split("@")[0]
  useEffect(() => {
    if (!user) {
      navigate("/login");
      return;
    }

    // If we already preloaded user modules in AuthContext, use them
    if (userModules) {
      setModules(userModules);
      setLoading(false);
      return;
    }

    const fetchModules = async () => {
      try {
        const { data: studentData, error: studentError } = await supabase
          .from("students")
          .select("id")
          .eq("userid", user.id)
          .maybeSingle();

        if (studentError) throw studentError;
        if (!studentData) throw new Error("Student record not found.");

        const { data: userModulesResp, error: modError } = await supabase
          .from("user_modules")
          .select(
            `
            moduleid,
            modules:moduleid (
              id,
              name,
              code
            )
          `
          )
          .eq("userid", studentData.id);

        if (modError) throw modError;
        const formattedModules = userModulesResp?.map((u) => u.modules) || [];
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

  // const handleModuleClick = (moduleId) => navigate(`/chat/${moduleId}`);
  
    
  if (loading)
    return (
      <div className="flex items-center justify-center h-screen text-gray-500 ">
        <Loader2 className="animate-spin w-6 h-6 mr-2" />
        Loading modules...
      </div>
    );

  if (modules.length === 0)
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-[#F2EFE8] text-black px-6 ">
        <h2 className="text-2xl font-semibold mb-3">No Modules Found</h2>
        <p className="text-gray-600 text-center max-w-sm mb-6">
          You haven't selected any modules yet. Add some to start discussions!
        </p>
        <button
          onClick={() => navigate("/modules")}
          className="bg-[#6B4F4F] text-white px-6 py-2 rounded-xl font-medium hover:bg-[#553b3b] transition-all"
        >
          Add Modules
        </button>
      </div>
    );

  return (
    <div className="font-inter">
      <Navbar />
      <div className="min-h-screen bg-[#F2EFE8] text-black  flex flex-col pt-16 pb-20 px-4">
        <div className="max-w-md mx-auto w-full flex flex-col items-center">
          <h1 className="text-2xl font-semibold mb-6">Welcome <span className="font-bold text-yellow-500">{username}</span></h1>
          {/* MVP notice */}
          <div className="w-full mb-4">
            <div
              role="status"
              className="bg-yellow-50 border-l-4 border-yellow-400 text-yellow-800 px-4 py-3 rounded-md text-sm"
            >
              <strong className="font-semibold">MVP v1</strong>
              <span className="ml-2">— You're using the first version of ModNet. Expect small issues and frequent updates. Share feedback via Account → Review.</span>
            </div>
          </div>

          {/* Dynamic Module Grid */}
          <ModuleContainer modules={modules} />
        </div>
      </div>
      <Footer />
    </div>
  );
}
