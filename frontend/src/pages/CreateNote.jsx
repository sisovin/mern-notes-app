import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { toast } from "react-hot-toast";
import { FiSave, FiX, FiTag } from "react-icons/fi";
import { createNote } from "../features/notes/notesSlice";
import { getAllTags } from "../features/tags/tagsSlice";
import NoteEditor from "../components/notes/NoteEditor";

const CreateNote = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { isLoading } = useSelector((state) => state.notes);
  const { tags } = useSelector((state) => state.tags);

  // Form state
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [selectedTags, setSelectedTags] = useState([]);
  const [isPinned, setIsPinned] = useState(false);
  const [isPublic, setIsPublic] = useState(false);
  const [showTagSelector, setShowTagSelector] = useState(false);

  // Fetch tags when component mounts
  useEffect(() => {
    dispatch(getAllTags());
  }, [dispatch]);

  const handleTagToggle = (tagId) => {
    setSelectedTags((prevSelectedTags) => {
      if (prevSelectedTags.includes(tagId)) {
        return prevSelectedTags.filter((id) => id !== tagId);
      } else {
        // Find the complete tag to get its name
        const selectedTag = tags.find((t) => t._id === tagId);
        if (!selectedTag) return [...prevSelectedTags, tagId]; // Fallback if tag not found
        return [...prevSelectedTags, tagId]; // Still store the ID for consistency
      }
    });
  };

  // Add this helper function at the top of your component (inside the component function)
  const sanitizeHtml = (html) => {
    if (!html) return "";

    try {
      // Use the browser's DOM to parse and clean the HTML
      const tempDiv = document.createElement("div");
      tempDiv.innerHTML = html;

      return tempDiv.innerHTML;
    } catch (error) {
      console.error("Error sanitizing HTML:", error);
      return html; // Return original if there's an error
    }
  };

  // In your handleSubmit function
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

    // Debug logs to check values before submission
    console.log("Form submission - isPinned value:", isPinned);

    // Sanitize the HTML content to ensure it's clean
    const cleanContent = sanitizeHtml(content);

    // Find the actual tag objects to access their correct properties
    const tagObjects = selectedTags.map((tagId) => {
      const tag = tags.find((t) => t._id === tagId);
      return tag ? tag._id : tagId; // Return the ID, not the whole tag object
    });

    const noteData = {
      title,
      content: cleanContent, // Use sanitized content
      tags: tagObjects, // Send tag IDs, not tag names
      pinned: isPinned, // Make sure this matches your backend model
      isPublic: isPublic, // Be explicit with the property name
    };

    console.log("Submitting note with data:", noteData);

    try {
      const resultAction = await dispatch(createNote(noteData)).unwrap();
      toast.success("Note created successfully");
      navigate(`/notes/${resultAction._id}`);
    } catch (error) {
      toast.error(error || "Failed to create note");
    }
  };

  // Add handleCancel function before the return statement
  const handleCancel = () => {
    // Ask for confirmation if there's content
    if (title.trim() || content.trim()) {
      if (window.confirm("Are you sure you want to discard this note?")) {
        navigate("/notes");
      }
    } else {
      // No content, just navigate
      navigate("/notes");
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Create New Note</h1>

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
          <div className="border border-gray-300 rounded-md min-h-[300px]">
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
                        ? "bg-blue-100 text-blue-800"
                        : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                    }`}
                    style={
                      tag.color
                        ? {
                            backgroundColor: selectedTags.includes(tag._id)
                              ? `${tag.color}20`
                              : `${tag.color}10`,
                            color: tag.color,
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
        <div className="flex justify-end space-x-4">
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
            {isLoading ? "Saving..." : "Save Note"}
          </button>
        </div>
      </form>
    </div>
  );
};

export default CreateNote;
