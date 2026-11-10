import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import channelService from "../services/channel.service";
import { chatKeys } from "../queries/chat.keys";

export const useDiscoverChannels = (search = "", enabled = true) => {
  return useQuery({
    queryKey: chatKeys.discoverChannels(search),
    queryFn: () => channelService.discoverChannels(search),
    enabled,
  });
};

export const useChannelDetails = (chatId, enabled = true) => {
  return useQuery({
    queryKey: chatKeys.channelDetails(chatId),
    queryFn: () => channelService.getChannelDetails(chatId),
    enabled: Boolean(enabled && chatId && !chatId.startsWith("new-")),
  });
};

export const useCreateChannel = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload) => channelService.createChannel(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: chatKeys.list("channel") });
      queryClient.invalidateQueries({ queryKey: ["chats", "channel", "discover"] });
    },
  });
};

export const useUpdateChannel = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload) => channelService.updateChannel(payload),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: chatKeys.list("channel") });
      if (variables?.chatId) {
        queryClient.invalidateQueries({
          queryKey: chatKeys.channelDetails(variables.chatId),
        });
      }
      queryClient.invalidateQueries({ queryKey: ["chats", "channel", "discover"] });
    },
  });
};

export const useJoinChannel = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (chatId) => channelService.joinChannel(chatId),
    onSuccess: (_, chatId) => {
      queryClient.invalidateQueries({ queryKey: chatKeys.list("channel") });
      if (chatId) {
        queryClient.invalidateQueries({ queryKey: chatKeys.channelDetails(chatId) });
        queryClient.invalidateQueries({ queryKey: chatKeys.members(chatId) });
      }
      queryClient.invalidateQueries({ queryKey: ["chats", "channel", "discover"] });
    },
  });
};

export const useAddChannelMembers = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ chatId, userIds }) => channelService.addInChannel(chatId, userIds),
    onSuccess: (_, variables) => {
      if (variables?.chatId) {
        queryClient.invalidateQueries({ queryKey: chatKeys.members(variables.chatId) });
        queryClient.invalidateQueries({
          queryKey: chatKeys.channelDetails(variables.chatId),
        });
      }
      queryClient.invalidateQueries({ queryKey: chatKeys.list("channel") });
    },
  });
};

export const useRemoveOrLeaveChannel = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ chatId, userId }) =>
      channelService.removeOrLeaveChannel(chatId, userId),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: chatKeys.list("channel") });
      if (variables?.chatId) {
        queryClient.invalidateQueries({ queryKey: chatKeys.members(variables.chatId) });
        queryClient.invalidateQueries({
          queryKey: chatKeys.channelDetails(variables.chatId),
        });
      }
      queryClient.invalidateQueries({ queryKey: ["chats", "channel", "discover"] });
    },
  });
};

export const useUpdateChannelMemberRole = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ chatId, userId, role }) =>
      channelService.updateMemberRole(chatId, userId, role),
    onSuccess: (_, variables) => {
      if (variables?.chatId) {
        queryClient.invalidateQueries({ queryKey: chatKeys.members(variables.chatId) });
        queryClient.invalidateQueries({
          queryKey: chatKeys.channelDetails(variables.chatId),
        });
      }
      queryClient.invalidateQueries({ queryKey: chatKeys.list("channel") });
    },
  });
};

export const usePinChannelMessage = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ chatId, messageId, pinned }) =>
      channelService.pinMessage(chatId, messageId, pinned),
    onSuccess: (_, variables) => {
      if (variables?.chatId) {
        queryClient.invalidateQueries({
          queryKey: chatKeys.channelDetails(variables.chatId),
        });
      }
      queryClient.invalidateQueries({ queryKey: chatKeys.list("channel") });
    },
  });
};

