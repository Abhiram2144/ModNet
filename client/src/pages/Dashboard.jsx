import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabaseClient";
import { Plus, Pencil, Trash2, X, LogOut } from "lucide-react";

export default function Dashboard() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("channels");
  const [adminEmail, setAdminEmail] = useState("");

  // Data states
  const [channels, setChannels] = useState([]);
  const [courses, setCourses] = useState([]);
  const [modules, setModules] = useState([]);

  // UI states
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState("add"); // "add" or "edit"
  const [editingItem, setEditingItem] = useState(null);

  // Form states
  const [formData, setFormData] = useState({});

  // Check admin session
  useEffect(() => {
    const session = sessionStorage.getItem("admin_session");
    if (!session) {
      navigate("/admin/login");
      return;
    }
    const parsed = JSON.parse(session);
    setAdminEmail(parsed.email);
  }, [navigate]);

  // Load data based on active tab
  useEffect(() => {
    loadData();
  }, [activeTab]);

  const loadData = async () => {
    setLoading(true);
    setError("");
    try {
      if (activeTab === "channels") {
        const { data, error } = await supabase
          .from("channels")
          .select("*")
          .order("created_at", { ascending: false });
        if (error) throw error;
        setChannels(data || []);
      } else if (activeTab === "courses") {
        const { data, error } = await supabase
          .from("courses")
          .select("*")
          .order("created_at", { ascending: false });
        if (error) throw error;
        setCourses(data || []);
      } else if (activeTab === "modules") {
        const { data, error } = await supabase
          .from("modules")
          .select("*, courses:course_id(name)")
          .order("created_at", { ascending: false });
        if (error) throw error;
        setModules(data || []);
      }
    } catch (err) {
      setError(err.message || "Failed to load data");
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    sessionStorage.removeItem("admin_session");
    navigate("/login");
  };

  const openAddModal = () => {
    setModalMode("add");
    setEditingItem(null);
    setFormData({});
    setShowModal(true);
  };

  const openEditModal = (item) => {
    setModalMode("edit");
    setEditingItem(item);
    setFormData({ ...item });
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setFormData({});
    setEditingItem(null);
  };

  const handleSave = async () => {
    setError("");
    try {
      if (activeTab === "channels") {
        if (modalMode === "add") {
          const { error } = await supabase.from("channels").insert([
            {
              name: formData.name || "",
              description: formData.description || "",
            },
          ]);
          if (error) throw error;
        } else {
          const { error } = await supabase
            .from("channels")
            .update({
              name: formData.name,
              description: formData.description,
            })
            .eq("id", editingItem.id);
          if (error) throw error;
        }
      } else if (activeTab === "courses") {
        if (modalMode === "add") {
          const { error } = await supabase.from("courses").insert([
            {
              name: formData.name || "",
              description: formData.description || "",
            },
          ]);
          if (error) throw error;
        } else {
          const { error } = await supabase
            .from("courses")
            .update({
              name: formData.name,
              description: formData.description,
            })
            .eq("id", editingItem.id);
          if (error) throw error;
        }
      } else if (activeTab === "modules") {
        if (modalMode === "add") {
          const { error } = await supabase.from("modules").insert([
            {
              name: formData.name || "",
              code: formData.code || "",
              description: formData.description || "",
              course_id: formData.course_id || null,
            },
          ]);
          if (error) throw error;
        } else {
          const { error } = await supabase
            .from("modules")
            .update({
              name: formData.name,
              code: formData.code,
              description: formData.description,
              course_id: formData.course_id,
            })
            .eq("id", editingItem.id);
          if (error) throw error;
        }
      }
      closeModal();
      loadData();
    } catch (err) {
      setError(err.message || "Failed to save");
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("Are you sure you want to delete this item?")) return;
    setError("");
    try {
      let table = activeTab;
      const { error } = await supabase.from(table).delete().eq("id", id);
      if (error) throw error;
      loadData();
    } catch (err) {
      setError(err.message || "Failed to delete");
    }
  };

  const renderTable = () => {
    if (loading) {
      return (
        <div className="text-center py-12 text-gray-500">Loading...</div>
      );
    }

    let data = [];
    if (activeTab === "channels") data = channels;
    else if (activeTab === "courses") data = courses;
    else if (activeTab === "modules") data = modules;

    if (data.length === 0) {
      return (
        <div className="text-center py-12 text-gray-500">
          No {activeTab} found. Add your first one!
        </div>
      );
    }

    return (
      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-gray-100 border-b border-gray-200">
              <th className="text-left px-4 py-3 text-sm font-semibold text-gray-700">
                ID
              </th>
              <th className="text-left px-4 py-3 text-sm font-semibold text-gray-700">
                Name
              </th>
              {activeTab === "modules" && (
                <>
                  <th className="text-left px-4 py-3 text-sm font-semibold text-gray-700">
                    Code
                  </th>
                  <th className="text-left px-4 py-3 text-sm font-semibold text-gray-700">
                    Course
                  </th>
                </>
              )}
              <th className="text-left px-4 py-3 text-sm font-semibold text-gray-700">
                Description
              </th>
              <th className="text-right px-4 py-3 text-sm font-semibold text-gray-700">
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {data.map((item) => (
              <tr key={item.id} className="border-b border-gray-100 hover:bg-gray-50">
                <td className="px-4 py-3 text-sm text-gray-900">{item.id}</td>
                <td className="px-4 py-3 text-sm text-gray-900 font-medium">
                  {item.name}
                </td>
                {activeTab === "modules" && (
                  <>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {item.code || "—"}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {item.courses?.name || "—"}
                    </td>
                  </>
                )}
                <td className="px-4 py-3 text-sm text-gray-600">
                  {item.description || "—"}
                </td>
                <td className="px-4 py-3 text-right">
                  <button
                    onClick={() => openEditModal(item)}
                    className="inline-flex items-center text-blue-600 hover:text-blue-800 mr-3"
                    title="Edit"
                  >
                    <Pencil size={16} />
                  </button>
                  <button
                    onClick={() => handleDelete(item.id)}
                    className="inline-flex items-center text-red-600 hover:text-red-800"
                    title="Delete"
                  >
                    <Trash2 size={16} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  const renderModalForm = () => {
    if (activeTab === "channels" || activeTab === "courses") {
      return (
        <>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Name *
            </label>
            <input
              type="text"
              value={formData.name || ""}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
              placeholder="Enter name"
            />
          </div>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description
            </label>
            <textarea
              value={formData.description || ""}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
              rows={3}
              placeholder="Enter description"
            />
          </div>
        </>
      );
    } else if (activeTab === "modules") {
      return (
        <>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Module Name *
            </label>
            <input
              type="text"
              value={formData.name || ""}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
              placeholder="e.g., Introduction to Computer Science"
            />
          </div>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Module Code
            </label>
            <input
              type="text"
              value={formData.code || ""}
              onChange={(e) => setFormData({ ...formData, code: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
              placeholder="e.g., CS101"
            />
          </div>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Course
            </label>
            <select
              value={formData.course_id || ""}
              onChange={(e) =>
                setFormData({ ...formData, course_id: e.target.value })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
            >
              <option value="">— None —</option>
              {courses.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description
            </label>
            <textarea
              value={formData.description || ""}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
              rows={3}
              placeholder="Enter description"
            />
          </div>
        </>
      );
    }
  };

  return (
    <div className="font-inter min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
              <p className="text-sm text-gray-600 mt-1">Logged in as: {adminEmail}</p>
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center space-x-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition text-sm font-medium text-gray-700"
            >
              <LogOut size={18} />
              <span>Logout</span>
            </button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-8">
            {["channels", "courses", "modules"].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`py-4 px-2 border-b-2 font-medium text-sm capitalize transition ${
                  activeTab === tab
                    ? "border-blue-500 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Action bar */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-gray-900 capitalize">
            Manage {activeTab}
          </h2>
          <button
            onClick={openAddModal}
            className="flex items-center space-x-2 px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition font-medium"
          >
            <Plus size={18} />
            <span>Add {activeTab.slice(0, -1)}</span>
          </button>
        </div>

        {/* Error message */}
        {error && (
          <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
            {error}
          </div>
        )}

        {/* Table */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          {renderTable()}
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 capitalize">
                {modalMode === "add" ? "Add" : "Edit"} {activeTab.slice(0, -1)}
              </h3>
              <button
                onClick={closeModal}
                className="text-gray-400 hover:text-gray-600 transition"
              >
                <X size={24} />
              </button>
            </div>

            <div className="p-6">
              {renderModalForm()}

              <div className="flex space-x-3 mt-6">
                <button
                  onClick={closeModal}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  className="flex-1 px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition font-medium"
                >
                  Save
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
