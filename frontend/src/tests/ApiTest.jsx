import React, { useState } from "react";
import api from "../api/axios"; // Correct path

const ApiTest = () => {
  const [status, setStatus] = useState("Ready to test API connection");
  const [loading, setLoading] = useState(false);

  const testEndpoints = async (endpoint) => {
    setLoading(true);
    setStatus(`Testing API connection to ${endpoint}...`);

    try {
      const response = await api.get(endpoint);
      setStatus(
        `✅ API connected successfully to ${endpoint}: ${JSON.stringify(
          response.data,
          null,
          2
        )}`
      );
    } catch (error) {
      console.error(`API test failed for ${endpoint}:`, error);
      setStatus(
        `❌ API connection failed for ${endpoint}: ${
          error.message
        }\n\nDetails: ${JSON.stringify(error.response?.data || {}, null, 2)}`
      );
    } finally {
      setLoading(false);
    }
  };

  const testAuth = async () => {
    setLoading(true);
    setStatus(`Testing auth login...`);

    // Clear any previous tokens
    localStorage.removeItem("token");
    localStorage.removeItem("refreshToken");
    localStorage.removeItem("tokenId");
    localStorage.removeItem("user");

    // Use actual test credentials from your database
    const testCredentials = {
      email: "admin@niewin.local",
      password: "TestPas$953#&699",
    };

    try {
      // Show what we're sending
      setStatus(`Attempting login with: 
    email: ${testCredentials.email}
    password: ${testCredentials.password.replace(/./g, "*")}
  `);

      // Make the login request
      const response = await api.post("/auth/login", testCredentials);

      // Save the auth data
      if (response.data.token) {
        localStorage.setItem("token", response.data.token);
      }

      if (response.data.refreshToken) {
        localStorage.setItem("refreshToken", response.data.refreshToken);
      }

      // Extract user ID from token or response for tokenId
      const userId = response.data.user?.id;
      if (userId) {
        // Generate a consistent tokenId if not provided by server
        const generatedTokenId = userId;
        localStorage.setItem("tokenId", generatedTokenId);

        // Log that we generated a tokenId
        console.log("Generated tokenId from user ID:", generatedTokenId);
      }

      if (response.data.user) {
        localStorage.setItem("user", JSON.stringify(response.data.user));
      }

      // Show more detailed token information
      const tokenStatus = {
        token: response.data.token ? "✓ Received" : "✗ Missing",
        refreshToken: response.data.refreshToken ? "✓ Received" : "✗ Missing",
        tokenId: response.data.tokenId
          ? "✓ Received from server"
          : userId
          ? "⚠ Generated from userId"
          : "✗ Missing",
        user: response.data.user ? "✓ Received" : "✗ Missing",
      };

      setStatus(
        `✅ Login successful: ${JSON.stringify(response.data, null, 2)}
      
      Token Status:
      ${Object.entries(tokenStatus)
        .map(([key, val]) => `- ${key}: ${val}`)
        .join("\n")}
      `
      );
    } catch (error) {
      console.error("Login test failed:", error);
      setStatus(
        `❌ Login failed: ${error.message}

    Details: ${JSON.stringify(error.response?.data || {}, null, 2)}
    
    Steps to fix:
    1. Check if your credentials are correct
    2. Ensure the auth routes are properly set up
    3. Check your backend server logs for more details
    `
      );
    } finally {
      setLoading(false);
    }
  };

  // Update the testTokenConsolidation function
// Fix the token consolidation test
const testTokenConsolidation = async () => {
  setLoading(true);
  setStatus("Testing token consolidation...");

  try {
    // Get tokenId from localStorage or generate a valid one
    let tokenId = localStorage.getItem("tokenId");

    // If no token ID or token isn't valid, generate a new one
    if (!tokenId) {
      // Generate a valid MongoDB ObjectId - 24 hex characters
      const timestamp = Math.floor(new Date().getTime() / 1000)
        .toString(16)
        .padStart(8, "0");
      const machineId = Math.floor(Math.random() * 16777216)
        .toString(16)
        .padStart(6, "0");
      const processId = Math.floor(Math.random() * 65536)
        .toString(16)
        .padStart(4, "0");
      const counter = Math.floor(Math.random() * 16777216)
        .toString(16)
        .padStart(6, "0");

      tokenId = timestamp + machineId + processId + counter;
      
      // Store the generated tokenId in localStorage
      localStorage.setItem("tokenId", tokenId);
      
      setStatus(
        `No token ID found in localStorage. Generated and stored new test ID: ${tokenId}`
      );
    }

    try {
      // Make the API call
      const response = await api.post("/auth/consolidate-token", { tokenId });

      const { dbToken, redisToken, match } = response.data;
      setStatus(`✅ Token Consolidation Results:
        - Token from Database: ${JSON.stringify(dbToken, null, 2)}
        - Token from Redis: ${JSON.stringify(redisToken, null, 2)}
        - Tokens Match: ${match ? "Yes" : "No"}
      `);

      console.log("Token from database:", dbToken);
      console.log("Token from Redis:", redisToken);
      console.log("Tokens match:", match);
    } catch (err) {
      if (err.response?.status === 404) {
        setStatus(`❌ Token consolidation endpoint not found (404):
          The /auth/consolidate-token endpoint appears to be missing or not properly registered.
          
          Check that: 
          1. The route is defined in authRoutes.js
          2. The controller function is properly exported
          3. The server is properly importing and using the route
        `);
      } else {
        setStatus(`❌ Token consolidation failed: ${err.message}
          
          Details: ${JSON.stringify(err.response?.data || {}, null, 2)}
        `);
      }
    }
  } catch (error) {
    console.error("Token consolidation test failed:", error);
    setStatus(
      `❌ Token consolidation failed: ${error.message}
      
      Details: ${JSON.stringify(error.response?.data || {}, null, 2)}`
    );
  } finally {
    setLoading(false);
  }
  };
  
  const checkToken = () => {
    const token = localStorage.getItem("token");
    setStatus(`Stored token: ${token ? token : "No token found"}`);
  };

  const testBaseUrl = () => {
    setStatus(`
      Current API base URL: ${api.defaults.baseURL}
      
      Environment variables:
      ${JSON.stringify(import.meta.env, null, 2)}
    `);
  };

  return (
    <div className="p-6 max-w-2xl mx-auto my-8 bg-black rounded-lg shadow-md">
      <h2 className="text-xl font-semibold mb-4">API Connection Test</h2>

      <div className="grid grid-cols-2 gap-4 mb-6">
        <button
          onClick={() => testEndpoints("/health")}
          disabled={loading}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
        >
          Test Health Endpoint
        </button>

        <button
          onClick={() => testEndpoints("/notes")}
          disabled={loading}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
        >
          Test Notes Endpoint
        </button>

        <button
          onClick={testAuth}
          disabled={loading}
          className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
        >
          Test Auth Login
        </button>

        <button
          onClick={checkToken}
          disabled={loading}
          className="px-4 py-2 bg-yellow-600 text-white rounded hover:bg-yellow-700 disabled:opacity-50"
        >
          Check Token
        </button>

        <button
          onClick={testTokenConsolidation}
          disabled={loading}
          className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 disabled:opacity-50"
        >
          Test Token Consolidation
        </button>

        <button
          onClick={testBaseUrl}
          className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
        >
          Check Base URL
        </button>
      </div>

      <div className="border border-gray-200 rounded-md p-4 bg-gray-950">
        <h3 className="font-medium mb-2">Result:</h3>
        <pre className="whitespace-pre-wrap text-sm overflow-auto max-h-96">
          {status}
        </pre>

        {loading && (
          <div className="mt-4 flex justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-700"></div>
          </div>
        )}
      </div>

      <div className="mt-4">
        <a href="/login" className="text-blue-600 hover:underline">
          Back to Login
        </a>
      </div>
    </div>
  );
};

export default ApiTest;
