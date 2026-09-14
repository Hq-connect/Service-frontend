import useAuth from "@/features/auth/hooks/useAuth";
import Loader from "@/global/loader/Loader";
import { Navigate, useLocation } from "react-router-dom";

function ProtectedRoutes({ children}) {
    const { user ,loading } = useAuth();
    const location = useLocation();

    if(loading){
        return <Loader visible={loading} />;
    }
    if(!user){
        const target = location.pathname + location.search;
        return <Navigate to={`/auth/login?redirect=${encodeURIComponent(target)}`} replace />
    }
    return children;
}

export default ProtectedRoutes