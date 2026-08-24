import useTenant from "@/global/hooks/useTenant";
import Loader from "@/global/loader/Loader"
import { useEffect } from "react";
import { RouterProvider } from "react-router-dom";
import { router } from "./router/Router";
import useAuth from "@/features/auth/hooks/useAuth";

function App() {
  const { fetchTenant , loading: tenantLoading ,initialized } = useTenant();
  const { getCurrentUser , loading: authLoading } = useAuth();
  useEffect(()=>{
    console.log("running...");
    fetchTenant();
    getCurrentUser();
  },[fetchTenant, getCurrentUser])

  if(tenantLoading || authLoading){
    return <Loader visible={tenantLoading || authLoading} />
  }
  if(!tenantLoading && !initialized){
    return <div className="flex items-center justify-center h-screen text-red-500">This is not a valid tenant</div>
  }
  
  return (
    <>
      <RouterProvider router={router} />
    </>
  )
}

export default App