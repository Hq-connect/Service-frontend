import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useDispatch } from "react-redux";
import { notificationKeys } from "../queries/notification.keys";
import notificationService from "../services/notification.service";
import { setUnreadCount } from "../states/notification.slice";

export const useMarkAllAsRead = () => {
  const queryClient = useQueryClient();
  const dispatch = useDispatch();

  return useMutation({
    mutationFn: () => notificationService.markAllAsRead(),
    onMutate: () => {
      dispatch(setUnreadCount(0));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: notificationKeys.all });
    },
  });
};

export default useMarkAllAsRead;
