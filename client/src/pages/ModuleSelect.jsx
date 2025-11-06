import { useState, useEffect } from "react";
import { supabase } from "../lib/supabaseClient";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { X } from "lucide-react";

const ModulesSelect = () => {
  const [courses, setCourses] = useState([]);
  const [modules, setModules] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState("");
  const [selectedModules, setSelectedModules] = useState([]);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { setUserModules, setProfile } = useAuth();

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
    if (!selectedCourse || selectedModules.length !== 4) {
      alert("Please select a course and exactly four modules.");
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

      // Step 2: Find or create the student record
      // Preferred lookup: students.userid (auth user id). Some onboarding flows create a stub
      // student row earlier (by email) and may not have set userid yet. Handle both cases:
      //  - try by userid
      //  - if not found, try by email and attach userid to that row
      //  - if still not found, create a new students row with userid+email
      let userRecord = null;

      // Try lookup by auth userid first
      const { data: byId, error: byIdErr } = await supabase
        .from("students")
        .select("id")
        .eq("userid", user.id)
        .maybeSingle();

      if (byIdErr) throw byIdErr;
      if (byId) userRecord = byId;

      // Fallback: try lookup by email (onboarding may have created a stub row)
      if (!userRecord) {
        const { data: byEmail, error: byEmailErr } = await supabase
          .from("students")
          .select("id")
          .eq("email", user.email)
          .maybeSingle();

        if (byEmailErr) throw byEmailErr;

        if (byEmail) {
          // Attach auth userid to the existing student row so future lookups by userid work
          const { error: attachErr } = await supabase
            .from("students")
            .update({ userid: user.id })
            .eq("id", byEmail.id);
          if (attachErr) throw attachErr;
          userRecord = { id: byEmail.id };
        }
      }

      // If still not found, create a new student record
      if (!userRecord) {
        const displayname =
          user.user_metadata?.name || user.email?.split("@")[0] || "New User";
        const { data: newRow, error: insertErr } = await supabase
          .from("students")
          .insert({ userid: user.id, email: user.email, displayname })
          .select("id")
          .maybeSingle();

        if (insertErr) throw insertErr;
        userRecord = newRow;
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

      // Update AuthContext so other pages (like Home) see the new modules immediately
      try {
        const formatted = modules.filter((m) => selectedModules.includes(m.id));
        if (setUserModules) setUserModules(formatted);
        if (setProfile) {
          setProfile((p) => ({ ...(p || {}), courseid: selectedCourse }));
        }
      } catch (err) {
        console.warn("Failed to update auth context after module save:", err);
      }

      alert("✅ Modules saved successfully!");
      navigate("/home");
    } catch (err) {
      console.error("❌ Error saving module selections:", err);
      alert(
        `Something went wrong while saving your preferences: ${err.message}`,
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="font-inter flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-sm rounded-2xl bg-white p-8 shadow-md">
        <h1 className="mb-6 text-center font-serif text-2xl font-semibold">
          Select Your Course & Modules
        </h1>

        {/* Course Dropdown */}
        <div className="mb-5">
          <label className="mb-1 block text-sm font-medium">Course</label>
          <select
            className="w-full rounded-md border border-gray-600 p-2 text-sm focus:ring-1 focus:ring-gray-400 focus:outline-none"
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
            <label className="mb-1 block text-sm font-medium">
              Modules (Select up to 4)
            </label>
            <select
              className="w-full rounded-md border border-gray-600 p-2 text-sm focus:ring-1 focus:ring-gray-400 focus:outline-none"
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
            <div className="mt-3 flex flex-wrap gap-2">
              {selectedModules.map((modId) => {
                const mod = modules.find((m) => m.id === modId);
                return (
                  <div
                    key={modId}
                    className="flex items-center rounded-md bg-[#DEE7E7] px-3 py-1 text-sm font-medium"
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

        <p className="mb-4 text-center text-xs font-bold text-red-400">
          You can’t change these later *
        </p>

        <button
          onClick={handleSubmit}
          disabled={loading}
          className={`w-full rounded-md py-2 text-sm font-medium text-white transition-all ${
            loading
              ? "cursor-not-allowed bg-gray-600"
              : "bg-primary cursor-pointer text-black hover:bg-red-700"
          }`}
        >
          {loading ? "Saving..." : "Submit"}
        </button>
      </div>
    </div>
  );
};

export default ModulesSelect;
