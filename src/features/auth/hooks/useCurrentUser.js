import { useSelector } from "react-redux";
import { extractUser } from "@/global/utils/user";

/**
 * Convenience hook that normalises the auth Redux state into a stable
 * { currentUser, currentUserId } shape. Replaces the copy-pasted pattern:
 *
 *   const { user } = useAuth();
 *   const currentUser = user?.user || user?.data || user;
 *   const currentUserId = currentUser?._id || currentUser?.id;
 *
 * Use this hook instead of useAuth() whenever you only need the current user
 * identity (not login/logout/register actions).
 */
export function useCurrentUser() {
  const rawUser = useSelector((state) => state.auth?.user);
  const loading = useSelector((state) => state.auth?.loading ?? false);

  const currentUser = extractUser(rawUser);
  const currentUserId = currentUser?._id || currentUser?.id || null;

  return { currentUser, currentUserId, loading };
}

export default useCurrentUser;
