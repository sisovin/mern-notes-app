import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { toast } from "react-hot-toast";
import {
  FiPlus,
  FiEdit2,
  FiTrash2,
  FiCheck,
  FiX,
  FiSearch,
} from "react-icons/fi";
import { getAllTags } from "../features/tags/tagsSlice";
import api from "../api/axios";
import ConfirmationModal from "../components/ui/ConfirmationModal";

const TagsList = () => {
  const dispatch = useDispatch();
  const { tags, isLoading, pagination } = useSelector((state) => state.tags);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [newTagName, setNewTagName] = useState("");
  const [newTagDescription, setNewTagDescription] = useState("");
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingTag, setEditingTag] = useState(null);
  const [tagToDelete, setTagToDelete] = useState(null);
  const [tagStatistics, setTagStatistics] = useState({});

  // Add this helper function at the top of your component
  const formatTagName = (name) => {
    // Check if the name looks like a MongoDB ObjectId (24 hex chars)
    if (/^[0-9a-f]{24}$/i.test(name)) {
      return `Tag ${name.substring(0, 6)}...`; // Show shortened ID as fallback
    }
    return name; // Return the name if it doesn't look like an ID
  };
 
  // Fetch tags on component mount and when search/page changes
  useEffect(() => {
    const fetchTags = () => {
      const params = {
        page: currentPage,
        limit: 10,
      };

      if (searchQuery) {
        params.search = searchQuery;
      }

      dispatch(getAllTags(params));
    };

    fetchTags();
  }, [dispatch, currentPage, searchQuery]);

  // Fetch tag statistics (count of notes using each tag)
  useEffect(() => {
    const fetchTagStatistics = async () => {
      if (!tags || tags.length === 0) return;

      const stats = {};

      try {
        // Create a map of tag IDs to note counts
        for (const tag of tags) {
          try {
            const response = await api.get(`/tags/${tag._id}/notes?limit=1`);
            stats[tag._id] = response.data.pagination.total;
          } catch (error) {
            console.error(`Error fetching stats for tag ${tag.name}:`, error);
            stats[tag._id] = 0;
          }
        }

        setTagStatistics(stats);
      } catch (error) {
        console.error("Error fetching tag statistics:", error);
      }
    };

    fetchTagStatistics();
  }, [tags]);

  // Handle search input changes
  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
    setCurrentPage(1); // Reset to first page when search changes
  };

  // Handle search form submission
  const handleSearch = (e) => {
    e.preventDefault();
    setCurrentPage(1);
    dispatch(getAllTags({ page: 1, limit: 10, search: searchQuery }));
  };

  // Handle pagination
  const handlePageChange = (newPage) => {
    if (newPage < 1 || newPage > pagination?.pages) return;
    setCurrentPage(newPage);
  };

  // Create new tag
  const handleCreateTag = async (e) => {
    e.preventDefault();

    if (!newTagName.trim()) {
      toast.error("Tag name is required");
      return;
    }

    try {
      // Make sure we're sending the correct name (not an ID)
      const cleanTagName = newTagName.trim();

      await api.post("/tags", {
        name: cleanTagName, // Ensure this is a proper name string, not an ID
        description: newTagDescription || `Tag for ${cleanTagName}`,
      });

      toast.success("Tag created successfully");
      setNewTagName("");
      setNewTagDescription("");
      setShowAddForm(false);

      // Refresh tags list
      dispatch(
        getAllTags({ page: currentPage, limit: 10, search: searchQuery })
      );
    } catch (error) {
      console.error("Error creating tag:", error);
      toast.error(error.response?.data?.error || "Failed to create tag");
    }
  };

  // Start editing a tag
  const startEditTag = (tag) => {
    setEditingTag({
      ...tag,
      name: tag.name,
      description: tag.description,
    });
  };

  // Cancel editing
  const cancelEdit = () => {
    setEditingTag(null);
  };

  // Save tag changes
  const saveTagChanges = async () => {
    if (!editingTag.name.trim()) {
      toast.error("Tag name is required");
      return;
    }

    try {
      // Make sure we're sending a proper name (not an ID)
      const cleanTagName = editingTag.name.trim();

      await api.put(`/tags/${editingTag._id}`, {
        name: cleanTagName, // Ensure this is a proper name, not an ID
        description: editingTag.description,
      });

      toast.success("Tag updated successfully");
      setEditingTag(null);

      // Refresh tags list
      dispatch(
        getAllTags({ page: currentPage, limit: 10, search: searchQuery })
      );
    } catch (error) {
      console.error("Error updating tag:", error);
      toast.error(error.response?.data?.error || "Failed to update tag");
    }
  };

  // Delete a tag
  const handleDeleteTag = async () => {
    if (!tagToDelete) return;

    try {
      await api.delete(`/tags/${tagToDelete._id}/soft`);

      toast.success("Tag deleted successfully");
      setTagToDelete(null);

      // Refresh tags list
      dispatch(
        getAllTags({ page: currentPage, limit: 10, search: searchQuery })
      );
    } catch (error) {
      console.error("Error deleting tag:", error);
      toast.error(error.response?.data?.error || "Failed to delete tag");
    }
  };

  // Render loading state
  if (isLoading && !tags.length) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Tags</h1>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="bg-blue-600 text-white px-4 py-2 rounded flex items-center"
        >
          <FiPlus className="mr-2" />
          {showAddForm ? "Cancel" : "Add New Tag"}
        </button>
      </div>

      {/* Search Form */}
      <div className="mb-6">
        <form onSubmit={handleSearch} className="flex">
          <div className="relative flex-grow">
            <input
              type="text"
              value={searchQuery}
              onChange={handleSearchChange}
              placeholder="Search tags..."
              className="w-full px-4 py-2 border rounded-l focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              type="button"
              onClick={() => setSearchQuery("")}
              className={`absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 ${
                !searchQuery && "hidden"
              }`}
            >
              <FiX />
            </button>
          </div>
          <button
            type="submit"
            className="bg-blue-600 text-white px-4 py-2 rounded-r flex items-center"
          >
            <FiSearch />
          </button>
        </form>
      </div>

      {/* Add Tag Form */}
      {showAddForm && (
        <div className="mb-6 p-4 bg-gray-50 rounded-lg shadow">
          <h2 className="text-lg font-medium mb-3">Create New Tag</h2>
          <form onSubmit={handleCreateTag}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Name*
                </label>
                <input
                  type="text"
                  value={newTagName}
                  onChange={(e) => setNewTagName(e.target.value)}
                  placeholder="Enter tag name"
                  className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <input
                  type="text"
                  value={newTagDescription}
                  onChange={(e) => setNewTagDescription(e.target.value)}
                  placeholder="Enter tag description"
                  className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            <div className="mt-4 flex justify-end">
              <button
                type="button"
                onClick={() => setShowAddForm(false)}
                className="px-4 py-2 text-gray-700 border border-gray-300 rounded mr-2 hover:bg-gray-100"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Create Tag
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Tags List */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                Name
              </th>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                Description
              </th>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                Notes
              </th>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                Created
              </th>
              <th
                scope="col"
                className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {tags.length === 0 ? (
              <tr>
                <td colSpan="5" className="px-6 py-4 text-center text-gray-500">
                  {searchQuery
                    ? "No tags found matching your search."
                    : "No tags created yet."}
                </td>
              </tr>
            ) : (
              tags.map((tag) => (
                <tr key={tag._id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {editingTag && editingTag._id === tag._id ? (
                      <input
                        type="text"
                        value={editingTag.name}
                        onChange={(e) =>
                          setEditingTag({
                            ...editingTag,
                            name: e.target.value,
                          })
                        }
                        className="w-full px-2 py-1 border rounded"
                      />
                    ) : (
                      <div className="text-sm font-medium text-gray-900">
                        {formatTagName(tag.name)}
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    {editingTag && editingTag._id === tag._id ? (
                      <input
                        type="text"
                        value={editingTag.description}
                        onChange={(e) =>
                          setEditingTag({
                            ...editingTag,
                            description: e.target.value,
                          })
                        }
                        className="w-full px-2 py-1 border rounded"
                      />
                    ) : (
                      <div className="text-sm text-gray-500">
                        {tag.description}
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                      {tagStatistics[tag._id] !== undefined
                        ? tagStatistics[tag._id]
                        : "..."}{" "}
                      notes
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(tag.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    {editingTag && editingTag._id === tag._id ? (
                      <div className="flex justify-end space-x-2">
                        <button
                          onClick={saveTagChanges}
                          className="text-green-600 hover:text-green-900"
                        >
                          <FiCheck />
                        </button>
                        <button
                          onClick={cancelEdit}
                          className="text-red-600 hover:text-red-900"
                        >
                          <FiX />
                        </button>
                      </div>
                    ) : (
                      <div className="flex justify-end space-x-4">
                        <button
                          onClick={() => startEditTag(tag)}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          <FiEdit2 />
                        </button>
                        <button
                          onClick={() => setTagToDelete(tag)}
                          className="text-red-600 hover:text-red-900"
                        >
                          <FiTrash2 />
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {pagination && pagination.pages > 1 && (
        <div className="flex justify-center mt-6">
          <nav className="flex items-center">
            <button
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className={`mx-1 px-3 py-1 rounded ${
                currentPage === 1
                  ? "opacity-50 cursor-not-allowed"
                  : "hover:bg-gray-100"
              }`}
            >
              Previous
            </button>
            {[...Array(pagination.pages)].map((_, index) => (
              <button
                key={index}
                onClick={() => handlePageChange(index + 1)}
                className={`mx-1 px-3 py-1 rounded ${
                  currentPage === index + 1
                    ? "bg-blue-500 text-white"
                    : "hover:bg-gray-100"
                }`}
              >
                {index + 1}
              </button>
            ))}
            <button
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === pagination.pages}
              className={`mx-1 px-3 py-1 rounded ${
                currentPage === pagination.pages
                  ? "opacity-50 cursor-not-allowed"
                  : "hover:bg-gray-100"
              }`}
            >
              Next
            </button>
          </nav>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmationModal
        isOpen={tagToDelete !== null}
        onClose={() => setTagToDelete(null)}
        onConfirm={handleDeleteTag}
        title="Delete Tag"
        message={`Are you sure you want to delete the tag "${tagToDelete?.name}"? Notes with this tag will lose this tag.`}
        confirmText="Delete"
        confirmButtonClass="bg-red-600 hover:bg-red-700"
      />

      {/* Then update your tag display */}
      {/* Reference implementation of tag name formatting - already used in table rows */}
    </div>
  );
};

export default TagsList;
