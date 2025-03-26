import React from "react";
import { Link } from "react-router-dom";

const Register = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h1 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Create a new account
          </h1>
          <p className="mt-2 text-center text-sm text-gray-600">
            Or{" "}
            <Link
              to="/login"
              className="font-medium text-blue-600 hover:text-blue-500"
            >
              sign in to your existing account
            </Link>
          </p>
        </div>
        <div className="mt-8 p-6 bg-white rounded-lg shadow">
          <p className="text-center">Registration form will go here</p>
          <Link to="/" className="mt-4 block text-center text-blue-600">
            Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Register;
