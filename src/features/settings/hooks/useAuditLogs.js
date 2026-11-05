import { useQuery } from "@tanstack/react-query";
import { useDispatch, useSelector } from "react-redux";
import { settingsKeys } from "../queries/settings.keys";
import auditLogService from "../services/auditLog.service";
import {
  setAuditLogFilters,
  resetAuditLogFilters,
} from "../states/settings.slice";

export const useAuditLogs = () => {
  const dispatch = useDispatch();
  const auditLogFilters = useSelector((state) => state.settings.auditLogFilters);

  const {
    data,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: settingsKeys.auditLogList(auditLogFilters),
    queryFn: () => auditLogService.getAuditLogs(auditLogFilters),
    staleTime: 30 * 1000,
  });

  const updateFilters = (patch) => dispatch(setAuditLogFilters(patch));

  return {
    logs: Array.isArray(data?.logs) ? data.logs : [],
    pagination: data?.pagination || { page: 1, limit: 20, total: 0, totalPages: 0 },
    filters: auditLogFilters,
    isLoading,
    isError,
    error,
    refetch,
    setFilters: updateFilters,
    updateFilters,
    resetFilters: () => dispatch(resetAuditLogFilters()),
  };
};

export default useAuditLogs;
