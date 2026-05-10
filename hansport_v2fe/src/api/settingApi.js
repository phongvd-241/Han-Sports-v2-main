import axiosClient, { axiosPublic } from "./axiosSetup";

export const settingApi = {
  getAllSettings() {
    return axiosPublic.get("/api/v1/settings");
  },
  
  updateBulkSettings(updates) {
    return axiosClient.put("/api/v1/settings/bulk", updates);
  }
};
