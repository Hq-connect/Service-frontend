import api from "@/api/api";

export const getTenant = async ()=>{
    const response = await api.get("/tenant");
    return response.data;
}

export const getUsersByTenant = async ({
    page = 1,
    limit = 20,
    search = "",
    status,
    role,
  })=>{
    const response = await api.get("/auth/users", {
      params: {
        page,
        limit,
        search,
        status,
        role,
      },
    });
    return response.data.data.users;
}