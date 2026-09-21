/**
 * Productivity service headers helper.
 *
 * The API gateway (express-http-proxy) already injects x-tenant-id and x-user-id
 * from the verified JWT session via proxyReqOptDecorator.
 *
 * We only need to send X-Tenant-Slug (already handled by api.js interceptor).
 * Do NOT override x-tenant-id / x-user-id from the frontend — the backend
 * reads them from gateway-injected headers, not from the browser.
 *
 * This file exists so all productivity services import from one place and
 * can be updated together if headers change.
 */
export const getHeaders = () => ({});
