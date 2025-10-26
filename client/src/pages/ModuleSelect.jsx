import { useState, useEffect } from "react";
import { supabase } from "../lib/supabaseClient";
import { useNavigate } from "react-router-dom";
import { X } from "lucide-react";

const ModulesSelect = () => {
  const [courses, setCourses] = useState([]);
  const [modules, setModules] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState("");
  const [selectedModules, setSelectedModules] = useState([]);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchCourses = async () => {
      const { data, error } = await supabase.from("courses").select("*");
      if (error) console.error("Error fetching courses:", error);
      else setCourses(data);
    };
    fetchCourses();
  }, []);

  useEffect(() => {
    const fetchModules = async () => {
      if (!selectedCourse) {
        setModules([]);
        setSelectedModules([]);
        return;
      }

      const { data, error } = await supabase
        .from("modules")
        .select("*")
        .eq("course_id", selectedCourse);

      if (error) console.error("Error fetching modules:", error);
      else setModules(data);
    };
    fetchModules();
  }, [selectedCourse]);

  const handleModuleSelect = (event) => {
    const moduleid = event.target.value;
    if (!moduleid) return;

    // convert to number for type consistency
    const modIdNum = Number(moduleid);

    if (selectedModules.includes(modIdNum)) return;
    if (selectedModules.length >= 4) {
      alert("You can select up to 4 modules only.");
      return;
    }

    setSelectedModules([...selectedModules, modIdNum]);
  };

  const handleRemoveModule = (moduleid) => {
    setSelectedModules(selectedModules.filter((id) => id !== moduleid));
  };

  const handleSubmit = async () => {
  if (!selectedCourse || selectedModules.length === 0) {
    alert("Please select a course and at least one module.");
    return;
  }

  setLoading(true);

  try {
    // Step 1: Get logged-in Supabase Auth user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      throw new Error("Authentication error. Please log in again.");
    }

    // Step 2: Find user in the `students` table via Supabase auth user id
    // (your students table stores the auth userid in the `userid` column per AuthContext)
    const { data: userRecord, error: userFetchError } = await supabase
      .from("students")
      .select("id")
      .eq("userid", user.id)
      .maybeSingle();

    if (userFetchError) {
      throw userFetchError;
    }

    if (!userRecord) {
      throw new Error("User record not found in the students table. Please complete your profile.");
    }

    // Step 3: Update selected course
    const { error: updateError } = await supabase
      .from("students")
      .update({
        courseid: selectedCourse,
      })
      .eq("id", userRecord.id);

    if (updateError) throw updateError;

    // Step 4: Insert user_modules entries
    const userModules = selectedModules.map((modId) => ({
      userid: userRecord.id, // int8 id from your user table
      moduleid: modId,
    }));

    const { error: insertError } = await supabase
      .from("user_modules")
      .insert(userModules);

    if (insertError) throw insertError;

    alert("✅ Modules saved successfully!");
    navigate("/home");
  } catch (err) {
    console.error("❌ Error saving module selections:", err);
    alert(`Something went wrong while saving your preferences: ${err.message}`);
  } finally {
    setLoading(false);
  }
};



  return (
    <div className="min-h-screen flex items-center justify-center bg-black text-white px-4">
      <div className="bg-neutral-900 w-full max-w-sm p-8 rounded-2xl shadow-md border border-gray-700">
        <h1 className="text-2xl font-serif font-semibold text-center mb-6">
          Select Your Course & Modules
        </h1>

        {/* Course Dropdown */}
        <div className="mb-5">
          <label className="block text-sm font-medium mb-1">Course</label>
          <select
            className="w-full bg-neutral-800 border border-gray-600 rounded-md p-2 text-sm focus:outline-none focus:ring-1 focus:ring-gray-400"
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
        </div>

        {/* Modules Dropdown */}
        {modules.length > 0 && (
          <div className="mb-5">
            <label className="block text-sm font-medium mb-1">
              Modules (Select up to 4)
            </label>
            <select
              className="w-full bg-neutral-800 border border-gray-600 rounded-md p-2 text-sm focus:outline-none focus:ring-1 focus:ring-gray-400"
              onChange={handleModuleSelect}
              value=""
            >
              <option value="">Select a module</option>
              {modules.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name}
                </option>
              ))}
            </select>

            {/* Selected Modules */}
            <div className="flex flex-wrap gap-2 mt-3">
              {selectedModules.map((modId) => {
                const mod = modules.find((m) => m.id === modId);
                return (
                  <div
                    key={modId}
                    className="flex items-center bg-gray-700 text-white px-3 py-1 rounded-full text-xs"
                  >
                    <span>{mod?.name || "Unknown module"}</span>
                    <button
                      type="button"
                      className="ml-2 hover:text-red-400"
                      onClick={() => handleRemoveModule(modId)}
                    >
                      <X size={14} />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        <p className="text-xs text-center text-red-400 mb-4">
          You can’t change these later *
        </p>

        <button
          onClick={handleSubmit}
          disabled={loading}
          className={`w-full py-2 rounded-md text-white text-sm font-medium transition-all ${
            loading
              ? "bg-gray-600 cursor-not-allowed"
              : "bg-gray-200 text-black hover:bg-white"
          }`}
        >
          {loading ? "Saving..." : "Submit"}
        </button>
      </div>
    </div>
  );
};

export default ModulesSelect;
