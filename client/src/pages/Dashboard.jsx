import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabaseClient";
import { Plus, Pencil, Trash2, X, LogOut, ChevronLeft, ChevronRight } from "lucide-react";

export default function Dashboard() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("channels");
  const [adminEmail, setAdminEmail] = useState("");

  // Data states
  const [channels, setChannels] = useState([]);
  const [courses, setCourses] = useState([]);
  const [modules, setModules] = useState([]);
  const [profileImages, setProfileImages] = useState([]);

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  // UI states
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState("add"); // "add" or "edit"
  const [editingItem, setEditingItem] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteItemId, setDeleteItemId] = useState(null);

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
    setCurrentPage(1); // Reset to first page when switching tabs
  }, [activeTab]);

  const loadData = async () => {
    setLoading(true);
    setError("");
    try {
      if (activeTab === "channels") {
        const { data, error } = await supabase
          .from("channels")
          .select("*")
          .order("id", { ascending: true });
        if (error) throw error;
        setChannels(data || []);
      } else if (activeTab === "courses") {
        const { data, error } = await supabase
          .from("courses")
          .select("*")
          .order("id", { ascending: true });
        if (error) throw error;
        setCourses(data || []);
      } else if (activeTab === "modules") {
        const { data, error } = await supabase
          .from("modules")
          .select("*, courses:course_id(name)")
          .order("id", { ascending: true });
        if (error) throw error;
        setModules(data || []);
      } else if (activeTab === "profileImages") {
        const { data, error } = await supabase
          .from("profile_images")
          .select("*")
          .order("id", { ascending: true });
        if (error) throw error;
        setProfileImages(data || []);
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
      } else if (activeTab === "profileImages") {
        if (modalMode === "add") {
          const { error } = await supabase.from("profile_images").insert([
            {
              image_url: formData.image_url || "",
              name: formData.name || "",
              is_active: formData.is_active !== false,
            },
          ]);
          if (error) throw error;
        } else {
          const { error } = await supabase
            .from("profile_images")
            .update({
              image_url: formData.image_url,
              name: formData.name,
              is_active: formData.is_active,
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
    setDeleteItemId(id);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    setError("");
    try {
      let table = activeTab;
      if (activeTab === "profileImages") table = "profile_images";
      const { error } = await supabase.from(table).delete().eq("id", deleteItemId);
      if (error) throw error;
      setShowDeleteModal(false);
      setDeleteItemId(null);
      loadData();
    } catch (err) {
      setError(err.message || "Failed to delete");
    }
  };

  const cancelDelete = () => {
    setShowDeleteModal(false);
    setDeleteItemId(null);
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
    else if (activeTab === "profileImages") data = profileImages;

    if (data.length === 0) {
      return (
        <div className="text-center py-12 text-gray-500">
          No {activeTab === "profileImages" ? "profile images" : activeTab} found. Add your first one!
        </div>
      );
    }

    // Special render for profile images
    if (activeTab === "profileImages") {
      return (
        <div className="grid grid-cols-3 lg:grid-cols-4 gap-3 p-4">
          {data.map((item) => (
            <div key={item.id} className="border border-gray-200 rounded-lg p-2 hover:shadow-md transition">
              <div className="flex items-start justify-between mb-2">
                <span className={`inline-block px-2 py-0.5 text-[10px] rounded-full ${item.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'}`}>
                  {item.is_active ? 'Active' : 'Inactive'}
                </span>
                <div className="flex space-x-1">
                  <button
                    onClick={() => openEditModal(item)}
                    className="text-blue-600 hover:text-blue-800 hover:cursor-pointer"
                    title="Edit"
                  >
                    <Pencil size={14} />
                  </button>
                  <button
                    onClick={() => handleDelete(item.id)}
                    className="text-red-600 hover:text-red-800 hover:cursor-pointer"
                    title="Delete"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
              <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden mb-2">
                <img
                  src={item.image_url}
                  alt={item.name || 'Profile'}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.target.src = 'https://via.placeholder.com/150?text=Invalid+URL';
                  }}
                />
              </div>
              <p className="text-[11px] font-medium text-gray-900 truncate mb-1" title={item.name || `Image ${item.id}`}>
                {item.name || `Image ${item.id}`}
              </p>
              <p className="text-[10px] text-gray-500 truncate" title={item.image_url}>
                {item.image_url}
              </p>
            </div>
          ))}
        </div>
      );
    }

    // Pagination for tables
    const totalPages = Math.ceil(data.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const paginatedData = data.slice(startIndex, endIndex);

    return (
      <>
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
              {paginatedData.map((item) => (
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
                      className="inline-flex items-center text-blue-600 hover:text-blue-800 hover:cursor-pointer mr-3"
                      title="Edit"
                    >
                      <Pencil size={16} />
                    </button>
                    <button
                      onClick={() => handleDelete(item.id)}
                      className="inline-flex items-center text-red-600 hover:text-red-800 hover:cursor-pointer"
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

        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200">
            <div className="text-sm text-gray-600">
              Showing {startIndex + 1} to {Math.min(endIndex, data.length)} of {data.length} items
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                className={`px-3 py-1 rounded-lg border transition ${
                  currentPage === 1
                    ? 'border-gray-200 text-gray-400 cursor-not-allowed'
                    : 'border-gray-300 text-gray-700 hover:bg-gray-50 hover:cursor-pointer'
                }`}
              >
                <ChevronLeft size={16} />
              </button>
              
              <div className="flex items-center space-x-1">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    className={`px-3 py-1 rounded-lg transition hover:cursor-pointer ${
                      currentPage === page
                        ? 'bg-black text-white'
                        : 'text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    {page}
                  </button>
                ))}
              </div>

              <button
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
                className={`px-3 py-1 rounded-lg border transition ${
                  currentPage === totalPages
                    ? 'border-gray-200 text-gray-400 cursor-not-allowed'
                    : 'border-gray-300 text-gray-700 hover:bg-gray-50 hover:cursor-pointer'
                }`}
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </>
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
    } else if (activeTab === "profileImages") {
      return (
        <>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Image URL *
            </label>
            <input
              type="url"
              value={formData.image_url || ""}
              onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
              placeholder="https://example.com/image.jpg"
            />
          </div>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Name
            </label>
            <input
              type="text"
              value={formData.name || ""}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
              placeholder="e.g., Avatar 1"
            />
          </div>
          <div className="mb-4">
            <label className="flex items-center space-x-2 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.is_active !== false}
                onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <span className="text-sm font-medium text-gray-700">Active (visible to users)</span>
            </label>
          </div>
          {formData.image_url && (
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Preview
              </label>
              <div className="w-32 h-32 bg-gray-100 rounded-lg overflow-hidden">
                <img
                  src={formData.image_url}
                  alt="Preview"
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.target.src = 'https://via.placeholder.com/150?text=Invalid+URL';
                  }}
                />
              </div>
            </div>
          )}
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
              className="flex items-center space-x-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 hover:cursor-pointer rounded-lg transition text-sm font-medium text-gray-700"
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
          <div className="flex space-x-8 overflow-x-auto">
            {["channels", "courses", "modules", "profileImages"].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`py-4 px-2 border-b-2 font-medium text-sm whitespace-nowrap transition hover:cursor-pointer ${
                  activeTab === tab
                    ? "border-blue-500 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                {tab === "profileImages" ? "Profile Images" : tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Action bar */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-gray-900">
            Manage {activeTab === "profileImages" ? "Profile Images" : activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}
          </h2>
          <button
            onClick={openAddModal}
            className="flex items-center space-x-2 px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 hover:cursor-pointer transition font-medium"
          >
            <Plus size={18} />
            <span>Add {activeTab === "profileImages" ? "Image" : activeTab.slice(0, -1)}</span>
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
              <h3 className="text-lg font-semibold text-gray-900">
                {modalMode === "add" ? "Add" : "Edit"} {activeTab === "profileImages" ? "Profile Image" : activeTab.slice(0, -1)}
              </h3>
              <button
                onClick={closeModal}
                className="text-gray-400 hover:text-gray-600 hover:cursor-pointer transition"
              >
                <X size={24} />
              </button>
            </div>

            <div className="p-6">
              {renderModalForm()}

              <div className="flex space-x-3 mt-6">
                <button
                  onClick={closeModal}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 hover:cursor-pointer transition font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  className="flex-1 px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 hover:cursor-pointer transition font-medium"
                >
                  Save
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full">
            <div className="p-6">
              <div className="flex items-center justify-center w-12 h-12 mx-auto bg-red-100 rounded-full mb-4">
                <Trash2 className="text-red-600" size={24} />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 text-center mb-2">
                Delete {activeTab === "profileImages" ? "Profile Image" : activeTab.slice(0, -1)}?
              </h3>
              <p className="text-sm text-gray-600 text-center mb-6">
                Are you sure you want to delete this item? This action cannot be undone.
              </p>
              <div className="flex space-x-3">
                <button
                  onClick={cancelDelete}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 hover:cursor-pointer transition font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmDelete}
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 hover:cursor-pointer transition font-medium"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
