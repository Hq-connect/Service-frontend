import api from "@/api/api";


export const authService = {
    registerUser: async (userData) => {
        const response = await api.post("/auth/register", userData);
        return response.data;
    },
    verifyInvitation: async (token) => {
        const response = await api.post("/auth/invitations/verify", { token });
        return response.data.data?.invitation || null;
    },
    loginUser: async (userData) => {
        const response = await api.post("/auth/login", userData);
        return response.data;
    },
    logoutUser: async () => {
        const response = await api.post("/auth/logout");
        return response.data;
    },
    getCurrentUser: async () => {
        const response = await api.get("/me");
        return response.data;
    }
};