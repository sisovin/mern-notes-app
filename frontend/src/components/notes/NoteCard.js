import React from "react";
import { Link } from "react-router-dom";
import { BookmarkIcon } from "@heroicons/react/24/solid";
import { StarIcon } from "@heroicons/react/24/solid";

// Note card component
const NoteCard = ({ note, viewMode, allTags }) => {
  if (!note) return null;

  // Function to get tag name by id
  const getTagNameById = (tagId) => {
     if (!tagId) return "Unknown";
     if (!allTags || !allTags.length) return tagId.slice(0, 10);

     const foundTag = allTags.find(
       (tag) => (typeof tag === "object" && tag._id === tagId) || tag === tagId
     );
     return foundTag && typeof foundTag === "object"
       ? foundTag.name
       : tagId.slice(0, 10);
  };

  // Helper function to strip HTML content
  const stripHtml = (html) => {
    if (!html) return "";
    
    try {
      // For browser environments - most reliable method for stripping HTML
      const tempDiv = document.createElement("div");
      tempDiv.innerHTML = html;
      
      // Get plain text and trim extra whitespace
      let plainText = tempDiv.textContent || tempDiv.innerText || "";
      plainText = plainText.replace(/\s+/g, " ").trim();
      
      return plainText;
    } catch (error) {
      console.error("Error stripping HTML:", error);
      
      // Aggressive fallback approach to strip HTML
      return html
        .replace(/<[^>]*>/g, '') // Remove all HTML tags
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&amp;/g, '&')
        .replace(/&quot;/g, '"')
        .replace(/&nbsp;/g, ' ')
        .replace(/&#39;/g, "'") 
        .replace(/\\"/g, '"')
        .replace(/\s+/g, ' ')
        .trim();
    }
  };

  // Get plain text content for display
  const plainContent = stripHtml(note.content || "");

  return (
    <Link
      to={`/notes/${note._id}`}
      className={`block transition-shadow duration-200 ${
        viewMode === "grid"
          ? "bg-white rounded-lg shadow hover:shadow-md h-full"
          : viewMode === "list"
          ? "bg-white rounded-lg shadow hover:shadow-md flex"
          : "bg-white rounded-lg shadow hover:shadow-md flex flex-col border-l-4 border-blue-500"
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
          {plainContent}
        </p>

        {/* Rest of your component remains the same */}

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

export default NoteCard;
