import api from "./axios";

// Get all users with optional search
export const getAdminUsers = async (search = "") => {
    const response = await api.get("/admin/users", {
        params: search ? { search } : {},
    });

    return response.data;
};

// Activate or deactivate user
export const updateUserStatus = async (userId, isActive) => {
    const response = await api.patch(
        `/admin/users/${userId}/status`,
        { is_active: isActive }
    );

    return response.data;
};

// Change user role
export const updateUserRole = async (userId, role) => {
    const response = await api.patch(
        `/admin/users/${userId}/role`,
        { role }
    );

    return response.data;
};
