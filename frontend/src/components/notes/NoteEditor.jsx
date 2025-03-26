import React from "react";

const NoteEditor = ({ value, onChange }) => {
  // Handle changes to the textarea
  const handleChange = (e) => {
    // Pass the plain text value to the parent component
    onChange(e.target.value);
  };

  return (
    <textarea
      value={value || ""}
      onChange={handleChange}
      placeholder="Write your note content here..."
      className="w-full h-[250px] p-3 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
      style={{
        minHeight: "250px",
        fontFamily: "inherit",
        lineHeight: "1.5",
      }}
    />
  );
};

export default NoteEditor;
