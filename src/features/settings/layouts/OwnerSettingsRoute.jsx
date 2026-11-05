import { Navigate } from "react-router-dom";
import useAuth from "@/features/auth/hooks/useAuth";
import { extractUser } from "@/global/utils/user";

export function OwnerSettingsRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return null;

  if (extractUser(user)?.role !== "owner") {
    return <Navigate to="/settings/profile" replace />;
  }

  return children;
}

export default OwnerSettingsRoute;

