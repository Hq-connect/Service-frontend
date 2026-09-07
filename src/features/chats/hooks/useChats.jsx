import { useQuery } from "@tanstack/react-query";
import dmService from "../services/dm.service";
import { chatKeys } from "../queries/chat.keys";
import groupService from "../services/group.service";

export const useChats = (type="dm") => {
    const getChats = ()=>{
        switch(type){
            case "dm":
                return dmService.getDms();
            case "group":
                return groupService.getGroups();
            default:
                throw new Error(`Unknown chat type: ${type}`);
        }
    }

    return useQuery({
        queryKey: chatKeys.list(type),
        queryFn: getChats,
        enabled: !!type,
    });
};