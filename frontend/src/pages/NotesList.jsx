import React, { useEffect, useState, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link } from "react-router-dom";
import { PlusIcon, TagIcon } from "@heroicons/react/24/outline";
import { StarIcon, BookmarkIcon } from "@heroicons/react/24/solid";
import { getNotes } from "../features/notes/notesSlice";
import { getAllTags } from "../features/tags/tagsSlice";
import { toast } from "react-hot-toast";

const NotesList = () => {
  const dispatch = useDispatch();
  const { notes = [], isLoading, error } = useSelector((state) => state.notes);
  const { tags = [] } = useSelector((state) => state.tags);
  const [selectedTag, setSelectedTag] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortType, setSortType] = useState("date"); // 'date', 'title', etc.
  const [viewMode, setViewMode] = useState("grid"); // 'grid' or 'list'

  // Debug logs
  useEffect(() => {
    console.log("Notes from Redux store:", notes);
    console.log("Is loading:", isLoading);
    console.log("Error:", error);
  }, [notes, isLoading, error]);

  useEffect(() => {
    dispatch(getNotes());
    dispatch(getAllTags());
  }, [dispatch]);

  useEffect(() => {
    if (error) {
      toast.error(error);
    }
  }, [error]);

  // Update your filtering code in NotesList component
  const filteredNotes = useMemo(() => {
    return Array.isArray(notes)
      ? notes.filter((note) => {
          // Tag filter
          if (selectedTag) {
            // Handle both object tags and ID tags
            const noteTags = note.tags || [];
            const hasTag = noteTags.some(
              (tag) =>
                // Handle both formats: tag object or tag ID string
                (tag._id && tag._id === selectedTag) || tag === selectedTag
            );
            if (!hasTag) return false;
          }

          // Search filter
          if (
            searchTerm &&
            !note.title?.toLowerCase().includes(searchTerm.toLowerCase()) &&
            !note.content?.toLowerCase().includes(searchTerm.toLowerCase())
          ) {
            return false;
          }

          return true;
        })
      : [];
  }, [notes, selectedTag, searchTerm]);

  // Sort notes using useMemo
  const sortedNotes = useMemo(() => {
    return [...filteredNotes].sort((a, b) => {
      switch (sortType) {
        case "title":
          return a.title?.localeCompare(b.title);
        case "dateOld":
          return new Date(a.updatedAt) - new Date(b.updatedAt);
        case "date":
        default:
          return new Date(b.updatedAt) - new Date(a.updatedAt);
      }
    });
  }, [filteredNotes, sortType]);

  // Debug filtered notes
  useEffect(() => {
    console.log("Filtered notes:", filteredNotes);
    console.log("Sorted notes:", sortedNotes);
  }, [filteredNotes, sortedNotes]);

  // Handle tag selection
  const handleTagClick = (tagId) => {
    setSelectedTag(tagId === selectedTag ? null : tagId);
  };

  // Handle search
  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
  };

  // Handle sort change
  const handleSortChange = (e) => {
    setSortType(e.target.value);
  };

  // Handle view mode change
  const toggleViewMode = () => {
    if (viewMode === "grid") {
      setViewMode("list");
    } else if (viewMode === "list") {
      setViewMode("dropdown");
    } else {
      setViewMode("grid");
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">All Notes</h1>
        <Link
          to="/create"
          className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          <PlusIcon className="h-5 w-5 mr-1" />
          New Note
        </Link>
      </div>
      {/* Add Debug Panel - remove in production */}
      {/* <DebugPanel /> */}

      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <div className="flex flex-col sm:flex-row justify-between gap-4">
          {/* Search */}
          <div className="relative flex-grow">
            <input
              type="text"
              placeholder="Search notes..."
              value={searchTerm}
              onChange={handleSearch}
              className="w-full pl-10 pr-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <div className="absolute inset-y-0 left-0 flex items-center pl-3">
              <svg
                className="h-5 w-5 text-gray-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
            </div>
          </div>

          {/* Sort and View Mode */}
          <div className="flex items-center gap-3">
            <select
              value={sortType}
              onChange={handleSortChange}
              className="px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="date">Newest First</option>
              <option value="dateOld">Oldest First</option>
              <option value="title">Title (A-Z)</option>
            </select>

            <button
              onClick={toggleViewMode}
              className="p-2 border rounded-md hover:bg-gray-100"
              title={`Current view: ${viewMode}`}
            >
              {viewMode === "grid" ? (
                <svg
                  className="h-5 w-5 text-gray-600"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 6h16M4 12h16M4 18h16"
                  />
                </svg>
              ) : viewMode === "list" ? (
                <svg
                  className="h-5 w-5 text-gray-600"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 5h16M4 8h16M4 11h16M4 14h16M4 17h16M4 20h16"
                  />
                </svg>
              ) : (
                <svg
                  className="h-5 w-5 text-gray-600"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6z"
                  />
                </svg>
              )}
            </button>
          </div>
        </div>

        {/* Tags */}
        {tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-4 pb-3 border-b">
            <div className="flex items-center mr-2">
              <TagIcon className="h-4 w-4 mr-1 text-gray-500" />
              <span className="text-sm font-medium text-gray-700">Tags:</span>
            </div>
            {tags.map((tag) => {
              // Handle different tag formats (object or string ID)
              const tagId = typeof tag === "object" ? tag._id : tag;
              const tagName =
                typeof tag === "object" && tag.name
                  ? tag.name
                  : typeof tag === "string" && tag.length < 30
                  ? tag
                  : `Tag ${tagId?.slice(-4) || ""}`;

              return (
                <button
                  key={tagId || `tag-${Math.random()}`}
                  onClick={() => handleTagClick(tagId)}
                  className={`px-3 py-1 text-sm rounded-full ${
                    selectedTag === tagId
                      ? "bg-blue-100 text-blue-800"
                      : "bg-gray-100 text-gray-800 hover:bg-gray-200"
                  }`}
                >
                  {tagName}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Notes Display */}
      {isLoading ? (
        <div className="flex justify-center py-10">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
        </div>
      ) : error ? (
        <div className="text-center py-10">
          <p className="text-red-500 text-lg mb-4">Error loading notes</p>
          <p className="text-gray-500">{error}</p>
          <button
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            onClick={() => dispatch(getNotes())}
          >
            Try Again
          </button>
        </div>
      ) : !Array.isArray(notes) || notes.length === 0 ? (
        <div className="text-center py-10">
          <p className="text-gray-500 text-lg mb-4">No notes found</p>
          <p className="text-gray-400">
            {searchTerm || selectedTag
              ? "Try adjusting your search or filters"
              : "Create your first note to get started"}
          </p>
          <div className="mt-6">
            <Link
              to="/create"
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              <PlusIcon className="h-5 w-5 mr-1" />
              Create New Note
            </Link>
          </div>
        </div>
      ) : sortedNotes.length > 0 ? (
        <div
          className={
            viewMode === "grid"
              ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
              : "space-y-4"
          }
        >
          {viewMode === "dropdown"
            ? sortedNotes
                .slice(0, 2)
                .map((note) => (
                  <NoteCard
                    key={note._id}
                    note={note}
                    viewMode={viewMode}
                    allTags={tags}
                  />
                ))
            : sortedNotes.map((note) => (
                <NoteCard
                  key={note._id}
                  note={note}
                  viewMode={viewMode}
                  allTags={tags}
                />
              ))}
        </div>
      ) : (
        <div className="text-center py-10">
          <p className="text-gray-500 text-lg mb-4">
            No notes match your filters
          </p>
          <p className="text-gray-400">Try adjusting your search or filters</p>
        </div>
      )}
    </div>
  );
};

// Note card component
const NoteCard = ({ note, viewMode, allTags }) => {
  if (!note) return null;

  // Function to get tag name by id
  const getTagNameById = (tagId) => {
    const foundTag = allTags?.find(
      (tag) => (typeof tag === "object" && tag._id === tagId) || tag === tagId
    );
    return foundTag && typeof foundTag === "object"
      ? foundTag.name
      : tagId?.slice(0, 10) || "Unknown";
  };

  // Removed the unused truncateText function

  return (
    <Link
      to={`/notes/${note._id}`}
      className={`block transition-shadow duration-200 ${
        viewMode === "grid"
          ? "bg-gray-100 rounded-lg shadow hover:shadow-md h-full"
          : viewMode === "list"
          ? "bg-gray-100 rounded-lg shadow hover:shadow-md flex"
          : "bg-gray-100 rounded-lg shadow hover:shadow-md flex flex-col border-l-4 border-blue-500"
      }`}
    >
      <div
        className={
          viewMode === "grid"
            ? "p-4 h-full flex flex-col"
            : "p-4 flex-grow flex flex-col"
        }
      >
        <div className="flex justify-between items-start mb-2">
          <h3
            className={`font-medium text-gray-900 ${
              viewMode === "grid" ? "text-lg line-clamp-1" : "text-xl"
            }`}
          >
            {note.title}
          </h3>
          <div className="flex items-center space-x-1">
            {note.pinned && (
              <BookmarkIcon className="h-4 w-4 text-yellow-500" />
            )}
            {note.important && <StarIcon className="h-4 w-4 text-yellow-500" />}
          </div>
        </div>

        <p
          className={`text-gray-600 ${
            viewMode === "grid" ? "text-sm line-clamp-3" : "line-clamp-2"
          }`}
        >
          {/* Use plain text content for display */}
          {note.content}
        </p>

        <div className="mt-auto pt-3">
          {/* Tags */}
          {note.tags && note.tags.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-3">
              {note.tags
                .slice(0, viewMode === "grid" ? 3 : 5)
                .map((tag, index) => (
                  <span
                    key={
                      typeof tag === "object" ? tag._id : tag || `tag-${index}`
                    }
                    className="bg-gray-100 text-gray-600 text-xs px-2 py-0.5 rounded"
                  >
                    {typeof tag === "object" ? tag.name : getTagNameById(tag)}
                  </span>
                ))}
              {note.tags.length > (viewMode === "grid" ? 3 : 5) && (
                <span
                  key="more-tags"
                  className="bg-gray-100 text-gray-600 text-xs px-2 py-0.5 rounded"
                >
                  +{note.tags.length - (viewMode === "grid" ? 3 : 5)}
                </span>
              )}
            </div>
          )}

          {/* Date */}
          <div className="text-xs text-gray-500 mt-2">
            {new Date(note.updatedAt).toLocaleDateString(undefined, {
              year: "numeric",
              month: "short",
              day: "numeric",
            })}
          </div>
        </div>
      </div>
    </Link>
  );
};

export default NotesList;
