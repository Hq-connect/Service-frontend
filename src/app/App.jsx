import useTenant from "@/global/hooks/useTenant";
import Loader from "@/global/loader/Loader"
import { useEffect } from "react";

function App() {
  const { fetchTenant , loading: tenantLoading ,initialized } = useTenant();
  useEffect(()=>{
    console.log("running...");
    fetchTenant();
  },[fetchTenant])
  if(tenantLoading){
    return <Loader visible={tenantLoading} />
  }
  if(!tenantLoading && !initialized){
    return <div className="flex items-center justify-center h-screen text-red-500">This is not a valid tenant</div>
  }
  return (
    <>
      
    </>
  )
}

export default App