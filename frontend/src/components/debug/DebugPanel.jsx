import React, { useState } from "react";
import { useDispatch } from "react-redux";
import { getNotes } from "../../features/notes/notesSlice";
import api from "../../api/axios";

const DebugPanel = () => {
  const dispatch = useDispatch();
  const [debugInfo, setDebugInfo] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const checkConnection = async () => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem("token");
      setDebugInfo(
        `Auth token exists: ${!!token}\n${
          token ? `Token prefix: ${token.substring(0, 15)}...` : ""
        }`
      );
    } catch (error) {
      setDebugInfo(`Error checking token: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const testDirectFetch = async () => {
    setIsLoading(true);
    try {
      const response = await api.get("/notes");
      setDebugInfo(`API Response: ${JSON.stringify(response.data, null, 2)}`);
    } catch (error) {
      setDebugInfo(
        `API Error: ${error.message}\nStatus: ${
          error.response?.status
        }\nData: ${JSON.stringify(error.response?.data, null, 2)}`
      );
    } finally {
      setIsLoading(false);
    }
  };

  const refreshToken = async () => {
    setIsLoading(true);
    try {
      const refreshToken = localStorage.getItem("refreshToken");
      if (!refreshToken) {
        setDebugInfo("No refresh token available");
        return;
      }

      const response = await api.post("/auth/refresh-token", { refreshToken });
      localStorage.setItem("token", response.data.token);
      localStorage.setItem("refreshToken", response.data.refreshToken);
      setDebugInfo(
        `Token refreshed successfully: ${response.data.token.substring(
          0,
          15
        )}...`
      );
    } catch (error) {
      setDebugInfo(
        `Refresh Error: ${error.message}\nStatus: ${error.response?.status}`
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="mb-6 p-4 bg-white rounded-lg shadow">
      <h3 className="text-lg font-semibold mb-3">Debug Tools</h3>
      <div className="space-x-2 mb-3">
        <button
          onClick={checkConnection}
          className="px-2 py-1 bg-blue-600 text-white text-sm rounded"
          disabled={isLoading}
        >
          Check Auth
        </button>
        <button
          onClick={testDirectFetch}
          className="px-2 py-1 bg-green-600 text-white text-sm rounded"
          disabled={isLoading}
        >
          Test API
        </button>
        <button
          onClick={() => dispatch(getNotes())}
          className="px-2 py-1 bg-purple-600 text-white text-sm rounded"
          disabled={isLoading}
        >
          Dispatch getNotes
        </button>
        <button
          onClick={refreshToken}
          className="px-2 py-1 bg-orange-600 text-white text-sm rounded"
          disabled={isLoading}
        >
          Refresh Token
        </button>
      </div>
      {isLoading && <div className="text-sm mb-2">Loading...</div>}
      {debugInfo && (
        <pre className="text-xs bg-gray-90 p-2 rounded max-h-40 overflow-auto whitespace-pre-wrap text-black">
          {debugInfo}
        </pre>
      )}
    </div>
  );
};

export default DebugPanel;
