import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link, useNavigate } from "react-router-dom";
import {
  PlusIcon,
  TagIcon,
  BookmarkIcon,
  StarIcon,
} from "@heroicons/react/24/outline";
import {
  BookmarkIcon as BookmarkSolidIcon,
  StarIcon as StarSolidIcon,
} from "@heroicons/react/24/solid";
import { getNotes } from "../features/notes/notesSlice";
import { getAllTags } from "../features/tags/tagsSlice";
import { toast } from "react-hot-toast";
import { getUserDisplayName } from "../utils/userUtils";

const Dashboard = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.auth);

  const {
    notes = [], // Provide a default empty array to prevent undefined errors
    isLoading: notesLoading,
    error: notesError,
  } = useSelector((state) => state.notes);
  const { tags = [], isLoading: tagsLoading } = useSelector(
    (state) => state.tags
  );
  const [selectedTag, setSelectedTag] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");

  // Redirect admin users to the admin dashboard
  useEffect(() => {
    if (user?.role?.name === "admin") {
      navigate("/admin", { replace: true });
    }
  }, [user, navigate]);

  // Fetch notes and tags on component mount
  useEffect(() => {
    dispatch(getNotes());
    dispatch(getAllTags());
  }, [dispatch]);

  useEffect(() => {
    console.log("Tags:", tags); // Debugging line
  }, [tags]);

  useEffect(() => {
    console.log("Notes:", notes); // Debugging line
  }, [notes]);

  // Show error toast if notes fetch fails
  useEffect(() => {
    if (notesError) {
      toast.error(notesError);
    }
  }, [notesError]);

  // Filter notes by tags and search term - with null check
  const filteredNotes = Array.isArray(notes)
    ? notes.filter((note) => {
        // If a tag is selected, filter by tag
        if (selectedTag) {
          // Check if note.tags is an array of objects with _id property
          if (
            Array.isArray(note.tags) &&
            note.tags.some(
              (tag) => typeof tag === "object" && tag._id === selectedTag
            )
          ) {
            // Match found - this note has the selected tag as an object with _id
            // Return true to keep this note in the filtered results
            return true;
          } else if (
            Array.isArray(note.tags) &&
            note.tags.includes(selectedTag)
          ) {
            // For cases where tags might be stored as plain IDs
            // Return true to keep this note in the filtered results
            return true;
          } else {
            // No match found for the selected tag
            return false;
          }
        }

        // Filter by search term if present
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

  // Get pinned notes and recent notes
  const pinnedNotes = filteredNotes.filter((note) => note.pinned);
  const recentNotes = filteredNotes
    .filter((note) => !note.pinned)
    .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))
    .slice(0, 6);

  // Handle tag selection
  const handleTagClick = (tagId) => {
    setSelectedTag(selectedTag === tagId ? null : tagId);
  };

  // Handle search
  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
  };

  // Function to calculate total notes
  const totalNotes = (notes) => {
    return notes.length;
  };

  // Function to calculate pinned notes
  const pinnedNotesCount = (notes) => {
    return notes.filter((note) => note.pinned).length;
  };

  // Function to calculate unique tags count
  const countTags = () => {
    const uniqueTags = new Set(tags.map((tag) => tag._id));

    if (tags && tags.length > 0) {
      tags.forEach((tag) => {
        uniqueTags.add(tag._id);
      });
    }

    console.log("Unique tags:", Array.from(uniqueTags)); // Debugging line
    return uniqueTags.size;
  };

  return (
    <div className="container mx-auto px-4 py-6">
      {/* Header and Search */}
      <div className="mb-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">
              Welcome back, {user ? getUserDisplayName(user) : "User"}!
            </h1>
            <p className="text-gray-600 mt-1">
              {new Date().toLocaleDateString("en-US", {
                weekday: "long",
                month: "long",
                day: "numeric",
              })}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <div className="relative">
              <input
                type="text"
                placeholder="Search notes..."
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                value={searchTerm}
                onChange={handleSearch}
              />
              <svg
                className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400"
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

            <Link
              to="/create"
              className="flex items-center gap-1 bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 transition-colors duration-200"
            >
              <PlusIcon className="h-5 w-5" />
              <span>New Note</span>
            </Link>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Sidebar */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg shadow p-4 mb-6">
            <h2 className="font-semibold text-lg mb-3 flex items-center text-black">
              <TagIcon className="h-5 w-5 mr-2 text-primary-500" />
              Tags
            </h2>
            <div className="flex flex-wrap gap-2">
              {tagsLoading ? (
                <p>Loading tags...</p>
              ) : tags && tags.length > 0 ? (
                tags.map((tag) => (
                  <button
                    key={tag._id}
                    onClick={() => handleTagClick(tag._id)}
                    className={`px-3 py-1 rounded-full text-sm font-medium ${
                      selectedTag === tag._id
                        ? "bg-primary-100 text-primary-800 border border-primary-300"
                        : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                    }`}
                  >
                    {tag.name}
                  </button>
                ))
              ) : (
                <p className="text-gray-500 text-sm">No tags found</p>
              )}
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-4">
            <h2 className="font-semibold text-lg mb-3 text-black">
              Quick Stats
            </h2>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Total Notes</span>
                <span className="font-semibold  text-black">
                  {totalNotes(notes)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Pinned Notes</span>
                <span className="font-semibold  text-black">
                  {pinnedNotesCount(notes)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Tags</span>
                <span className="font-semibold text-black">
                  {countTags(notes)}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Main content */}
        <div className="lg:col-span-3 space-y-6">
          {/* Pinned notes */}
          <section>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-800 flex items-center">
                <BookmarkSolidIcon className="h-5 w-5 mr-2 text-yellow-500" />
                Pinned Notes
              </h2>
              {pinnedNotes.length > 0 && (
                <Link
                  to="/notes?pinned=true"
                  className="text-primary-600 hover:text-primary-800 text-sm"
                >
                  View all →
                </Link>
              )}
            </div>

            {notesLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-pulse">
                {[1, 2].map((i) => (
                  <div key={i} className="bg-white rounded-lg shadow p-4 h-40">
                    <div className="h-5 bg-gray-200 rounded w-3/4 mb-4"></div>
                    <div className="h-3 bg-gray-200 rounded w-full mb-2"></div>
                    <div className="h-3 bg-gray-200 rounded w-5/6 mb-2"></div>
                    <div className="h-3 bg-gray-200 rounded w-4/6"></div>
                  </div>
                ))}
              </div>
            ) : pinnedNotes.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {pinnedNotes.map((note) => (
                  <NoteCard key={note._id} note={note} />
                ))}
              </div>
            ) : (
              <div className="bg-gray-50 border border-dashed border-gray-300 rounded-lg p-6 text-center">
                <BookmarkIcon className="h-12 w-12 mx-auto text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">
                  No pinned notes
                </h3>
                <p className="mt-1 text-sm text-gray-500">
                  Pin important notes to access them quickly.
                </p>
              </div>
            )}
          </section>

          {/* Recent notes */}
          <section>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-800 flex items-center">
                <StarSolidIcon className="h-5 w-5 mr-2 text-primary-500" />
                Recent Notes
              </h2>
              <Link
                to="/notes"
                className="text-primary-600 hover:text-primary-800 text-sm"
              >
                View all →
              </Link>
            </div>

            {notesLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 animate-pulse">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <div key={i} className="bg-white rounded-lg shadow p-4 h-40">
                    <div className="h-5 bg-gray-200 rounded w-3/4 mb-4"></div>
                    <div className="h-3 bg-gray-200 rounded w-full mb-2"></div>
                    <div className="h-3 bg-gray-200 rounded w-5/6 mb-2"></div>
                    <div className="h-3 bg-gray-200 rounded w-4/6"></div>
                  </div>
                ))}
              </div>
            ) : recentNotes.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {recentNotes.map((note) => (
                  <NoteCard key={note._id} note={note} />
                ))}
              </div>
            ) : (
              <div className="bg-gray-50 border border-dashed border-gray-300 rounded-lg p-6 text-center">
                <StarIcon className="h-12 w-12 mx-auto text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">
                  No recent notes
                </h3>
                <p className="mt-1 text-sm text-gray-500">
                  Get started by creating your first note.
                </p>
                <Link
                  to="/create"
                  className="mt-6 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                >
                  <PlusIcon className="h-5 w-5 mr-2" />
                  Create Note
                </Link>
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
};

