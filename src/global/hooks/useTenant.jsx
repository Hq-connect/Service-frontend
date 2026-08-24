import { getTenant } from "../services/tenant.service"
import { setTenant,setTenantLoading } from "../states/tenant.slice"
import { useDispatch,useSelector } from "react-redux"
import { useCallback } from "react";
function useTenant() {
    const dispatch = useDispatch();
    const tenant = useSelector((state) => state.tenant.tenant);
    const loading = useSelector((state) => state.tenant.loading);
    const initialized = useSelector((state) => state.tenant.initialized);

    const fetchTenant = useCallback(async () => {
        try {
          const tenant = await getTenant();
          dispatch(setTenant(tenant.data));
        } catch (error) {
          console.error("Failed to fetch tenant data:", error);
        } finally {
          dispatch(setTenantLoading(false));
        }
    },[dispatch])

    return { fetchTenant , tenant, loading,initialized };
}

export default useTenant