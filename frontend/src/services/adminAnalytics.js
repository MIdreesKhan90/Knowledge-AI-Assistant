import api from "./axios";

export const getAdminAnalytics = async () => {
    const response = await api.get("/analytics/admin-overview");
    return response.data;
};
