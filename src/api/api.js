import axios from "axios";
import { store } from "@/app/store/store";

const API_BASE_URL = (import.meta.env.VITE_API_URL || "http://localhost:3000/api").replace(/\/+$/, "");

const api = axios.create({
    baseURL: API_BASE_URL,
    withCredentials: true,
});

api.interceptors.request.use(
    (config) => {
        const tenantSlug =
            store.getState().tenant.slug;
        console.log("Tenant Slug from store:", tenantSlug);
        if (tenantSlug) {
            config.headers["X-Tenant-Slug"] =
                tenantSlug;
        }

        return config;
    },

    (error) => {
        return Promise.reject(error);
    }
);

export default api;