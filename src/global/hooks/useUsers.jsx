import { useQuery } from "@tanstack/react-query";
import { getUsersByTenant } from "../services/tenant.service";

/**
 * Hook to query and search users within the current tenant.
 *
 * @param {object} params
 * @param {number} [params.page=1]
 * @param {number} [params.limit=20]
 * @param {string} [params.search=""]
 * @param {string} [params.status]
 * @param {string} [params.role]
 */
export const useUsers = ({ page = 1, limit = 20, search = "", status, role, enabled } = {}) => {
  return useQuery({
    queryKey: ["users", { page, limit, search, status, role }],
    queryFn: () => getUsersByTenant({ page, limit, search, status, role }),
    placeholderData: (previousData) => previousData, // TanStack Query v5 uses placeholderData instead of keepPreviousData
    enabled: enabled !== undefined ? enabled : true,
  });
};
