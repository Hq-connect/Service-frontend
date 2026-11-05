import { useMutation } from "@tanstack/react-query";
import { useDispatch, useSelector } from "react-redux";
import { toast } from "sonner";
import memberSettingsService from "../services/memberSettings.service";
import { setUser } from "@/features/auth/states/auth.states";
import { extractUser } from "@/global/utils/user";

export const useMyProfile = () => {
  const dispatch = useDispatch();
  const rawUser = useSelector((state) => state.auth.user);
  const currentUser = extractUser(rawUser);

  const updateProfileMutation = useMutation({
    mutationFn: (profileData) => memberSettingsService.updateProfile(profileData),
    onSuccess: (updatedUser) => {
      if (updatedUser) {
        dispatch(setUser({ user: updatedUser }));
      }
      toast.success("Profile updated successfully");
    },
    onError: (err) => {
      const msg = err.response?.data?.message || "Failed to update profile";
      toast.error(msg);
    },
  });

  const uploadAvatarMutation = useMutation({
    mutationFn: (file) => memberSettingsService.updateProfile({ avatar: file }),
    onSuccess: (updatedUser) => {
      if (updatedUser) {
        dispatch(setUser({ user: updatedUser }));
      }
      toast.success("Profile photo updated successfully");
    },
    onError: (err) => {
      const msg = err.response?.data?.message || "Failed to upload profile photo";
      toast.error(msg);
    },
  });

  return {
    user: currentUser,
    profile: currentUser,
    isLoading: false,
    updateProfile: updateProfileMutation.mutateAsync,
    isUpdating: updateProfileMutation.isPending,
    isUpdatingProfile: updateProfileMutation.isPending,
    uploadAvatar: uploadAvatarMutation.mutateAsync,
    isUploadingAvatar: uploadAvatarMutation.isPending,
  };
};

export default useMyProfile;
