import api from "@/api/api";

export const getTenant = async ()=>{
    const response = await api.get("/tenant");
    return response.data;
}