// Make sure NoteCard component is defined
const NoteCard = ({ note }) => {
  // Get auth token from redux store - place hooks at the top level
  const { token } = useSelector((state) => state.auth);
  
  if (!note) return null;

  const handleNoteClick = (e) => {
    // Check if we need to handle the navigation manually
    if (!token) {
      e.preventDefault();
      toast.error("You need to be logged in to view this note");
      // Could also redirect to login here if needed
    }
    // Optionally add logging for debugging
    console.log("Navigating to note:", note._id);
  };

  return (
    <Link 
      to={`/notes/${note._id}`} 
      className="block h-full"
      onClick={handleNoteClick}
    >
      <div className="bg-white rounded-lg shadow p-4 h-full hover:shadow-md transition-shadow duration-200">
        <h3 className="font-medium text-lg mb-2 text-gray-900 line-clamp-1">
          {note.title}
        </h3>
        <p className="text-gray-600 text-sm line-clamp-3">{note.content}</p>

        {note.tags && note.tags.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1">
            {note.tags.slice(0, 3).map((tag, index) => (
              <span
                key={tag._id || index} // Use tag._id if available, fallback to index
                className="bg-gray-100 text-gray-600 text-xs px-2 py-0.5 rounded"
              >
                {tag.name}
              </span>
            ))}
            {note.tags.length > 3 && (
              <span
                key={`extra-tags-${note._id}`} // Ensure a unique key for the "+X" span
                className="bg-gray-100 text-gray-600 text-xs px-2 py-0.5 rounded"
              >
                +{note.tags.length - 3}
              </span>
            )}
          </div>
        )}

        <div className="mt-3 flex items-center justify-between text-xs text-gray-500">
          <span>
            {new Date(note.updatedAt).toLocaleDateString(undefined, {
              month: "short",
              day: "numeric",
            })}
          </span>
          {note.pinned && (
            <BookmarkSolidIcon className="h-4 w-4 text-yellow-500" />
          )}
        </div>
      </div>
    </Link>
  );
};


export default Dashboard;
