import { Navigate } from "react-router-dom";
import useAuth from "@/features/auth/hooks/useAuth";
import { extractUser } from "@/global/utils/user";

export function AdminSettingsRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return null;

  const normalizedUser = extractUser(user);
  const role = normalizedUser?.role;

  if (role !== "owner" && role !== "admin") {
    return <Navigate to="/settings/profile" replace />;
  }

  return children;
}

export default AdminSettingsRoute;

