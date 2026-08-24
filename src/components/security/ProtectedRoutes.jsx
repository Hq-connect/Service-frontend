import useAuth from "@/features/auth/hooks/useAuth";
import Loader from "@/global/loader/Loader";
import { Navigate } from "react-router-dom";

function ProtectedRoutes({ children}) {
    const { user ,loading } = useAuth();
    if(loading){
        return <Loader visible={loading} />;
    }
    if(!user){
        return <Navigate to="/auth/login" replace />
    }
    return children;
}

export default ProtectedRoutes