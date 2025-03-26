import React, { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { toast } from "react-hot-toast";
import {
  FiEdit2,
  FiTrash2,
  FiPlus,
  // Removed unused icons
  FiShare2,
  FiBookmark,
  FiStar,
  FiClock,
  FiTag,
} from "react-icons/fi";
import { getNoteById, deleteNote } from "../features/notes/notesSlice";
import api from "../api/axios";
import ConfirmationModal from "../components/ui/ConfirmationModal";

const NoteDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const { currentNote, isLoading } = useSelector((state) => state.notes);
  const { token } = useSelector((state) => state.auth);
  // User is actually used to check permissions, kept but commented to show intention
  // const { user } = useSelector((state) => state.auth);

  const [noteDetails, setNoteDetails] = useState([]);
  const [newDetail, setNewDetail] = useState("");
  const [isAddingDetail, setIsAddingDetail] = useState(false);
  const [editingDetailId, setEditingDetailId] = useState(null);
  const [editingDetailText, setEditingDetailText] = useState("");
  const [isConfirmDeleteOpen, setIsConfirmDeleteOpen] = useState(false);
  const [isDetailLoading, setIsDetailLoading] = useState(false);
  // We're using this in the hover UI, but React doesn't detect it
  // So we'll use a different approach to avoid the linting error
  // const [activeDetailId, setActiveDetailId] = useState(null);

  // Update your fetchNoteDetails function to include debugging
  const fetchNoteDetails = useCallback(async () => {
    setIsDetailLoading(true);
    try {
      console.log("Fetching note details for ID:", id);
      console.log("Auth token available:", !!token); // Log if token exists

      const response = await api.get(`/notes/${id}/details`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      console.log("Note details response:", response.data);
      setNoteDetails(response.data);
    } catch (error) {
      console.error("Failed to fetch note details:", error.response || error);
      toast.error("Failed to load note details");
    } finally {
      setIsDetailLoading(false);
    }
  }, [id, token]);

  // Use fetchNoteDetails in useEffect AFTER it's defined
  useEffect(() => {
    // First, get the note
    dispatch(getNoteById(id))
      .unwrap()
      .then(() => {
        // Only fetch details if the note was successfully retrieved
        fetchNoteDetails();
      })
      .catch((error) => {
        console.error("Error fetching note:", error);
      });
  }, [dispatch, id, fetchNoteDetails]);

  
  
  // Add a new detail
  const handleAddDetail = async (e) => {
    e.preventDefault();

    if (!newDetail.trim()) return;

    try {
      const response = await api.post(
        `/notes/${id}/details`,
        {
          detail: newDetail,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setNoteDetails([...noteDetails, response.data]);
      setNewDetail("");
      setIsAddingDetail(false);
      toast.success("Detail added successfully");
    } catch (error) {
      console.error("Failed to add detail:", error);
      toast.error("Failed to add detail");
    }
  };
  // Update a detail
  const handleUpdateDetail = async (detailId) => {
    if (!editingDetailText.trim()) return;

    try {
      const response = await api.put(`/notes/details/${detailId}`, {
        detail: editingDetailText,
      });

      setNoteDetails(
        noteDetails.map((detail) =>
          detail._id === detailId ? response.data : detail
        )
      );

      setEditingDetailId(null);
      setEditingDetailText("");
      toast.success("Detail updated successfully");
    } catch (error) {
      console.error("Failed to update detail:", error);
      toast.error("Failed to update detail");
    }
  };

  // Delete a detail
  const handleDeleteDetail = async (detailId) => {
    try {
      await api.delete(`/notes/details/${detailId}`);

      setNoteDetails(noteDetails.filter((detail) => detail._id !== detailId));
      toast.success("Detail deleted successfully");
    } catch (error) {
      console.error("Failed to delete detail:", error);
      toast.error("Failed to delete detail");
    }
  };

  // Handle delete note
  const handleDeleteNote = async () => {
    try {
      await dispatch(deleteNote(id)).unwrap();
      toast.success("Note deleted successfully");
      navigate("/notes");
    } catch (error) {
      toast.error(error || "Failed to delete note");
    }
  };

  // Format date
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString(undefined, {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!currentNote) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6 mx-auto max-w-4xl">
        <h2 className="text-xl font-semibold text-gray-700">Note not found</h2>
        <p className="text-gray-500 mt-2">
          The note you're looking for doesn't exist or you don't have permission
          to view it.
        </p>
        <Link
          to="/notes"
          className="text-blue-600 hover:underline mt-4 inline-block"
        >
          Back to Notes
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="bg-white rounded-lg shadow-md p-6">
        {/* Note Header */}
        <div className="flex justify-between items-start mb-6">
          <h1 className="text-2xl font-bold text-gray-800">
            {currentNote.title}
          </h1>
          <div className="flex space-x-2">
            <button
              onClick={() => navigate(`/notes/${id}/edit`)}
              className="p-2 text-blue-600 hover:bg-blue-50 rounded"
              aria-label="Edit note"
            >
              <FiEdit2 size={18} />
            </button>
            <button
              onClick={() => setIsConfirmDeleteOpen(true)}
              className="p-2 text-red-600 hover:bg-red-50 rounded"
              aria-label="Delete note"
            >
              <FiTrash2 size={18} />
            </button>
          </div>
        </div>

        {/* Note Meta */}
        <div className="flex flex-wrap gap-2 text-sm text-gray-500 mb-4">
          <span className="flex items-center">
            <FiClock className="mr-1" />
            Created: {formatDate(currentNote.createdAt)}
          </span>
          <span className="flex items-center">
            <FiClock className="mr-1" />
            Last updated: {formatDate(currentNote.updatedAt)}
          </span>
          {currentNote.pinned && (
            <span className="flex items-center text-yellow-600">
              <FiBookmark className="mr-1" />
              Pinned
            </span>
          )}
          {currentNote.important && (
            <span className="flex items-center text-yellow-600">
              <FiStar className="mr-1" />
              Important
            </span>
          )}
        </div>

        {/* Tags */}
        {currentNote.tags && currentNote.tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-6">
            <FiTag className="text-gray-500 mr-1 mt-1" />
            {currentNote.tags.map((tag) => (
              <span
                key={tag._id}
                className="px-2 py-1 text-xs rounded-full bg-gray-100 text-gray-700"
                style={
                  tag.color
                    ? {
                        backgroundColor: `${tag.color}20`,
                        color: tag.color,
                        borderColor: tag.color,
                      }
                    : {}
                }
              >
                {tag.name}
              </span>
            ))}
          </div>
        )}

        {/* Note Content */}
        <div className="mb-8 py-3 border-t border-b border-gray-100">
          <div className="prose max-w-none">
            {currentNote.content.split("\n").map((paragraph, idx) => (
              <p key={idx} className="mb-3 text-black">
                {paragraph}
              </p>
            ))}
          </div>
        </div>

        {/* Note Details Section */}
        <div className="mt-6 border-t pt-4">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-gray-800">
              Additional Details
            </h2>
            <button
              onClick={() => setIsAddingDetail(true)}
              className="flex items-center text-sm text-blue-600 hover:text-blue-800"
            >
              <FiPlus className="mr-1" />
              Add Detail
            </button>
          </div>

          {isDetailLoading ? (
            <div className="flex justify-center py-6">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
            </div>
          ) : (
            <div className="space-y-3">
              {/* Add Detail Form */}
              {isAddingDetail && (
                <form
                  onSubmit={handleAddDetail}
                  className="mb-4 p-3 bg-blue-50 rounded-md"
                >
                  <textarea
                    value={newDetail}
                    onChange={(e) => setNewDetail(e.target.value)}
                    className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter detail..."
                    rows={3}
                    autoFocus
                  />
                  <div className="flex justify-end space-x-2 mt-2">
                    <button
                      type="button"
                      onClick={() => {
                        setIsAddingDetail(false);
                        setNewDetail("");
                      }}
                      className="px-3 py-1 text-gray-600 hover:bg-gray-100 rounded"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700"
                    >
                      Add
                    </button>
                  </div>
                </form>
              )}

              {/* Details List */}
              {noteDetails.length > 0 ? (
                <ul>
                  {noteDetails.map((detail) => (
                    <li
                      key={detail._id}
                      className="border-b border-gray-100 last:border-b-0 py-3"
                    >
                      {editingDetailId === detail._id ? (
                        <div className="p-2 bg-blue-50 rounded">
                          <textarea
                            value={editingDetailText}
                            onChange={(e) =>
                              setEditingDetailText(e.target.value)
                            }
                            className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            rows={3}
                            autoFocus
                          />
                          <div className="flex justify-end space-x-2 mt-2">
                            <button
                              onClick={() => setEditingDetailId(null)}
                              className="px-3 py-1 text-gray-600 hover:bg-gray-100 rounded"
                            >
                              Cancel
                            </button>
                            <button
                              onClick={() => handleUpdateDetail(detail._id)}
                              className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700"
                            >
                              Save
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div
                          className="group relative"
                          // Use inline functions instead of state for hover effects
                        >
                          <p className="text-gray-700 whitespace-pre-wrap">
                            {detail.detail}
                          </p>
                          <div className="absolute top-0 right-0 hidden group-hover:flex space-x-1">
                            <button
                              onClick={() => {
                                setEditingDetailId(detail._id);
                                setEditingDetailText(detail.detail);
                              }}
                              className="p-1 text-blue-600 hover:bg-blue-50 rounded"
                              aria-label="Edit detail"
                            >
                              <FiEdit2 size={14} />
                            </button>
                            <button
                              onClick={() => handleDeleteDetail(detail._id)}
                              className="p-1 text-red-600 hover:bg-red-50 rounded"
                              aria-label="Delete detail"
                            >
                              <FiTrash2 size={14} />
                            </button>
                          </div>
                          <div className="text-xs text-gray-400 mt-1">
                            {formatDate(detail.updatedAt)}
                          </div>
                        </div>
                      )}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-gray-500 italic py-3">
                  No additional details for this note yet.
                </p>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Navigation */}
      <div className="mt-6 flex justify-between">
        <Link
          to="/notes"
          className="text-blue-600 hover:underline flex items-center"
        >
          Back to Notes
        </Link>
        <div className="space-x-4">
          {currentNote.isPublic ? (
            <button className="flex items-center text-green-600 hover:underline mb-1">
              <FiShare2 className="mr-1" />
              Public Link
            </button>
          ) : null}
          <Link
            to={`/notes/${id}/edit`}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 flex items-center"
          >
            <FiEdit2 className="mr-2" />
            Edit Note
          </Link>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      <ConfirmationModal
        isOpen={isConfirmDeleteOpen}
        onClose={() => setIsConfirmDeleteOpen(false)}
        onConfirm={handleDeleteNote}
        title="Delete Note"
        message="Are you sure you want to delete this note? This action cannot be undone."
        confirmText="Delete"
        confirmButtonClass="bg-red-600 hover:bg-red-700"
      />
    </div>
  );
};

export default NoteDetails;
