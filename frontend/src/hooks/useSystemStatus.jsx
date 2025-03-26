import { useState, useEffect } from "react";
import api from "../api/axios";

export const useSystemStatus = () => {
  const [systemStatus, setSystemStatus] = useState({
    isRunning: false,
    message: "Checking system status...",
    lastChecked: null,
    services: {
      api: false,
      database: false,
      redis: false,
    },
    isLoading: true,
    error: null,
  });

  const checkStatus = async () => {
    setSystemStatus((prev) => ({ ...prev, isLoading: true }));
    try {
      const response = await api.get("/health");
      const { status, services } = response.data;

      setSystemStatus({
        isRunning: status === "ok",
        message:
          status === "ok" ? "System is running smoothly" : "System has issues",
        lastChecked: new Date(),
        services: services || {
          api: status === "ok",
          database: status === "ok",
          redis: status === "ok",
        },
        isLoading: false,
        error: null,
      });
    } catch (error) {
      console.error("Error checking system status:", error);
      setSystemStatus({
        isRunning: false,
        message: "System is experiencing issues",
        lastChecked: new Date(),
        services: {
          api: false,
          database: false,
          redis: false,
        },
        isLoading: false,
        error: "Failed to connect to backend",
      });
    }
  };

  useEffect(() => {
    checkStatus();
    // Check status every 5 minutes
    const intervalId = setInterval(checkStatus, 5 * 60 * 1000);

    return () => clearInterval(intervalId);
  }, []);

  return { systemStatus, refreshStatus: checkStatus };
};
