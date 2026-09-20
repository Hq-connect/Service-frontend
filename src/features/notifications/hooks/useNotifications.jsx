import { useQuery } from "@tanstack/react-query";
import { notificationKeys } from "../queries/notification.keys";
import notificationService from "../services/notification.service";

export const useNotifications = (filters = {}) => {
  return useQuery({
    queryKey: notificationKeys.list(filters),
    queryFn: () => notificationService.getNotifications(filters),
    staleTime: 30 * 1000, // 30 seconds
    refetchOnWindowFocus: true,
  });
};

export default useNotifications;
