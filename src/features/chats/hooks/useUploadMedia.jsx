import { useMutation } from "@tanstack/react-query";
import mediaService from "../services/media.service";

export const useUploadMedia = () => {
  return useMutation({
    mutationFn: (files) => mediaService.uploadFiles(files),
  });
};
