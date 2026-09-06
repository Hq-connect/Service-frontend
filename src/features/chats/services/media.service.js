import api from "@/api/api";

const mediaService = {
  uploadFiles: async (files) => {
    const formData = new FormData();
    files.forEach((file) => {
      formData.append("files", file);
    });

    const response = await api.post("/chats/media/upload", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });

    return response.data.data.attachments;
  },
};

export default mediaService;
