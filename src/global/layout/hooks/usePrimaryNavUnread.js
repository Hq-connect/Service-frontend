import { useQuery } from "@tanstack/react-query";
import chatService from "@/features/chats/services/chat.service";
import { chatKeys } from "@/features/chats/queries/chat.keys";

/**
 * Dedicated hook for tracking Primary Navigation unread chat counts.
 * Operates independently from Secondary Navigation and route state,
 * ensuring real-time badge updates across all pages (Home, Tasks, Docs, Meets, etc.).
 */
export const usePrimaryNavUnread = () => {
  const { data: totalUnread = 0, isLoading } = useQuery({
    queryKey: chatKeys.unread(),
    queryFn: chatService.getUnreadCounts,
    select: (data) => Number(data?.total || 0),
    staleTime: 0,
    refetchOnWindowFocus: true,
  });

  return { totalUnread, isLoading };
};

export default usePrimaryNavUnread;
