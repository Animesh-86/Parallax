import axios from "axios";

const api = axios.create({
    baseURL: "http://localhost:8080",
});

// Inject token automatically
api.interceptors.request.use((config) => {
    const token = localStorage.getItem("access_token");
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

// Helper to handle API errors consistently
export const handleApiError = (error: any) => {
    if (axios.isAxiosError(error)) {
        const message = error.response?.data?.message || error.message || "An unexpected error occurred";
        // Preserve status code for specific handling (401, 404, 409)
        const status = error.response?.status;
        return { message, status };
    }
    return { message: "An unexpected error occurred", status: 500 };
};

export default api;
