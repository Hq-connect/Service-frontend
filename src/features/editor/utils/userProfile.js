/**
 * Re-exporting user profile utilities from global utils
 * to maintain complete backward compatibility across all editor imports.
 */

export {
  extractUser,
  getUserDisplayName,
  getUserInitials,
  getAvatarInitials,
  getInitials,
  getCollaboratorColor,
  getUserColor,
  getAvatarStyle,
  getUserProfile,
} from "@/global/utils/user";
