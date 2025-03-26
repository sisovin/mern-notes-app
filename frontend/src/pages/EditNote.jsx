import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { toast } from "react-hot-toast";
import { FiSave, FiX, FiTag, FiLoader } from "react-icons/fi";
import { getNoteById, updateNote } from "../features/notes/notesSlice";
import { getAllTags } from "../features/tags/tagsSlice";
import NoteEditor from "../components/notes/NoteEditor";

const EditNote = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  // Only destructure isLoading, we don't need currentNote
  const { isLoading } = useSelector((state) => state.notes);
  const { tags } = useSelector((state) => state.tags);

  // Form state
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [selectedTags, setSelectedTags] = useState([]);
  const [isPinned, setIsPinned] = useState(false);
  const [isPublic, setIsPublic] = useState(false);
  const [showTagSelector, setShowTagSelector] = useState(false);
  const [isFetching, setIsFetching] = useState(true);
  const [fetchError, setFetchError] = useState(null);

  // Add this helper function to strip HTML when loading content
  const stripHtml = (html) => {
    if (!html) return "";

    try {
      const tempDiv = document.createElement("div");
      tempDiv.innerHTML = html;
      return tempDiv.textContent || tempDiv.innerText || "";
    } catch (error) {
      console.error("Error stripping HTML:", error);
      return html.replace(/<[^>]*>?/gm, "");
    }
  };

  // Improve the useEffect with better error handling
  useEffect(() => {
    const fetchData = async () => {
      setIsFetching(true);
      setFetchError(null);

      try {
        // Fetch note data
        const noteResult = await dispatch(getNoteById(id)).unwrap();
        console.log("Note data retrieved:", noteResult); // Debug log

        // Fetch all tags
        await dispatch(getAllTags()).unwrap();

        // Set form state with note data - add extra checks
        if (!noteResult) {
          throw new Error("Note data is empty");
        }

        setTitle(noteResult.title || "");

        // More robust HTML stripping with fallbacks
        try {
          setContent(stripHtml(noteResult.content || ""));
        } catch (contentError) {
          console.error("Error processing note content:", contentError);
          // Fallback to raw content if stripping fails
          setContent(noteResult.content || "");
        }

        setSelectedTags(Array.isArray(noteResult.tags) ? noteResult.tags : []);
        setIsPinned(Boolean(noteResult.isPinned));
        setIsPublic(Boolean(noteResult.isPublic));
      } catch (error) {
        console.error("Error in fetchData:", error); // Detailed error logging
        setFetchError(error?.message || "Failed to fetch note data");
        toast.error(error?.message || "Failed to fetch note data");
      } finally {
        setIsFetching(false);
      }
    };

    fetchData();
  }, [dispatch, id]);

  // Handle tag selection/deselection
  const handleTagToggle = (tagId) => {
    setSelectedTags((prevSelectedTags) => {
      if (prevSelectedTags.includes(tagId)) {
        return prevSelectedTags.filter((id) => id !== tagId);
      } else {
        return [...prevSelectedTags, tagId];
      }
    });
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!title.trim()) {
      toast.error("Title is required");
      return;
    }

    if (!content.trim()) {
      toast.error("Content is required");
      return;
    }

    // Escape HTML characters to prevent HTML injection
    const safeContent = content
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");

    const noteData = {
      id,
      title,
      content: safeContent,
      tags: selectedTags,
      pinned: isPinned, // Ensure this matches your backend model
      isPublic: isPublic, // Be explicit with the property name
    };

    console.log("Submitting note with data:", noteData);

    try {
      await dispatch(updateNote(noteData)).unwrap();
      toast.success("Note updated successfully");
      navigate(`/notes/${id}`);
    } catch (error) {
      toast.error(error?.message || "Failed to update note");
    }
  };

  const handleCancel = () => {
    navigate(`/notes/${id}`);
  };

  // Show loading state while fetching note data
  if (isFetching) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="flex flex-col items-center">
          <FiLoader className="animate-spin h-8 w-8 text-blue-600" />
          <p className="mt-4 text-gray-600">Loading note...</p>
        </div>
      </div>
    );
  }

  // Show error state if note couldn't be fetched
  if (fetchError) {
    return (
      <div className="max-w-4xl mx-auto px-4">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
          <h2 className="text-xl font-semibold text-red-800 mb-2">
            Error Loading Note
          </h2>
          <p className="text-red-600 mb-4">{fetchError}</p>
          <button
            onClick={() => navigate("/notes")}
            className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
          >
            Back to Notes
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Edit Note</h1>

      <form
        onSubmit={handleSubmit}
        className="bg-white rounded-lg shadow-md p-6"
      >
        {/* Title Input */}
        <div className="mb-4">
          <label
            htmlFor="title"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Title
          </label>
          <input
            type="text"
            id="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Note title"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>

        {/* Content Editor */}
        <div className="mb-6">
          <label
            htmlFor="content"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Content
          </label>
          <div className="border border-gray-300 rounded-md min-h-[300px] text-white">
            {" "}
            {/* Changed bg-black to bg-white */}
            {/* Use plain text content for display */}
            <NoteEditor value={content} onChange={setContent} />
          </div>
        </div>

        {/* Tags Section */}
        <div className="mb-5">
          <div className="flex justify-between items-center mb-2">
            <label className="block text-sm font-medium text-gray-700">
              Tags
            </label>
            <button
              type="button"
              onClick={() => setShowTagSelector(!showTagSelector)}
              className="text-sm text-blue-600 flex items-center"
            >
              <FiTag className="mr-1" />
              {showTagSelector ? "Hide Tags" : "Show Tags"}
            </button>
          </div>

          {showTagSelector && (
            <div className="bg-gray-50 p-3 rounded-md border border-gray-200">
              <div className="flex flex-wrap gap-2">
                {tags.map((tag) => (
                  <div
                    key={tag._id}
                    onClick={() => handleTagToggle(tag._id)}
                    className={`px-3 py-1 rounded-full text-sm cursor-pointer transition-colors ${
                      selectedTags.includes(tag._id)
                        ? "bg-blue-100 text-blue-800 border border-blue-300"
                        : "bg-gray-100 text-gray-700 border border-gray-200 hover:bg-gray-200"
                    }`}
                    style={
                      tag.color
                        ? {
                            backgroundColor: `${tag.color}20`,
                            borderColor: tag.color,
                          }
                        : {}
                    }
                  >
                    {tag.name}
                  </div>
                ))}
                {tags.length === 0 && (
                  <p className="text-sm text-gray-500">
                    No tags available. Create tags in the Tags section.
                  </p>
                )}
              </div>
            </div>
          )}

          {selectedTags.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-2">
              {selectedTags.map((tagId) => {
                const tag = tags.find((t) => t._id === tagId);
                return tag ? (
                  <span
                    key={tag._id}
                    className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                    style={
                      tag.color
                        ? {
                            backgroundColor: `${tag.color}20`,
                            color: tag.color,
                          }
                        : {}
                    }
                  >
                    {tag.name}
                    <button
                      type="button"
                      onClick={() => handleTagToggle(tag._id)}
                      className="ml-1 inline-flex items-center justify-center h-4 w-4 rounded-full hover:bg-blue-200"
                    >
                      <span className="sr-only">Remove tag</span>
                      <FiX className="h-3 w-3" />
                    </button>
                  </span>
                ) : null;
              })}
            </div>
          )}
        </div>

        {/* Note Options - Rewritten for more reliability */}
        <div className="mb-6 flex space-x-6">
          {/* Pin checkbox */}
          <div className="flex items-center">
            <input
              id="pin-checkbox"
              type="checkbox"
              checked={isPinned}
              onChange={(e) => {
                const newValue = e.target.checked;
                console.log("isPinned changed to:", newValue);
                setIsPinned(newValue);
              }}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 h-4 w-4 cursor-pointer"
            />
            <label
              htmlFor="pin-checkbox"
              className="ml-2 text-sm text-gray-700 cursor-pointer"
            >
              Pin this note
            </label>
          </div>

          {/* Public checkbox */}
          <div className="flex items-center">
            <input
              id="public-checkbox"
              type="checkbox"
              checked={isPublic}
              onChange={(e) => {
                const newValue = e.target.checked;
                console.log("isPublic changed to:", newValue);
                setIsPublic(newValue);
              }}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 h-4 w-4 cursor-pointer"
            />
            <label
              htmlFor="public-checkbox"
              className="ml-2 text-sm text-gray-700 cursor-pointer"
            >
              Make note public
            </label>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-between">
          <div>{/* Add additional actions like delete if needed */}</div>
          <div className="flex space-x-4">
            <button
              type="button"
              onClick={handleCancel}
              className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className={`px-4 py-2 rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 flex items-center ${
                isLoading ? "opacity-70 cursor-not-allowed" : ""
              }`}
            >
              <FiSave className="mr-2" />
              {isLoading ? "Saving..." : "Update Note"}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};

export default EditNote;
