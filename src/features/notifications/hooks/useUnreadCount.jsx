import { useQuery } from "@tanstack/react-query";
import { useEffect } from "react";
import { useDispatch } from "react-redux";
import { notificationKeys } from "../queries/notification.keys";
import notificationService from "../services/notification.service";
import { setUnreadCount } from "../states/notification.slice";

export const useUnreadCount = (enabled = true) => {
  const dispatch = useDispatch();

  const query = useQuery({
    queryKey: notificationKeys.unreadCount(),
    queryFn: () => notificationService.getUnreadCount(),
    enabled,
    staleTime: 20 * 1000,
    refetchOnWindowFocus: true,
  });

  useEffect(() => {
    if (typeof query.data === "number") {
      dispatch(setUnreadCount(query.data));
    }
  }, [query.data, dispatch]);

  return query;
};

export default useUnreadCount;
