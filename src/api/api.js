import axios from "axios";
import { store } from "@/app/store/store";

const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL || "http://localhost:3000/api",
    withCredentials: true,
});

api.interceptors.request.use(
    (config) => {
        const tenantSlug =
            store.getState().tenant.slug;

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