import { useState, useEffect } from "react";
import { supabase } from "../lib/supabaseClient";
import { useNavigate } from "react-router-dom";

const ModulesSelect = () => {
  const [courses, setCourses] = useState([]);
  const [modules, setModules] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState("");
  const [selectedModules, setSelectedModules] = useState([]);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // Fetch available courses on mount
  useEffect(() => {
    const fetchCourses = async () => {
      const { data, error } = await supabase.from("courses").select("*");
      if (error) console.error("Error fetching courses:", error);
      else setCourses(data);
    };
    fetchCourses();
  }, []);

  // Fetch modules when a course is selected
  useEffect(() => {
    const fetchModules = async () => {
      if (!selectedCourse) return;
      const { data, error } = await supabase
        .from("modules")
        .select("*")
        .eq("courseId", selectedCourse); // ✅ matches schema
      if (error) console.error("Error fetching modules:", error);
      else setModules(data);
    };
    fetchModules();
  }, [selectedCourse]);

  const handleSubmit = async () => {
    if (!selectedCourse || selectedModules.length === 0) {
      alert("Please select your course and modules.");
      return;
    }

    setLoading(true);

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      alert("Authentication error. Please log in again.");
      setLoading(false);
      return;
    }

    try {
      // 1️⃣ Update the user's selected course
      const { error: userUpdateError } = await supabase
        .from("users")
        .update({ courseId: selectedCourse })
        .eq("email", user.email); // safer than eq("id") since we control emails

      if (userUpdateError) throw userUpdateError;

      // 2️⃣ Insert each selected module into user_modules table
      const userModulesToInsert = selectedModules.map((modId) => ({
        userId: user.id,
        moduleId: modId,
      }));

      const { error: moduleInsertError } = await supabase
        .from("user_modules")
        .insert(userModulesToInsert);

      if (moduleInsertError) throw moduleInsertError;

      // 3️⃣ Redirect to home
      navigate("/home");
    } catch (err) {
      console.error("Error saving module selections:", err);
      alert("Something went wrong while saving your preferences.");
    }

    setLoading(false);
  };

  const toggleModuleSelection = (modId) => {
    if (selectedModules.includes(modId)) {
      setSelectedModules(selectedModules.filter((id) => id !== modId));
    } else if (selectedModules.length < 4) {
      setSelectedModules([...selectedModules, modId]);
    } else {
      alert("You can select up to 4 modules.");
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 px-4">
      <div className="bg-white w-full max-w-md p-6 rounded-2xl shadow-xl">
        <h1 className="text-2xl font-semibold text-center mb-6">
          Select Your Course & Modules
        </h1>

        {/* Course Dropdown */}
        <label className="block mb-2 font-medium text-gray-600">Course</label>
        <select
          className="w-full border border-gray-300 rounded-lg p-3 mb-4 focus:ring-2 focus:ring-blue-500"
          value={selectedCourse}
          onChange={(e) => setSelectedCourse(e.target.value)}
        >
          <option value="">Select a course</option>
          {courses.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>

        {/* Modules Selection */}
        {modules.length > 0 && (
          <>
            <label className="block mb-2 font-medium text-gray-600">
              Modules (Select up to 4)
            </label>
            <div className="grid grid-cols-2 gap-2 mb-4">
              {modules.map((m) => (
                <button
                  key={m.id}
                  onClick={() => toggleModuleSelection(m.id)}
                  className={`border rounded-lg py-2 text-sm transition-all ${
                    selectedModules.includes(m.id)
                      ? "bg-blue-600 text-white border-blue-600"
                      : "bg-gray-100 hover:bg-gray-200"
                  }`}
                >
                  {m.name}
                </button>
              ))}
            </div>
          </>
        )}

        <button
          onClick={handleSubmit}
          disabled={loading}
          className={`w-full py-3 rounded-lg text-white font-medium ${
            loading
              ? "bg-gray-400 cursor-not-allowed"
              : "bg-blue-600 hover:bg-blue-700"
          } transition`}
        >
          {loading ? "Saving..." : "Continue to App"}
        </button>
      </div>
    </div>
  );
};

export default ModulesSelect;
