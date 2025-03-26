import React from "react";
import { Link } from "react-router-dom";
import { FiAlertTriangle, FiHome, FiArrowLeft } from "react-icons/fi";

const Unauthorized = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="max-w-md w-full space-y-8 text-center">
        <div className="flex flex-col items-center">
          <FiAlertTriangle className="h-16 w-16 text-yellow-500" />
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
            Access Denied
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            You don't have permission to access this page.
          </p>
        </div>

        <div className="flex flex-col gap-4">
          <Link
            to="/"
            className="inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
          >
            <FiHome className="mr-2 -ml-1 h-5 w-5" />
            Go to Dashboard
          </Link>

          <button
            onClick={() => window.history.back()}
            className="inline-flex items-center justify-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
          >
            <FiArrowLeft className="mr-2 -ml-1 h-5 w-5" />
            Go Back
          </button>
        </div>
      </div>
    </div>
  );
};

export default Unauthorized;
