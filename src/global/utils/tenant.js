const TENANT_STORAGE_KEY = "hq_tenant_slug";

export const getTenantSlug = () => {
    const hostname = window.location.hostname;

    /*
     * LOCAL DEVELOPMENT
     *
     * First visit:
     * localhost:5173/?slug=xyz
     *
     * After that:
     * localhost:5173/
     *
     * because xyz is stored in localStorage.
     */
    if (
        hostname === "localhost" ||
        hostname === "127.0.0.1"
    ) {
        const params = new URLSearchParams(
            window.location.search
        );

        const urlSlug = params.get("slug");

        if (urlSlug) {
            localStorage.setItem(
                TENANT_STORAGE_KEY,
                urlSlug
            );

            return urlSlug;
        }

        return localStorage.getItem(
            TENANT_STORAGE_KEY
        );
    }

    /*
     * PRODUCTION
     *
     * xyz.hq.com
     *     ↓
     *   xyz
     */
    const parts = hostname.split(".");

    if (parts.length >= 3) {
        const subdomain = parts[0].toLowerCase();
        // Reserved subdomains that are not tenant workspaces
        if (subdomain === "api" || subdomain === "realtime" || subdomain === "www") {
            return null;
        }
        return subdomain;
    }

    return null;
};

export const clearTenantStorage = () => {
    localStorage.removeItem(TENANT_STORAGE_KEY);
};