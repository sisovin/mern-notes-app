import React, { useState } from "react";
import api from "../../api/axios";

const ApiTester = () => {
  const [endpoints, setEndpoints] = useState([
    { name: "Roles", path: "/roles", status: "Not tested" },
    { name: "Users", path: "/users", status: "Not tested" },
    { name: "Check Auth", path: "/auth/me", status: "Not tested" },
    {
      name: "Check Admin",
      path: "/auth/check-permission?role=admin",
      status: "Not tested",
    },
  ]);
  const [loading, setLoading] = useState(false);
  const [token] = useState(localStorage.getItem("token") || "");
  // Removed unused error state

  const testEndpoint = async (endpoint, index) => {
    try {
      setLoading(true);
      // Removed setError call as error state is no longer used

      const updatedEndpoints = [...endpoints];
      updatedEndpoints[index].status = "Testing...";
      setEndpoints(updatedEndpoints);

      console.log(`Testing endpoint: ${endpoint.path}`);
      const response = await api.get(endpoint.path);

      updatedEndpoints[index].status = `Success (${response.status})`;
      updatedEndpoints[index].response =
        JSON.stringify(response.data, null, 2).substring(0, 200) +
        (JSON.stringify(response.data, null, 2).length > 200 ? "..." : "");
      setEndpoints(updatedEndpoints);
    } catch (error) {
      console.error(`Error testing ${endpoint.path}:`, error);

      const updatedEndpoints = [...endpoints];
      updatedEndpoints[index].status = `Error: ${
        error.response?.status || "Network Error"
      }`;
      updatedEndpoints[index].error =
        error.response?.data?.error || error.message;
      setEndpoints(updatedEndpoints);

      // Removed setError call as error state is no longer used
    } finally {
      setLoading(false);
    }
  };

  const testAll = async () => {
    for (let i = 0; i < endpoints.length; i++) {
      await testEndpoint(endpoints[i], i);
    }
  };

  return (
    <div className="p-4 bg-white rounded-lg shadow">
      <h2 className="text-lg font-bold mb-4 text-black">API Tester</h2>

      <div className="mb-4">
        <p className="font-mono text-xs mb-2 text-gray-700">
          Current token:
          <span className="ml-2 bg-gray-100 p-1 rounded">
            {token ? `${token.substring(0, 15)}...` : "No token found"}
          </span>
        </p>
      </div>

      <div className="space-y-4">
        <div className="flex space-x-2">
          <button
            onClick={testAll}
            disabled={loading}
            className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-blue-300"
          >
            Test All Endpoints
          </button>
        </div>

        <div className="border rounded overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Endpoint
                </th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Path
                </th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Action
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {endpoints.map((endpoint, index) => (
                <tr key={index}>
                  <td className="px-4 py-2 whitespace-nowrap text-black">
                    {endpoint.name}
                  </td>
                  <td className="px-4 py-2 whitespace-nowrap font-mono text-xs text-black">
                    {endpoint.path}
                  </td>
                  <td
                    className={`px-4 py-2 whitespace-nowrap ${
                      endpoint.status.includes("Success")
                        ? "text-green-600"
                        : endpoint.status.includes("Error")
                        ? "text-red-600"
                        : ""
                    }`}
                  >
                    {endpoint.status}
                  </td>
                  <td className="px-4 py-2 whitespace-nowrap">
                    <button
                      onClick={() => testEndpoint(endpoint, index)}
                      disabled={loading}
                      className="px-2 py-1 bg-gray-200 text-gray-800 text-sm rounded hover:bg-gray-300 disabled:bg-gray-100"
                    >
                      Test
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {endpoints.some((e) => e.response) && (
          <div className="mt-4">
            <h3 className="font-bold mb-2 text-black">Responses:</h3>
            {endpoints.map(
              (endpoint, index) =>
                endpoint.response && (
                  <div key={`resp-${index}`} className="mb-3 text-black">
                    <p className="font-bold text-sm">{endpoint.name}:</p>
                    <pre className="bg-gray-100 p-2 rounded text-xs overflow-auto max-h-40">
                      {endpoint.response}
                    </pre>
                  </div>
                )
            )}
          </div>
        )}

        {endpoints.some((e) => e.error) && (
          <div className="mt-4">
            <h3 className="font-bold text-red-600 mb-2">Errors:</h3>
            {endpoints.map(
              (endpoint, index) =>
                endpoint.error && (
                  <div key={`err-${index}`} className="mb-3">
                    <p className="font-bold text-sm">{endpoint.name}:</p>
                    <pre className="bg-red-50 text-red-600 p-2 rounded text-xs overflow-auto max-h-40">
                      {endpoint.error}
                    </pre>
                  </div>
                )
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ApiTester;
