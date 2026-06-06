import axiosInstance from "./axiosSetup";

export const dashboardApi = {
  getSummary: () => axiosInstance.get("/api/v1/admin/dashboard/summary"),
};
