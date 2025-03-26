import { useState, useEffect } from "react";
import api from "../api/axios";

// Use specific TTLs for different types of data
const TTL = {
  notes: 5 * 60 * 1000, // 5 minutes
  tags: 15 * 60 * 1000, // 15 minutes
  user: 10 * 60 * 1000, // 10 minutes
};

// Function to check if cache is valid
const isCacheValid = (cachedData, type = "notes") => {
  if (!cachedData) return false;

  const now = new Date().getTime();
  const ttl = TTL[type] || TTL.notes; // Default to notes TTL

  return now - cachedData.timestamp < ttl;
};

/**
 * Custom hook for API calls with caching
 * @param {string} url - API endpoint
 * @param {string} cacheKey - Key for storing in cache
 * @param {string} type - Type of data for TTL
 * @param {boolean} skipCache - Skip cache for this request
 */
const useApiWithCache = (url, cacheKey, type = "notes", skipCache = false) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);

      try {
        // Check cache first
        if (!skipCache) {
          const cachedData = JSON.parse(localStorage.getItem(cacheKey));

          if (cachedData && isCacheValid(cachedData, type)) {
            console.log(`Using cached data for ${cacheKey}`);
            setData(cachedData.data);
            setLoading(false);
            return;
          }
        }

        // Fetch from API
        const response = await api.get(url);

        // Update state
        setData(response.data);
        setLoading(false);

        // Save to cache
        localStorage.setItem(
          cacheKey,
          JSON.stringify({
            data: response.data,
            timestamp: new Date().getTime(),
          })
        );
      } catch (err) {
        setError(err.response?.data?.error || "An error occurred");
        setLoading(false);
      }
    };

    fetchData();
  }, [url, cacheKey, type, skipCache]);

  // Function to invalidate cache
  const invalidateCache = () => {
    localStorage.removeItem(cacheKey);
  };

  // Function to refresh data
  const refreshData = async () => {
    setLoading(true);

    try {
      // Fetch from API
      const response = await api.get(url);

      // Update state
      setData(response.data);
      setLoading(false);

      // Save to cache
      localStorage.setItem(
        cacheKey,
        JSON.stringify({
          data: response.data,
          timestamp: new Date().getTime(),
        })
      );
    } catch (err) {
      setError(err.response?.data?.error || "An error occurred");
      setLoading(false);
    }
  };

  return { data, loading, error, invalidateCache, refreshData };
};

export default useApiWithCache;
